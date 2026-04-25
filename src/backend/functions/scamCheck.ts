import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { sampleComplaints } from "@/data/sampleComplaints";

// ─── Local Constants (NOT imported from dynamodb.ts) ──────────────────────────
const USER_COMPLAINTS_TABLE = "goguardian-user-complaints";
const COMPLAINTS_GSI = "receiverPhone-index";

// ─── Input/Output Interfaces ──────────────────────────────────────────────────
export interface ScamCheckInput {
  receiverPhone: string;
}

export interface ScamCheckResponse {
  receiverPhone: string;
  complaintCount: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  warningEN: string;
  warningBM: string;
  error: boolean;
}

// ─── Pure Function: Risk Classification ───────────────────────────────────────
export function classifyRiskLevel(
  complaintCount: number,
): "LOW" | "MEDIUM" | "HIGH" {
  if (complaintCount <= 0) return "LOW";
  if (complaintCount <= 2) return "MEDIUM";
  return "HIGH";
}

// ─── DynamoDB Client (inline, same pattern as lib/dynamodb.ts) ────────────────
const ddbClient = new DynamoDBClient({ region: "ap-southeast-1" });
const dynamo = DynamoDBDocumentClient.from(ddbClient);

// ─── Main Export ──────────────────────────────────────────────────────────────
export async function scamCheck(
  event: ScamCheckInput,
): Promise<ScamCheckResponse | { error: string }> {
  const { receiverPhone } = event;

  // Validate input
  if (!receiverPhone) {
    return { error: "receiverPhone is required" };
  }

  // Step 1: Query complaints from DynamoDB (falls back to sample data if table unavailable)
  let complaintCount: number;
  try {
    const queryResult = await dynamo.send(
      new QueryCommand({
        TableName: USER_COMPLAINTS_TABLE,
        IndexName: COMPLAINTS_GSI,
        KeyConditionExpression: "receiverPhone = :phone",
        ExpressionAttributeValues: {
          ":phone": receiverPhone,
        },
      }),
    );
    complaintCount = queryResult.Items?.length ?? 0;
  } catch (err) {
    console.error("DynamoDB query failed, falling back to sample data:", err);
    // Fallback: use sample complaint data for development/demo
    const matchingComplaints = sampleComplaints.filter(
      (c) => c.receiverPhone === receiverPhone,
    );
    complaintCount = matchingComplaints.length;
  }

  // Step 2: Classify risk level
  const riskLevel = classifyRiskLevel(complaintCount);

  // Step 3: Invoke Bedrock LLM for bilingual warning
  try {
    const bedrockClient = new BedrockRuntimeClient({
      region: "ap-southeast-1",
    });

    const prompt = `You are a scam detection assistant for TNG eWallet Malaysia.

A sender is about to transfer money to a receiver. Based on our complaint database:
- Complaint count against this receiver: ${complaintCount}
- Risk level: ${riskLevel}

Generate a scam warning for the sender in both English and Bahasa Malaysia.
Each warning should be a maximum of 3 sentences.

Respond ONLY in this exact JSON format:
{
  "warningEN": "English warning text (max 3 sentences)",
  "warningBM": "Bahasa Malaysia warning text (max 3 sentences)"
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

    const response = await bedrockClient.send(command);
    const raw = JSON.parse(new TextDecoder().decode(response.body));
    const text = raw.output.message.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Bedrock scam check response");
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      receiverPhone,
      complaintCount,
      riskLevel,
      warningEN: parsed.warningEN,
      warningBM: parsed.warningBM,
      error: false,
    };
  } catch (err) {
    console.error("Bedrock LLM error:", err);
    return {
      receiverPhone,
      complaintCount,
      riskLevel,
      warningEN: `AI analysis unavailable. This receiver has ${complaintCount} complaints from other users.`,
      warningBM: `Analisis AI tidak tersedia. Penerima ini mempunyai ${complaintCount} aduan daripada pengguna lain.`,
      error: true,
    };
  }
}
