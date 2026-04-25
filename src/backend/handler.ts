import { checkTransaction } from "./functions/checkTransaction";
import { guardianDecision } from "./functions/guardianDecision";
import { linkGuardian } from "./functions/linkGuardian";
import { getAuditLog } from "./functions/getAuditLog";
import { reportReceiver } from "./functions/reportReceiver";

export const handler = async (event: any) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // handle CORS preflight
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