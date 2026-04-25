import { checkTransaction } from "./functions/checkTransaction";
import { guardianDecision } from "./functions/guardianDecision";
import { linkGuardian } from "./functions/linkGuardian";
import { getAuditLog } from "./functions/getAuditLog";
import { reportReceiver } from "./functions/reportReceiver";
import { twilioWebhook } from "./functions/twilioWebhook";

export const handler = async (event: any) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const method = event.requestContext?.http?.method;
  const rawPath = event.requestContext?.http?.path ?? "";
  const path = rawPath.replace(/^\/prod/, "");

  try {
    let result;
    const body = event.body ? JSON.parse(event.body) : {};

    // POST /transaction/check
    if (method === "POST" && path === "/transaction/check") {
      result = await checkTransaction(body);
    }

    // POST /transaction/decision
    else if (method === "POST" && path === "/transaction/decision") {
      result = await guardianDecision(body);
    }

    // POST /guardian/link
    else if (method === "POST" && path === "/guardian/link") {
      result = await linkGuardian(body);
    }

    // GET /audit/:userId
    else if (method === "GET" && path.startsWith("/audit/")) {
      const userId = path.split("/audit/")[1];
      result = await getAuditLog({ userId });
    }

    // POST /receiver/report
    else if (method === "POST" && path === "/receiver/report") {
      result = await reportReceiver(body);
    }

    // POST /guardian/alert
    else if (method === "POST" && path === "/guardian/alert") {
      const { sendPendingAlert } = await import("./lib/twilio");
      await sendPendingAlert({
        receiverName: body.receiverName,
        receiverPhone: body.receiverPhone,
        amount: body.amount,
      });
      result = { success: true };
    }

    // GET /transaction/status/:txnId — frontend polls this for guardian decision
    else if (method === "GET" && path.startsWith("/transaction/status/")) {
      const txnId = path.split("/transaction/status/")[1];
      const { ScanCommand } = await import("@aws-sdk/lib-dynamodb");
      const { dynamo, TABLES } = await import("./lib/dynamodb");

      const scanResult = await dynamo.send(
        new ScanCommand({
          TableName: TABLES.TRANSACTIONS,
          FilterExpression: "txnId = :tid",
          ExpressionAttributeValues: { ":tid": txnId },
          Limit: 1,
        })
      );

      const txn = scanResult.Items?.[0];
      result = {
        txnId,
        guardianDecision: txn?.guardianDecision ?? null,
        decision: txn?.decision ?? null,
        found: !!txn,
      };
    }

    // POST /webhook/telegram
    else if (
      method === "POST" &&
      (path === "/webhook/telegram" || path === "/webhook/twilio")
    ) {
      const webhookResult = await twilioWebhook({
        body: event.body ?? "",
        isBase64Encoded: event.isBase64Encoded ?? false,
      });
      return {
        statusCode: webhookResult.statusCode,
        headers: { ...headers, ...webhookResult.headers },
        body: webhookResult.body,
      };
    }

    else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Route not found" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error("Handler error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message ?? "Internal server error" }),
    };
  }
};