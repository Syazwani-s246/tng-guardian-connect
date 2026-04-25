import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, TABLES } from "../lib/dynamodb";

export async function getAuditLog(event: { userId: string }) {
  const { userId } = event;

  // scan transactions for this user
  // in production you'd add a GSI on senderId — for hackathon scan is fine
  const result = await dynamo.send(
    new ScanCommand({
      TableName: TABLES.TRANSACTIONS,
      FilterExpression: "senderId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
    })
  );

  const transactions = (result.Items ?? []).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return {
    userId,
    total: transactions.length,
    transactions: transactions.map((t) => ({
      txnId: t.txnId,
      receiverName: t.receiverName,
      receiverPhone: t.receiverPhone,
      amount: t.amount,
      decision: t.decision,
      decisionBy: t.decisionBy,
      reason: t.reason,
      reasonBM: t.reasonBM,
      riskScore: t.riskScore,
      confidence: t.confidence ?? null,
      timestamp: t.timestamp,
      reported: t.reported ?? false,
      canReport: !t.reported && isWithin7Days(t.timestamp),
      auditVerdict: t.auditVerdict ?? null,
      auditReason: t.auditReason ?? null,
      auditReasonBM: t.auditReasonBM ?? null,
      consistencyScore: t.consistencyScore ?? null,
    })),
  };
}

function isWithin7Days(timestamp: string): boolean {
  const txnDate = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - txnDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}