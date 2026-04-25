import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { formatScoreAsPercentage } from "./TransactionReview";

/**
 * **Validates: Requirements 3.5, 4.5**
 *
 * Property 2: Confidence and consistency scores display as valid percentages.
 * For any score value in [0.0, 1.0], the formatted percentage equals
 * Math.round(score * 100) and is between 0 and 100 inclusive.
 */
describe("formatScoreAsPercentage - Property-Based Tests", () => {
  it("should return Math.round(score * 100) for any score in [0.0, 1.0] and the result is between 0 and 100 inclusive", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
        (score) => {
          const result = formatScoreAsPercentage(score);
          const expected = Math.round(score * 100);

          // Result equals Math.round(score * 100)
          expect(result).toBe(expected);

          // Result is between 0 and 100 inclusive
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(100);
        },
      ),
      { numRuns: 1000 },
    );
  });
});
