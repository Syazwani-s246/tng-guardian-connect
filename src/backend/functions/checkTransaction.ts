import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, TABLES } from "../lib/dynamodb";
import { invokeGuardianLLM, TransactionContext } from "../lib/bedrock";
import { runGuardrail } from "../lib/qwen";
import { sendGuardianWhatsApp } from "../lib/twilio";
import { v4 as uuidv4 } from "uuid";

// ─── Layer 1: XGBoost Simulation ─────────────────────────────────────────────

function simulateXGBoost(params: {
  amount: number;
  receiverPhone: string;
  strikeCount: number;
  userAvgTransaction: number;
  isKnownContact: boolean;
  isBusinessName: boolean;
}): number {
  let score = 0.1;

  // amount deviation from user average
  if (params.userAvgTransaction > 0) {
    const ratio = params.amount / params.userAvgTransaction;
    if (ratio > 5) score += 0.4;
    else if (ratio > 3) score += 0.25;
    else if (ratio > 2) score += 0.1;
  }

  // receiver reputation strikes
  if (params.strikeCount >= 3) score += 0.5;
  else if (params.strikeCount >= 1) score += 0.2;

  // known contact or business = safer
  if (params.isKnownContact) score -= 0.3;
  if (params.isBusinessName) score -= 0.2;

  // clamp between 0 and 1
  return Math.min(1, Math.max(0, score));
}

function isBusinessName(name: string): boolean {
  const keywords = [
    "sdn bhd", "sdn. bhd", "berhad", "enterprise", "trading",
    "shop", "store", "mart", "restaurant", "cafe", "kedai",
    "holdings", "group", "services", "solution", "tech",
    "pharmacy", "clinic", "hospital", "farmasi",
  ];
  return keywords.some((kw) => name.toLowerCase().includes(kw));
}

// ─── Audit Logger ─────────────────────────────────────────────────────────────

