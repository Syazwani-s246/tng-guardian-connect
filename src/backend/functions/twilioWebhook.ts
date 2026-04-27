import { dynamo, TABLES } from "../lib/dynamodb";
import { GetCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export async function twilioWebhook(event: {
  body: string;
  isBase64Encoded: boolean;
}) {
  try {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf-8")
      : event.body;

    const update = JSON.parse(rawBody);

    if (!update.callback_query) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true }),
      };
    }

    const callbackData = update.callback_query.data as string;
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;
    const callbackQueryId = update.callback_query.id;
    const [action, txnId] = callbackData.split(":");

    if (!action || !txnId) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true }),
      };
    }

    const guardianDecision = action === "approve" ? "APPROVED" : "BLOCKED";

    // 1. answer callback immediately to remove loading spinner on button
    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: action === "approve" ? "✅ Transaction Approved!" : "🚫 Transaction Blocked!",
        }),
      }
    );

    // 2. edit message to remove buttons and show final decision
    const decisionText =
      action === "approve"
        ? "✅ *Transaction APPROVED by Guardian*\n\nThe transaction has been approved and will proceed."
        : "🚫 *Transaction BLOCKED by Guardian*\n\nThe transaction has been blocked. The user will be notified.";

    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: decisionText,
          parse_mode: "Markdown",
        }),
      }
    );

    // 3. find the transaction by txnId using scan
    // (we don't know the timestamp sort key from webhook)
    const scanResult = await dynamo.send(
      new ScanCommand({
        TableName: TABLES.TRANSACTIONS,
        FilterExpression: "txnId = :tid",
        ExpressionAttributeValues: { ":tid": txnId },
        Limit: 1,
      })
    );

    const txn = scanResult.Items?.[0];

    if (txn) {
      // 4. update transaction with guardian decision
      await dynamo.send(
        new UpdateCommand({
          TableName: TABLES.TRANSACTIONS,
          Key: { txnId: txn.txnId, timestamp: txn.timestamp },
          UpdateExpression:
            "SET guardianDecision = :d, guardianDecidedAt = :t, #dec = :nd",
          ExpressionAttributeNames: { "#dec": "decision" },
          ExpressionAttributeValues: {
            ":d": guardianDecision,
            ":t": new Date().toISOString(),
            ":nd": guardianDecision,
          },
        })
      );
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    };
  } catch (error) {
    console.error("Webhook error:", error);
    return {
      statusCode: 200, // always return 200 to Telegram
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    };
  }
}