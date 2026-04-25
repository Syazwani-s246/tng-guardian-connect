import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

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