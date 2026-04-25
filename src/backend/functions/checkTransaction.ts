import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, TABLES } from "../lib/dynamodb";
import { invokeGuardianLLM, invokeAuditorLLM, TransactionContext } from "../lib/bedrock";
import type { AuditContext } from "@/types/transaction";
import { v4 as uuidv4 } from "uuid";

// Simulates XGBoost risk scoring
function simulateXGBoost(params: {
  amount: number;
  receiverPhone: string;
  strikeCount: number;
  userAvgTransaction: number;
  isKnownContact: boolean;
  isBusinessName: boolean;
}): number {
  let score = 0.1; // base score

  // amount deviation from user average
  if (params.userAvgTransaction > 0) {
    const ratio = params.amount / params.userAvgTransaction;
    if (ratio > 5) score += 0.4;
    else if (ratio > 3) score += 0.25;
    else if (ratio > 2) score += 0.1;
  }

  // receiver reputation
  if (params.strikeCount >= 3) score += 0.5;
  else if (params.strikeCount >= 1) score += 0.2;

  // known contact or business = safer
  if (params.isKnownContact) score -= 0.3;
  if (params.isBusinessName) score -= 0.2;

  // clamp between 0 and 1
  return Math.min(1, Math.max(0, score));
}

function isBusinessName(name: string): boolean {
  const businessKeywords = [
    "sdn bhd", "sdn. bhd", "berhad", "enterprise", "trading",
    "shop", "store", "mart", "restaurant", "cafe", "kedai",
    "holdings", "group", "services", "solution", "tech",
  ];
  return businessKeywords.some((kw) =>
    name.toLowerCase().includes(kw)
  );
}

