import type { BedrockDecision } from "@/backend/lib/bedrock";

/**
 * A single transaction record used by both the frontend (Transaction Log, Review Detail)
 * and the backend (DynamoDB storage, Audit Log API response).
 */
export interface TransactionRecord {
  txnId: string;
  receiverName: string;
  receiverPhone: string;
  amount: number;
  decision: string;
  decisionBy: string;
  reason: string;
  reasonBM: string;
  riskScore: number;
  confidence?: number;
  timestamp: string;
  reported: boolean;
  canReport: boolean;
  auditVerdict: "CONFIRMED" | "OVERRIDDEN" | "FLAGGED" | null;
  auditReason: string | null;
  auditReasonBM: string | null;
  consistencyScore: number | null;
}

/**
 * Structured output of the Layer 3 Auditor AI verification.
 */
export interface AuditResult {
  auditVerdict: "CONFIRMED" | "OVERRIDDEN" | "FLAGGED";
  auditReason: string;
  auditReasonBM: string;
  consistencyScore: number;
}

/**
 * Input context provided to the Layer 3 Auditor AI for verifying a Layer 2 decision.
 */
export interface AuditContext {
  txnId: string;
  transactionDetails: {
    amount: number;
    receiverPhone: string;
    receiverName: string;
    xgboostScore: number;
    strikeCount: number;
  };
  layer2Decision: BedrockDecision;
}
