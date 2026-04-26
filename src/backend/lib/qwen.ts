import OpenAI from "openai";

export interface PrimaryDecision {
  decision: "APPROVE" | "BLOCK" | "HOLD";
  confidence: number;
  evidence_used: string[];
  reason: string;
  reasonBM: string;
}

export interface GuardrailResult {
  verdict: "PASS" | "OVERRIDE" | "ESCALATE";
  finalDecision: "APPROVE" | "BLOCK" | "HOLD";
  reason: string;
  reasonBM: string;
  guardrailNotes: string;
}

export async function runGuardrail(
  primaryDecision: PrimaryDecision,
  context: {
    txnId: string;
    amount: number;
    receiverPhone: string;
    receiverName: string;
    xgboostScore: number;
    strikeCount: number;
    userAvgTransaction: number;
    age: number;
    incomeTier: string;
  }
): Promise<GuardrailResult> {

  // initialize INSIDE the function so env vars are loaded at runtime
  const client = new OpenAI({
    apiKey: "REDACTED_API_KEY",
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
  });

  const prompt = `You are a financial fraud guardrail AI for GOGuardian, TNG eWallet Malaysia.

Your job is to AUDIT the primary AI's decision. You are NOT making a new decision — you are fact-checking the primary AI's reasoning against the actual data.

ACTUAL CONTEXT DATA (ground truth):
- Transaction ID: ${context.txnId}
- Amount: RM${context.amount}
- Receiver Phone: ${context.receiverPhone}
- Receiver Name: ${context.receiverName}
- XGBoost Risk Score: ${context.xgboostScore} (0=safe, 1=risky)
- Receiver Strike Count: ${context.strikeCount}
- User Average Transaction: RM${context.userAvgTransaction}
- User Age: ${context.age}
- User Income Tier: ${context.incomeTier}
- Amount Deviation: ${(context.amount / (context.userAvgTransaction || 100)).toFixed(2)}x baseline

PRIMARY AI DECISION TO AUDIT:
${JSON.stringify(primaryDecision, null, 2)}

YOUR THREE CHECKS:

1. FACTUAL GROUNDING: Every item in evidence_used must be verifiable against the ACTUAL CONTEXT DATA above. If the primary AI cited a fact that doesn't match the real data, flag it.

2. LOGIC CONSISTENCY: Does the decision actually follow from the reason? If reason says "no suspicious signals" but decision is BLOCK, that's a contradiction.

3. CONFIDENCE CALIBRATION: Is the confidence score proportional to the evidence strength? If only one weak signal exists but confidence is > 0.9, that's overconfident.

VERDICT RULES:
- PASS: All 3 checks clear. Trust the primary AI decision.
- OVERRIDE: One or more checks failed. Force HOLD. Strip hallucinated reasoning.
- ESCALATE: Deep contradiction or complete loss of confidence in primary AI output.

Respond ONLY in this exact JSON format:
{
  "verdict": "PASS" | "OVERRIDE" | "ESCALATE",
  "finalDecision": "APPROVE" | "BLOCK" | "HOLD",
  "reason": "English audit summary for logs",
  "reasonBM": "Simple Bahasa Malaysia for user (max 2 sentences)",
  "guardrailNotes": "Specific issues found, or All checks passed if PASS"
}`;

  try {
    const response = await client.chat.completions.create({
      model: "qwen-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.1,
    });

    const text = response.choices[0].message.content ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in Qwen response");

    const result = JSON.parse(jsonMatch[0]);

    if (result.verdict === "OVERRIDE") {
      result.finalDecision = "HOLD";
    }

    return result;
  } catch (error) {
    console.error("Qwen guardrail error:", error);
    return {
      verdict: "ESCALATE",
      finalDecision: "HOLD",
      reason: "Guardrail layer failed — defaulting to HOLD for safety",
      reasonBM: "Sistem pengesahan tidak dapat berfungsi. Transaksi ditahan buat sementara.",
      guardrailNotes: `Guardrail error: ${error}`,
    };
  }
}