export async function checkTransaction(event: {
  senderId: string;
  receiverPhone: string;
  receiverName: string;
  amount: number;
}) {
  const { senderId, receiverPhone, receiverName, amount } = event;
  const txnId = uuidv4();
  const timestamp = new Date().toISOString();

  // 1. get sender profile
  const userResult = await dynamo.send(
    new GetCommand({
      TableName: TABLES.USERS,
      Key: { userId: senderId },
    })
  );
  const user = userResult.Item;
  if (!user) throw new Error("User not found");

  // 2. get receiver reputation
  const reputationResult = await dynamo.send(
    new GetCommand({
      TableName: TABLES.RECEIVER_REPUTATION,
      Key: { receiverPhone },
    })
  );
  const reputation = reputationResult.Item;
  const strikeCount = reputation?.strikeCount ?? 0;

  // 3. check if known contact
  const isKnownContact = (user.contacts ?? []).includes(receiverPhone);
  const isBusiness = isBusinessName(receiverName);

  // 4. bypass rule — known contact or business name
  if (isKnownContact || isBusiness) {
    const txn = {
      txnId,
      senderId,
      receiverPhone,
      receiverName,
      amount,
      riskScore: 0.05,
      decision: "APPROVED",
      decisionBy: "BYPASS",
      reason: isBusiness
        ? "Receiver identified as business"
        : "Receiver is a known contact",
      reasonBM: "Penerima dikenali. Transaksi diluluskan.",
      timestamp,
      reported: false,
      auditVerdict: null,
      auditReason: null,
      auditReasonBM: null,
      consistencyScore: null,
    };

    await dynamo.send(new PutCommand({ TableName: TABLES.TRANSACTIONS, Item: txn }));
    await logAudit(txnId, "BYPASS", txn.reason, timestamp);

    return { txnId, decision: "APPROVED", bypass: true, reason: txn.reason };
  }

  // 5. simulate XGBoost score
  const xgboostScore = simulateXGBoost({
    amount,
    receiverPhone,
    strikeCount,
    userAvgTransaction: user.avgTransactionAmount ?? 100,
    isKnownContact,
    isBusinessName: isBusiness,
  });

  // 6. clear cases — no LLM needed
  if (xgboostScore < 0.3) {
    const txn = {
      txnId, senderId, receiverPhone, receiverName, amount,
      riskScore: xgboostScore,
      decision: "APPROVED",
      decisionBy: "XGBOOST",
      reason: "Risk score below threshold — transaction is safe",
      reasonBM: "Transaksi ini selamat. Tiada aktiviti mencurigakan dikesan.",
      timestamp,
      reported: false,
      timerExpiry: null,
      auditVerdict: null,
      auditReason: null,
      auditReasonBM: null,
      consistencyScore: null,
    };
    await dynamo.send(new PutCommand({ TableName: TABLES.TRANSACTIONS, Item: txn }));
    await logAudit(txnId, "XGBOOST", txn.reason, timestamp);
    return { txnId, decision: "APPROVED", xgboostScore, bypass: false };
  }

  if (xgboostScore > 0.8) {
    const txn = {
      txnId, senderId, receiverPhone, receiverName, amount,
      riskScore: xgboostScore,
      decision: "BLOCKED",
      decisionBy: "XGBOOST",
      reason: "Risk score above threshold — transaction blocked automatically",
      reasonBM: "Transaksi ini disekat kerana aktiviti mencurigakan dikesan. Sila hubungi penjaga anda.",
      timestamp,
      reported: false,
      timerExpiry: null,
      auditVerdict: null,
      auditReason: null,
      auditReasonBM: null,
      consistencyScore: null,
    };
    await dynamo.send(new PutCommand({ TableName: TABLES.TRANSACTIONS, Item: txn }));
    await logAudit(txnId, "XGBOOST", txn.reason, timestamp);
    return { txnId, decision: "BLOCKED", xgboostScore, bypass: false };
  }

  // 7. grey zone (0.3 - 0.8) — check guardian mode
  const guardianMode = user.guardianMode ?? "AI";
  const timerExpiry = new Date(Date.now() + 3 * 60 * 1000).toISOString(); // 3 minutes

  if (guardianMode === "AI") {
    // no human guardian — go straight to LLM
    const context: TransactionContext = {
      txnId, senderId, receiverPhone, receiverName, amount,
      xgboostScore, strikeCount,
      userProfile: {
        age: user.age ?? 0,
        incometier: user.incomeTier ?? "unknown",
        guardianMode,
      },
      recentHistory: JSON.stringify(user.recentTransactions ?? []),
    };

    const llmDecision = await invokeGuardianLLM(context);

    const auditContext: AuditContext = {
      txnId,
      transactionDetails: {
        amount,
        receiverPhone,
        receiverName,
        xgboostScore,
        strikeCount,
      },
      layer2Decision: llmDecision,
    };
    const auditResult = await invokeAuditorLLM(auditContext);

    const txn = {
      txnId, senderId, receiverPhone, receiverName, amount,
      riskScore: xgboostScore,
      decision: llmDecision.decision,
      decisionBy: "AI_GUARDIAN",
      reason: llmDecision.reason,
      reasonBM: llmDecision.reasonBM,
      confidence: llmDecision.confidence,
      timestamp,
      reported: false,
      timerExpiry: null,
      auditVerdict: auditResult.auditVerdict,
      auditReason: auditResult.auditReason,
      auditReasonBM: auditResult.auditReasonBM,
      consistencyScore: auditResult.consistencyScore,
    };
    await dynamo.send(new PutCommand({ TableName: TABLES.TRANSACTIONS, Item: txn }));
    await logAudit(txnId, "AI_GUARDIAN", llmDecision.reason, timestamp);
    return { txnId, decision: llmDecision.decision, xgboostScore, llmDecision, bypass: false };
  }

  // family or community guardian — start 3 minute timer, notify guardian
  const txn = {
    txnId, senderId, receiverPhone, receiverName, amount,
    riskScore: xgboostScore,
    decision: "PENDING",
    decisionBy: "AWAITING_GUARDIAN",
    reason: "Grey zone — awaiting guardian decision",
    reasonBM: "Transaksi ini sedang disemak oleh penjaga anda. Sila tunggu.",
    timestamp,
    reported: false,
    timerExpiry,
    guardianId: user.guardianId ?? null,
    auditVerdict: null,
    auditReason: null,
    auditReasonBM: null,
    consistencyScore: null,
  };
  await dynamo.send(new PutCommand({ TableName: TABLES.TRANSACTIONS, Item: txn }));
  await logAudit(txnId, "AWAITING_GUARDIAN", txn.reason, timestamp);

  return {
    txnId,
    decision: "PENDING",
    xgboostScore,
    timerExpiry,
    guardianId: user.guardianId,
    bypass: false,
  };
}

async function logAudit(
  txnId: string,
  decisionBy: string,
  reason: string,
  timestamp: string
) {
  await dynamo.send(
    new PutCommand({
      TableName: TABLES.AUDIT_LOG,
      Item: { txnId, decisionBy, reason, timestamp },
    })
  );
}