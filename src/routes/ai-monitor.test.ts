import { describe, it, expect } from "vitest";
import fc from "fast-check";
import type { TransactionRecord } from "@/types/transaction";
import { sortTransactionsByTimestampDesc } from "./ai-monitor";

/**
 * Arbitrary that generates a valid TransactionRecord with a random ISO timestamp.
 */
const transactionRecordArb: fc.Arbitrary<TransactionRecord> = fc
  .record({
    txnId: fc.uuid(),
    receiverName: fc.string({ minLength: 1, maxLength: 50 }),
    receiverPhone: fc.string({ minLength: 10, maxLength: 15 }),
    amount: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
    decision: fc.constantFrom("APPROVE", "BLOCK", "HOLD"),
    decisionBy: fc.constantFrom("AI_GUARDIAN", "BYPASS", "XGBOOST"),
    reason: fc.string({ minLength: 1 }),
    reasonBM: fc.string({ minLength: 1 }),
    riskScore: fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
    confidence: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }), { nil: undefined }),
    timestamp: fc
      .integer({
        min: new Date("2020-01-01T00:00:00Z").getTime(),
        max: new Date("2030-12-31T23:59:59Z").getTime(),
      })
      .map((ms) => new Date(ms).toISOString()),
    reported: fc.boolean(),
    canReport: fc.boolean(),
    auditVerdict: fc.constantFrom("CONFIRMED" as const, "OVERRIDDEN" as const, "FLAGGED" as const, null),
    auditReason: fc.option(fc.string({ minLength: 1 }), { nil: null }),
    auditReasonBM: fc.option(fc.string({ minLength: 1 }), { nil: null }),
    consistencyScore: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }), { nil: null }),
  });

describe("sortTransactionsByTimestampDesc", () => {
  /**
   * **Validates: Requirements 1.5**
   *
   * Property: For any array of TransactionRecord objects, after sorting by
   * timestamp descending, each element's timestamp is >= the next element's
   * timestamp.
   */
  it("should sort transactions so each timestamp >= the next (descending order)", () => {
    fc.assert(
      fc.property(fc.array(transactionRecordArb, { maxLength: 50 }), (records) => {
        const sorted = sortTransactionsByTimestampDesc(records);

        // Length is preserved
        expect(sorted).toHaveLength(records.length);

        // Each element's timestamp >= the next element's timestamp
        for (let i = 0; i < sorted.length - 1; i++) {
          const currentTime = new Date(sorted[i].timestamp).getTime();
          const nextTime = new Date(sorted[i + 1].timestamp).getTime();
          expect(currentTime).toBeGreaterThanOrEqual(nextTime);
        }
      }),
      { numRuns: 100 },
    );
  });
});
