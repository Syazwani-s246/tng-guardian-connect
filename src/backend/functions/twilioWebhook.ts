const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

interface TelegramWebhookEvent {
  body: string;
  isBase64Encoded: boolean;
}

interface TelegramWebhookResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Handle inbound Telegram messages from the guardian (APPROVE / REJECT).
 * Telegram sends JSON with an "update" object containing the message.
 */
export async function twilioWebhook(
  event: TelegramWebhookEvent
): Promise<TelegramWebhookResponse> {
  const jsonHeaders = { "Content-Type": "application/json" };

  try {
    let rawBody = event.body;
    if (event.isBase64Encoded) {
      rawBody = Buffer.from(rawBody, "base64").toString("utf-8");
    }

    const update = JSON.parse(rawBody);
    const message = update.message;

    if (!message || !message.text) {
      return {
        statusCode: 200,
        headers: jsonHeaders,
        body: JSON.stringify({ ok: true }),
      };
    }

    const chatId = message.chat.id;
    const text = message.text.trim().toUpperCase();

    console.log("Telegram webhook received:", { chatId, text });

    let replyText: string;

    if (text === "APPROVE") {
      replyText = "✅ Transaction APPROVED. The transfer will proceed. Thank you!";
    } else if (text === "REJECT") {
      replyText = "❌ Transaction REJECTED. The transfer has been blocked. Thank you!";
    } else {
      replyText = "Please reply APPROVE or REJECT to respond to the transaction request.";
    }

    // Send reply back via Telegram Bot API
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: replyText,
      }),
    });

    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: true }),
    };
  }
}
