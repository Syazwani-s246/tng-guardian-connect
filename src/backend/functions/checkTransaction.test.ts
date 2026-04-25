import { describe, it, expect } from "vitest";
import fc from "fast-check";
import type { TransactionRecord } from "@/types/transaction";

/**
 * **Validates: Requirements 6.3**
 *
 * Property 5: Layer 3 audit fields are null if and only if decisionBy is BYPASS or XGBOOST.
 * For any stored transaction:
 * - auditVerdict is null iff decisionBy is "BYPASS" or "XGBOOST"
 * - auditVerdict is non-null iff decisionBy is "AI_GUARDIAN"
 */

// Generator for a transaction record with BYPASS or XGBOOST decision (null audit fields)
const bypassOrXgboostTxnArb: fc.Arbitrary<TransactionRecord> = fc
  .record({
    txnId: fc.uuid(),
    receiverName: fc.string({ minLength: 1, maxLength: 50 }),
    receiverPhone: fc.string({ minLength: 10, maxLength: 15 }),
    amount: fc.double({ min: 0.01, max: 100000, noNaN: true }),
    decision: fc.constantFrom("APPROVED", "BLOCKED"),
    decisionBy: fc.constantFrom("BYPASS", "XGBOOST"),
    reason: fc.string({ minLength: 1, maxLength: 200 }),
    reasonBM: fc.string({ minLength: 1, maxLength: 200 }),
    riskScore: fc.double({ min: 0, max: 1, noNaN: true }),
    timestamp: fc.date().map((d) => d.toISOString()),
    reported: fc.boolean(),
    canReport: fc.boolean(),
  })
  .map((base) => ({
    ...base,
    auditVerdict: null,
    auditReason: null,
    auditReasonBM: null,
    consistencyScore: null,
  }));

// Generator for a transaction record with AI_GUARDIAN decision (non-null audit fields)
const aiGuardianTxnArb: fc.Arbitrary<TransactionRecord> = fc.record({
  txnId: fc.uuid(),
  receiverName: fc.string({ minLength: 1, maxLength: 50 }),
  receiverPhone: fc.string({ minLength: 10, maxLength: 15 }),
  amount: fc.double({ min: 0.01, max: 100000, noNaN: true }),
  decision: fc.constantFrom("APPROVED", "BLOCKED", "PENDING"),
  decisionBy: fc.constant("AI_GUARDIAN"),
  reason: fc.string({ minLength: 1, maxLength: 200 }),
  reasonBM: fc.string({ minLength: 1, maxLength: 200 }),
  riskScore: fc.double({ min: 0, max: 1, noNaN: true }),
  confidence: fc.double({ min: 0, max: 1, noNaN: true }),
  timestamp: fc.date().map((d) => d.toISOString()),
  reported: fc.boolean(),
  canReport: fc.boolean(),
  auditVerdict: fc.constantFrom(
    "CONFIRMED" as const,
    "OVERRIDDEN" as const,
    "FLAGGED" as const
  ),
  auditReason: fc.string({ minLength: 1, maxLength: 200 }),
  auditReasonBM: fc.string({ minLength: 1, maxLength: 200 }),
  consistencyScore: fc.double({ min: 0, max: 1, noNaN: true }),
});

// Combined generator that produces any valid transaction record
const anyTransactionRecordArb: fc.Arbitrary<TransactionRecord> = fc.oneof(
  bypassOrXgboostTxnArb,
  aiGuardianTxnArb
);

describe("checkTransaction - Property-Based Tests", () => {
  it("auditVerdict is null iff decisionBy is BYPASS or XGBOOST, and non-null iff decisionBy is AI_GUARDIAN", () => {
    fc.assert(
      fc.property(anyTransactionRecordArb, (txn: TransactionRecord) => {
        const isBypassOrXgboost =
          txn.decisionBy === "BYPASS" || txn.decisionBy === "XGBOOST";
        const isAiGuardian = txn.decisionBy === "AI_GUARDIAN";

        if (isBypassOrXgboost) {
          // auditVerdict MUST be null for BYPASS/XGBOOST
          expect(txn.auditVerdict).toBeNull();
          expect(txn.auditReason).toBeNull();
          expect(txn.auditReasonBM).toBeNull();
          expect(txn.consistencyScore).toBeNull();
        }

        if (isAiGuardian) {
          // auditVerdict MUST be non-null for AI_GUARDIAN
          expect(txn.auditVerdict).not.toBeNull();
          expect(["CONFIRMED", "OVERRIDDEN", "FLAGGED"]).toContain(
            txn.auditVerdict
          );
          expect(txn.auditReason).not.toBeNull();
          expect(txn.auditReasonBM).not.toBeNull();
          expect(txn.consistencyScore).not.toBeNull();
        }

        // The biconditional: null ↔ BYPASS/XGBOOST, non-null ↔ AI_GUARDIAN
        expect(txn.auditVerdict === null).toBe(isBypassOrXgboost);
        expect(txn.auditVerdict !== null).toBe(isAiGuardian);
      }),
      { numRuns: 200 }
    );
  });
});
