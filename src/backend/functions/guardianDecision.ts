import { GetCommand, UpdateCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, TABLES } from "../lib/dynamodb";
import { invokeGuardianLLM, TransactionContext } from "../lib/bedrock";

export async function guardianDecision(event: {
  txnId: string;
  guardianId: string;
  decision: "APPROVE" | "BLOCK";
}) {
  const { txnId, guardianId, decision } = event;
  const timestamp = new Date().toISOString();

  // 1. get transaction
  const txnResult = await dynamo.send(
    new GetCommand({
      TableName: TABLES.TRANSACTIONS,
      Key: { txnId, timestamp },
    })
  );
  const txn = txnResult.Item;
  if (!txn) throw new Error("Transaction not found");
  if (txn.decision !== "PENDING" && txn.decision !== "PENDING_GUARDIAN") throw new Error("Transaction already decided");

  // 2. check timer — if expired, fall back to AI
  const now = new Date();
  const expiry = new Date(txn.timerExpiry);

  if (now > expiry) {
    // timer expired — escalate to LLM
    const userResult = await dynamo.send(
      new GetCommand({ TableName: TABLES.USERS, Key: { userId: txn.senderId } })
    );
    const user = userResult.Item ?? {};

    const reputationResult = await dynamo.send(
      new GetCommand({
        TableName: TABLES.RECEIVER_REPUTATION,
        Key: { receiverPhone: txn.receiverPhone },
      })
    );
    const strikeCount = reputationResult.Item?.strikeCount ?? 0;

    const context: TransactionContext = {
      txnId,
      senderId: txn.senderId,
      receiverPhone: txn.receiverPhone,
      receiverName: txn.receiverName,
      amount: txn.amount,
      xgboostScore: txn.riskScore,
      strikeCount,
      userProfile: {
        age: user.age ?? 0,
        incometier: user.incomeTier ?? "unknown",
        guardianMode: user.guardianMode ?? "AI",
      },
      recentHistory: JSON.stringify(user.recentTransactions ?? []),
    };

    const llmDecision = await invokeGuardianLLM(context);

    await dynamo.send(
      new UpdateCommand({
        TableName: TABLES.TRANSACTIONS,
        Key: { txnId, timestamp: txn.timestamp },
        UpdateExpression:
          "SET #decision = :d, decisionBy = :by, reason = :r, reasonBM = :rbm, decidedAt = :da",
        ExpressionAttributeNames: { "#decision": "decision" },
        ExpressionAttributeValues: {
          ":d": llmDecision.decision,
          ":by": txn.decision === "PENDING_GUARDIAN" ? "AI_FALLBACK_TWILIO" : "AI_FALLBACK",
          ":r": llmDecision.reason,
          ":rbm": llmDecision.reasonBM,
          ":da": timestamp,
        },
      })
    );

    if (txn.decision === "PENDING_GUARDIAN") {
      await dynamo.send(new PutCommand({
        TableName: TABLES.AUDIT_LOG,
        Item: {
          txnId,
          decisionBy: "AI_FALLBACK_TWILIO",
          reason: "Guardian did not respond via WhatsApp within 90-second timeout period",
          timestamp,
        },
      }));
    }

    // update rewards — no points since guardian didn't respond
    return {
      txnId,
      decision: llmDecision.decision,
      decisionBy: txn.decision === "PENDING_GUARDIAN" ? "AI_FALLBACK_TWILIO" : "AI_FALLBACK",
      message: txn.decision === "PENDING_GUARDIAN"
        ? "Guardian did not respond via WhatsApp in time. AI made the decision."
        : "Guardian did not respond in time. AI made the decision.",
    };
  }

  // 3. guardian responded in time — apply decision
  const finalDecision = decision === "APPROVE" ? "APPROVED" : "BLOCKED";
  const reason =
    decision === "APPROVE"
      ? "Guardian approved the transaction"
      : "Guardian blocked the transaction";
  const reasonBM =
    decision === "APPROVE"
      ? "Penjaga anda telah meluluskan transaksi ini."
      : "Penjaga anda telah menyekat transaksi ini.";

  await dynamo.send(
    new UpdateCommand({
      TableName: TABLES.TRANSACTIONS,
      Key: { txnId, timestamp: txn.timestamp },
      UpdateExpression:
        "SET #decision = :d, decisionBy = :by, reason = :r, reasonBM = :rbm, decidedAt = :da",
      ExpressionAttributeNames: { "#decision": "decision" },
      ExpressionAttributeValues: {
        ":d": finalDecision,
        ":by": txn.decision === "PENDING_GUARDIAN" ? `TWILIO_GUARDIAN#${guardianId}` : `GUARDIAN#${guardianId}`,
        ":r": reason,
        ":rbm": reasonBM,
        ":da": timestamp,
      },
    })
  );

  // 4. award GORewards points to guardian
  await dynamo.send(
    new UpdateCommand({
      TableName: TABLES.REWARDS,
      Key: { guardianId },
      UpdateExpression:
        "ADD points :p SET lastActivity = :la",
      ExpressionAttributeValues: {
        ":p": 10,
        ":la": timestamp,
      },
    })
  );

  return { txnId, decision: finalDecision, decisionBy: txn.decision === "PENDING_GUARDIAN" ? `TWILIO_GUARDIAN#${guardianId}` : `GUARDIAN#${guardianId}` };
}