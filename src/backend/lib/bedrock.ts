import OpenAI from "openai";

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
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error("VITE_GROQ_API_KEY is not set");
    return holdFallback("Missing Groq API key");
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
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

Respond ONLY in this exact JSON format with no markdown or code fences:
{
  "decision": "APPROVE" | "BLOCK" | "HOLD",
  "confidence": 0.0-1.0,
  "evidence_used": ["fact1 from context", "fact2 from context"],
  "reason": "English explanation citing only facts above",
  "reasonBM": "Simple Bahasa Malaysia for elderly user (max 2 sentences)"
}`;

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.3,
    });

    const text = response.choices[0].message.content ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Groq response");

    const parsed: BedrockDecision = JSON.parse(jsonMatch[0]);

    if (!["APPROVE", "BLOCK", "HOLD"].includes(parsed.decision)) {
      throw new Error(`Invalid decision value: ${parsed.decision}`);
    }

    return parsed;
  } catch (error) {
    console.error("Groq LLM error:", error);
    return holdFallback(`LLM response parsing failed: ${error}`);
  }
}

function holdFallback(reason: string): BedrockDecision {
  return {
    decision: "HOLD",
    confidence: 0.5,
    evidence_used: [],
    reason,
    reasonBM:
      "Sistem tidak dapat mengesahkan transaksi ini. Sila tunggu kelulusan penjaga anda.",
  };
}