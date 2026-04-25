import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { getBlockedCount } from "./ai-monitor";
import type { TransactionRecord } from "@/types/transaction";

/**
 * Arbitrary that generates a valid TransactionRecord with a random decision value.
 */
const transactionRecordArb: fc.Arbitrary<TransactionRecord> = fc.record({
  txnId: fc.uuid(),
  receiverName: fc.string({ minLength: 1, maxLength: 50 }),
  receiverPhone: fc.string({ minLength: 1, maxLength: 20 }),
  amount: fc.double({ min: 0.01, max: 100000, noNaN: true }),
  decision: fc.oneof(
    fc.constant("APPROVED"),
    fc.constant("APPROVE"),
    fc.constant("BLOCKED"),
    fc.constant("BLOCK"),
    fc.constant("PENDING"),
    fc.constant("HOLD"),
  ),
  decisionBy: fc.oneof(
    fc.constant("AI_GUARDIAN"),
    fc.constant("BYPASS"),
    fc.constant("XGBOOST"),
  ),
  reason: fc.string({ minLength: 0, maxLength: 200 }),
  reasonBM: fc.string({ minLength: 0, maxLength: 200 }),
  riskScore: fc.double({ min: 0, max: 1, noNaN: true }),
  confidence: fc.option(fc.double({ min: 0, max: 1, noNaN: true }), { nil: undefined }),
  timestamp: fc.date().map((d) => d.toISOString()),
  reported: fc.boolean(),
  canReport: fc.boolean(),
  auditVerdict: fc.oneof(
    fc.constant("CONFIRMED" as const),
    fc.constant("OVERRIDDEN" as const),
    fc.constant("FLAGGED" as const),
    fc.constant(null),
  ),
  auditReason: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: null }),
  auditReasonBM: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: null }),
  consistencyScore: fc.option(fc.double({ min: 0, max: 1, noNaN: true }), { nil: null }),
});

describe("getBlockedCount", () => {
  /**
   * **Validates: Requirements 7.2**
   *
   * Property 4: Blocked transaction count is consistent with filtered data.
   * For any array of TransactionRecord objects, the computed blocked count
   * equals the number of records where decision equals "BLOCKED" or "BLOCK".
   */
  it("should equal the number of records where decision is BLOCKED or BLOCK", () => {
    fc.assert(
      fc.property(fc.array(transactionRecordArb, { maxLength: 100 }), (transactions) => {
        const result = getBlockedCount(transactions);
        const expected = transactions.filter(
          (t) => t.decision === "BLOCKED" || t.decision === "BLOCK",
        ).length;
        expect(result).toBe(expected);
      }),
    );
  });
});