async function logAudit(
  txnId: string,
  decisionBy: string,
  reason: string,
  timestamp: string,
  extra?: Record<string, any>
) {
  await dynamo.send(
    new PutCommand({
      TableName: TABLES.AUDIT_LOG,
      Item: { txnId, decisionBy, reason, timestamp, ...extra },
    })
  );
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function checkTransaction(event: {
  senderId: string;
  receiverPhone: string;
  receiverName: string;
  amount: number;
}) {
  const { senderId, receiverPhone, receiverName, amount } = event;
  const txnId = uuidv4();
  const timestamp = new Date().toISOString();

  // ── Fetch user profile ──────────────────────────────────────────────────────
  const userResult = await dynamo.send(
    new GetCommand({
      TableName: TABLES.USERS,
      Key: { userId: senderId },
    })
  );
  const user = userResult.Item;
  if (!user) throw new Error("User not found");

  // ── Fetch receiver reputation ───────────────────────────────────────────────
  const reputationResult = await dynamo.send(
    new GetCommand({
      TableName: TABLES.RECEIVER_REPUTATION,
      Key: { receiverPhone },
    })
  );
  const strikeCount = reputationResult.Item?.strikeCount ?? 0;
  const userAvgTransaction = user.avgTransactionAmount ?? 100;

  // ── Bypass checks ───────────────────────────────────────────────────────────
  const isKnownContact = (user.contacts ?? []).includes(receiverPhone);
  const isBusiness = isBusinessName(receiverName);

  if (isKnownContact || isBusiness) {
    const bypassReason = isBusiness
      ? "Receiver identified as business name"
      : "Receiver is a known contact";

    const txn = {
      txnId, senderId, receiverPhone, receiverName, amount,
      riskScore: 0.05,
      decision: "APPROVED",
      decisionBy: "BYPASS",
      reason: bypassReason,
      reasonBM: "Penerima dikenali. Transaksi diluluskan secara automatik.",
      timestamp,
      reported: false,
      layer1_xgboost: null,
      layer2_llm: null,
      layer3_guardrail: null,
    };

    await dynamo.send(new PutCommand({ TableName: TABLES.TRANSACTIONS, Item: txn }));
    await logAudit(txnId, "BYPASS", bypassReason, timestamp);

    return {
      txnId,
      decision: "APPROVED",
      decisionBy: "BYPASS",
      reason: bypassReason,
      reasonBM: txn.reasonBM,
      bypass: true,
    };
  }

  // ── Send Telegram notification to guardian for every transaction ──────────
  sendGuardianWhatsApp({ txnId, senderId, receiverName, amount })
    .then((res) => {
      if (res.success) {
        console.log("Telegram notification sent:", res.messageSid);
      } else {
        console.error("Telegram notification failed:", res.error);
      }
    })
    .catch((err) => console.error("Telegram notification error:", err));

  // ─────────────────────────────────────────────────────────────────────────────
  // LAYER 1 — XGBoost Risk Scoring
  // ─────────────────────────────────────────────────────────────────────────────

  const xgboostScore = simulateXGBoost({
    amount,
    receiverPhone,
    strikeCount,
    userAvgTransaction,
    isKnownContact,
    isBusinessName: isBusiness,
  });

  const layer1Result = {
    score: xgboostScore,
    strikeCount,
    amountDeviation: parseFloat((amount / userAvgTransaction).toFixed(2)),
    verdict:
      xgboostScore < 0.3 ? "SAFE" : xgboostScore > 0.8 ? "RISKY" : "GREY_ZONE",
  };

  // clear safe case
  if (xgboostScore < 0.3) {
    const txn = {
      txnId, senderId, receiverPhone, receiverName, amount,
      riskScore: xgboostScore,
      decision: "APPROVED",
      decisionBy: "XGBOOST",
      reason: "XGBoost score below 0.3 — transaction is safe",
      reasonBM: "Transaksi ini selamat. Tiada aktiviti mencurigakan dikesan.",
      timestamp,
      reported: false,
      layer1_xgboost: layer1Result,
      layer2_llm: null,
      layer3_guardrail: null,
    };

    await dynamo.send(new PutCommand({ TableName: TABLES.TRANSACTIONS, Item: txn }));
    await logAudit(txnId, "XGBOOST", txn.reason, timestamp, { xgboostScore });

    return {
      txnId,
      decision: "APPROVED",
      decisionBy: "XGBOOST",
      xgboostScore,
      reason: txn.reason,
      reasonBM: txn.reasonBM,
      bypass: false,
      layer1: layer1Result,
    };
  }

  // clear risky case
  if (xgboostScore > 0.8) {
    const txn = {
      txnId, senderId, receiverPhone, receiverName, amount,
      riskScore: xgboostScore,
      decision: "BLOCKED",
      decisionBy: "XGBOOST",
      reason: "XGBoost score above 0.8 — transaction blocked automatically",
      reasonBM: "Transaksi ini disekat kerana risiko tinggi dikesan. Sila hubungi sokongan TNG jika anda memerlukannya.",
      timestamp,
      reported: false,
      layer1_xgboost: layer1Result,
      layer2_llm: null,
      layer3_guardrail: null,
    };

    await dynamo.send(new PutCommand({ TableName: TABLES.TRANSACTIONS, Item: txn }));
    await logAudit(txnId, "XGBOOST", txn.reason, timestamp, { xgboostScore });

    return {
      txnId,
      decision: "BLOCKED",
      decisionBy: "XGBOOST",
      xgboostScore,
      reason: txn.reason,
      reasonBM: txn.reasonBM,
      bypass: false,
      layer1: layer1Result,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LAYER 2 — Primary LLM (AWS Bedrock Nova Lite)
  // Grey zone: 0.3 - 0.8
  // ─────────────────────────────────────────────────────────────────────────────

  const llmContext: TransactionContext = {
    txnId,
    senderId,
    receiverPhone,
    receiverName,
    amount,
    xgboostScore,
    strikeCount,
    userProfile: {
      age: user.age ?? 0,
      incometier: user.incomeTier ?? "unknown",
      guardianMode: "AI",
    },
    recentHistory: JSON.stringify(user.recentTransactions ?? []),
  };

  let llmDecision;
  try {
    llmDecision = await invokeGuardianLLM(llmContext);
  } catch (llmError) {
    console.error("Layer 2 LLM error:", llmError);
    // if LLM fails, default to HOLD
    const txn = {
      txnId, senderId, receiverPhone, receiverName, amount,
      riskScore: xgboostScore,
      decision: "HOLD",
      decisionBy: "AI_GUARDIAN",
      reason: "Primary LLM unavailable — transaction held for safety",
      reasonBM: "Sistem AI tidak dapat membuat keputusan. Transaksi ditahan buat sementara.",
      timestamp,
      reported: false,
      layer1_xgboost: layer1Result,
      layer2_llm: { error: String(llmError) },
      layer3_guardrail: null,
    };
    await dynamo.send(new PutCommand({ TableName: TABLES.TRANSACTIONS, Item: txn }));
    await logAudit(txnId, "AI_GUARDIAN", txn.reason, timestamp);
    return { txnId, decision: "HOLD", decisionBy: "AI_GUARDIAN", xgboostScore, bypass: false };
  }

  const layer2Result = {
    decision: llmDecision.decision,
    confidence: llmDecision.confidence,
    evidence_used: llmDecision.evidence_used,
    reason: llmDecision.reason,
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // LAYER 3 — Guardrail (Alibaba Cloud Qwen)
  // Audits Layer 2 output for hallucinations
  // ─────────────────────────────────────────────────────────────────────────────

  let guardrailResult;
  try {
    guardrailResult = await runGuardrail(llmDecision, {
      txnId,
      amount,
      receiverPhone,
      receiverName,
      xgboostScore,
      strikeCount,
      userAvgTransaction,
      age: user.age ?? 0,
      incomeTier: user.incomeTier ?? "unknown",
    });
  } catch (guardrailError) {
    console.error("Layer 3 guardrail error:", guardrailError);
    // if guardrail fails, trust LLM but flag it
    guardrailResult = {
      verdict: "ESCALATE" as const,
      finalDecision: "HOLD" as const,
      reason: "Guardrail unavailable — defaulting to HOLD",
      reasonBM: "Sistem pengesahan tidak tersedia. Transaksi ditahan untuk keselamatan.",
      guardrailNotes: `Guardrail error: ${guardrailError}`,
    };
  }

  const layer3Result = {
    verdict: guardrailResult.verdict,
    finalDecision: guardrailResult.finalDecision,
    guardrailNotes: guardrailResult.guardrailNotes,
  };

  // ── Store final transaction ─────────────────────────────────────────────────
  const txn = {
    txnId,
    senderId,
    receiverPhone,
    receiverName,
    amount,
    riskScore: xgboostScore,
    decision: guardrailResult.finalDecision,
    decisionBy: "AI_GUARDIAN",
    reason: guardrailResult.reason,
    reasonBM: guardrailResult.reasonBM,
    confidence: llmDecision.confidence,
    timestamp,
    reported: false,
    timerExpiry: null,
    layer1_xgboost: layer1Result,
    layer2_llm: layer2Result,
    layer3_guardrail: layer3Result,
  };

  await dynamo.send(new PutCommand({ TableName: TABLES.TRANSACTIONS, Item: txn }));
  await logAudit(txnId, "AI_GUARDIAN", guardrailResult.reason, timestamp, {
    xgboostScore,
    llmDecision: llmDecision.decision,
    guardrailVerdict: guardrailResult.verdict,
  });

  // ── Return full pipeline result ─────────────────────────────────────────────
  return {
    txnId,
    decision: guardrailResult.finalDecision,
    decisionBy: "AI_GUARDIAN",
    reasonBM: guardrailResult.reasonBM,
    bypass: false,
    pipeline: {
      layer1_xgboost: layer1Result,
      layer2_bedrock: layer2Result,
      layer3_qwen: layer3Result,
    },
  };
}