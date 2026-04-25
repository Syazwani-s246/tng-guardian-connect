import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: "ap-southeast-1",
});

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
  reason: string;
  reasonBM: string;
  confidence: number;
}

export async function invokeGuardianLLM(
  context: TransactionContext
): Promise<BedrockDecision> {
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
  "reason": "English explanation for logs",
  "reasonBM": "Simple Bahasa Malaysia explanation for user (max 2 sentences)",
  "confidence": 0.0-1.0
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

  const response = await client.send(command);
  const raw = JSON.parse(new TextDecoder().decode(response.body));
  const text = raw.output.message.content[0].text;

  try {
    // Titan sometimes wraps response in text before the JSON — extract it
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      decision: "HOLD",
      reason: "LLM response parsing failed, defaulting to HOLD for safety",
      reasonBM:
        "Sistem tidak dapat mengesahkan transaksi ini. Sila tunggu kelulusan penjaga anda.",
      confidence: 0.5,
    };
  }
}