import mockData from "@/data/mockData.json";

const API_BASE = "https://vmctgel4cf.execute-api.ap-southeast-1.amazonaws.com/prod";
const SENDER_ID = "test-user-001"; // hardcoded for demo

// ─── Real API calls ───────────────────────────────────────────────────────────

export async function checkTransaction(params: {
  receiverPhone: string;
  receiverName: string;
  amount: number;
}) {
  const res = await fetch(`${API_BASE}/transaction/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      senderId: SENDER_ID,
      receiverPhone: params.receiverPhone,
      receiverName: params.receiverName || "Unknown Recipient",
      amount: params.amount,
    }),
  });

  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function getAuditLog() {
  const res = await fetch(`${API_BASE}/audit/${SENDER_ID}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function reportTransaction(params: {
  txnId: string;
  timestamp: string;
  isScam: boolean;
}) {
  const res = await fetch(`${API_BASE}/receiver/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      txnId: params.txnId,
      timestamp: params.timestamp,
      reporterId: SENDER_ID,
      isScam: params.isScam,
    }),
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}

// ─── Mock fallbacks (keep for non-wired screens) ─────────────────────────────

export async function getUser() {
  return mockData.user;
}

export async function getDemoTransaction() {
  return mockData.demo_transaction;
}

export async function getRecentTransactions() {
  return mockData.recent_transactions;
}

export async function getVerifiedRecipients() {
  return mockData.verified_recipients;
}

// ─── Helper: map API response to risk-score screen format ────────────────────

export function mapApiResponseToRiskScore(apiResponse: any, params: {
  receiverPhone: string;
  receiverName: string;
  amount: number;
}) {
  const pipeline = apiResponse.pipeline;
  const decision = apiResponse.decision;

  // get xgboost score from pipeline if available, otherwise infer from decision
  let xgboostScore = pipeline?.layer1_xgboost?.score ?? null;

  if (xgboostScore === null) {
    // infer from decision when pipeline not returned (bypass or clear cases)
    if (decision === "BLOCKED") xgboostScore = 0.9;
    else if (decision === "APPROVED" && apiResponse.bypass) xgboostScore = 0.05;
    else if (decision === "APPROVED") xgboostScore = 0.15;
    else xgboostScore = 0.5;
  }

  // also get from layer1 directly if present
  if (apiResponse.layer1) {
    xgboostScore = apiResponse.layer1.score ?? xgboostScore;
  }

  const riskScore = Math.round(xgboostScore * 100);

  const isBlocked = decision === "BLOCKED";
  const isHold = decision === "HOLD";

  const riskLevel =
    riskScore <= 30 ? "Low" :
    riskScore <= 60 ? "Medium" : "High";

  // build reasons
  const reasons: string[] = [];

  if (pipeline?.layer2_bedrock?.evidence_used?.length > 0) {
    pipeline.layer2_bedrock.evidence_used.forEach((e: string) => {
      reasons.push(e.charAt(0).toUpperCase() + e.slice(1));
    });
  }

  if (pipeline?.layer3_qwen?.guardrailNotes &&
    pipeline.layer3_qwen.guardrailNotes !== "All checks passed.") {
    reasons.push(`Guardrail: ${pipeline.layer3_qwen.guardrailNotes}`);
  }

  // fallback reason from API
  if (reasons.length === 0 && apiResponse.reason) {
    reasons.push(apiResponse.reason);
  }

  if (reasons.length === 0) {
    reasons.push("Transaction analysed by GOGuardian AI");
  }

  return {
    txnId: apiResponse.txnId,
    recipient_phone: params.receiverPhone,
    recipient_name: params.receiverName || "Unknown Recipient",
    amount: params.amount,
    risk_score: riskScore,
    risk_level: riskLevel,
    decision,
    isBlocked,
    isHold,
    reasonBM: apiResponse.reasonBM,
    reasons,
    pipeline: pipeline ?? {
      layer1_xgboost: apiResponse.layer1 ?? { score: xgboostScore, verdict: decision === "BLOCKED" ? "RISKY" : "SAFE" },
      layer2_bedrock: null,
      layer3_qwen: null,
    },
    guardrailVerdict: pipeline?.layer3_qwen?.verdict ?? null,
  };
}