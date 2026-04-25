import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { AuditContext, AuditResult } from "@/types/transaction";

export interface TransactionContext {
  txnId: string;
  senderId: string;
  receiverPhone: string;
  receiverName: string;
  amount: number;
  xgboostScore: number;
  strikeCount: number;
  userProfile: {
    age: number;
    incometier: string;
    guardianMode: string;
  };
  recentHistory: string;
}

export interface BedrockDecision {
  decision: "APPROVE" | "BLOCK" | "HOLD";
  confidence: number;
  evidence_used: string[];
  reason: string;
  reasonBM: string;
}

export async function invokeGuardianLLM(
  context: TransactionContext
): Promise<BedrockDecision> {

  // initialize inside function so it picks up runtime credentials
  const client = new BedrockRuntimeClient({
    region: "ap-southeast-1",
  });

  const prompt = `You are GOGuardian, a financial fraud protection AI for TNG eWallet Malaysia.

A transaction needs your decision. Analyze carefully.

Transaction Details:
- Transaction ID: ${context.txnId}
- Amount: RM${context.amount}
- Receiver Phone: ${context.receiverPhone}
- Receiver Name: ${context.receiverName}
- XGBoost Risk Score: ${context.xgboostScore} (0=safe, 1=risky)
- Receiver Strike Count (community reports): ${context.strikeCount}
- Sender Age: ${context.userProfile.age}
- Sender Income Tier: ${context.userProfile.incometier}
- Recent Transaction History: ${context.recentHistory}

Rules:
- If strike count >= 3, lean toward BLOCK
- If amount is unusually large for this user, lean toward HOLD
- If receiver name is a known shop/business, lean toward APPROVE
- Always explain in simple Bahasa Malaysia for elderly users

Respond ONLY in this exact JSON format:
{
  "decision": "APPROVE" | "BLOCK" | "HOLD",
  "confidence": 0.0-1.0,
  "evidence_used": ["fact1 from context", "fact2 from context"],
  "reason": "English explanation citing only facts above",
  "reasonBM": "Simple Bahasa Malaysia for elderly user (max 2 sentences)"
}`;

  const command = new InvokeModelCommand({
    modelId: "apac.amazon.nova-micro-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: [{ text: prompt }],
        },
      ],
      inferenceConfig: {
        maxTokens: 300,
        temperature: 0.3,
      },
    }),
  });

  try {
    const response = await client.send(command);
    const raw = JSON.parse(new TextDecoder().decode(response.body));
    const text = raw.output.message.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Bedrock LLM error:", error);
    return {
      decision: "HOLD",
      confidence: 0.5,
      evidence_used: [],
      reason: "LLM response parsing failed, defaulting to HOLD for safety",
      reasonBM: "Sistem tidak dapat mengesahkan transaksi ini. Sila tunggu kelulusan penjaga anda.",
    };
  }
}


const DEFAULT_AUDIT_FAILURE: AuditResult = {
  auditVerdict: "FLAGGED",
  auditReason: "Audit service unavailable",
  auditReasonBM: "Perkhidmatan audit tidak tersedia.",
  consistencyScore: 0.0,
};

export async function invokeAuditorLLM(
  context: AuditContext
): Promise<AuditResult> {
  const prompt = `You are an independent Auditor AI for TNG eWallet's GOGuardian fraud protection system.

Your role is to verify a Layer 2 AI decision for factual grounding and logical consistency.

## Transaction Data
- Transaction ID: ${context.txnId}
- Amount: RM${context.transactionDetails.amount}
- Receiver Phone: ${context.transactionDetails.receiverPhone}
- Receiver Name: ${context.transactionDetails.receiverName}
- XGBoost Risk Score: ${context.transactionDetails.xgboostScore} (0=safe, 1=risky)
- Receiver Strike Count: ${context.transactionDetails.strikeCount}

## Layer 2 AI Decision
- Decision: ${context.layer2Decision.decision}
- Reason: ${context.layer2Decision.reason}
- Reason (BM): ${context.layer2Decision.reasonBM}
- Confidence: ${context.layer2Decision.confidence}

## Your Audit Tasks
1. **Factual Grounding**: Does the Layer 2 reasoning accurately reference the transaction data above? Are there any claims not supported by the data?
2. **Logical Consistency**: Does the decision (APPROVE/BLOCK/HOLD) logically follow from the reasoning provided? Are there contradictions?

## Verdict Guidelines
- **CONFIRMED**: The Layer 2 decision is factually grounded and logically consistent.
- **FLAGGED**: The Layer 2 decision contains minor inconsistencies, unsupported claims, or questionable reasoning.
- **OVERRIDDEN**: The Layer 2 decision is clearly incorrect — the reasoning contradicts the data or the conclusion does not follow from the reasoning.

Respond ONLY in this exact JSON format:
{
  "auditVerdict": "CONFIRMED" | "OVERRIDDEN" | "FLAGGED",
  "auditReason": "English explanation of audit findings",
  "auditReasonBM": "Penjelasan audit dalam Bahasa Malaysia (max 2 ayat)",
  "consistencyScore": 0.0-1.0
}`;

  try {
    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-haiku-20240307-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const response = await client.send(command);
    const raw = JSON.parse(new TextDecoder().decode(response.body));
    const text = raw.content[0].text;

    try {
      const parsed = JSON.parse(text);

      const validVerdicts = ["CONFIRMED", "OVERRIDDEN", "FLAGGED"];
      if (!validVerdicts.includes(parsed.auditVerdict)) {
        return DEFAULT_AUDIT_FAILURE;
      }

      return {
        auditVerdict: parsed.auditVerdict,
        auditReason: parsed.auditReason || DEFAULT_AUDIT_FAILURE.auditReason,
        auditReasonBM:
          parsed.auditReasonBM || DEFAULT_AUDIT_FAILURE.auditReasonBM,
        consistencyScore: Math.max(
          0,
          Math.min(1, Number(parsed.consistencyScore) || 0)
        ),
      };
    } catch {
      return DEFAULT_AUDIT_FAILURE;
    }
  } catch {
    return DEFAULT_AUDIT_FAILURE;
  }
}
