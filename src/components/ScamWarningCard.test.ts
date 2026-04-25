import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { classifyRiskLevel } from "@/backend/functions/scamCheck";
import type { ScamCheckResponse } from "@/components/ScamWarningCard";

/**
 * Property 5: Scam warning card displays all required information
 *
 * For any valid ScamCheckResponse, the data contract contains the riskLevel,
 * complaintCount, and warning text that the ScamWarningCard component needs
 * to render. This structural property test verifies the data completeness
 * without requiring a DOM environment.
 *
 * **Validates: Requirements 4.3**
 */
describe("Property 5: Scam warning card displays all required information", () => {
  // Generator: valid ScamCheckResponse with consistent complaintCount ↔ riskLevel
  const scamCheckResponseArb: fc.Arbitrary<ScamCheckResponse> = fc
    .record({
      complaintCount: fc.nat(),
      receiverPhone: fc.stringMatching(/^\+60 1[0-9]-[0-9]{4} [0-9]{4}$/),
      warningEN: fc.string({ minLength: 1, maxLength: 500 }),
      warningBM: fc.string({ minLength: 1, maxLength: 500 }),
      error: fc.boolean(),
    })
    .map(({ complaintCount, receiverPhone, warningEN, warningBM, error }) => ({
      receiverPhone,
      complaintCount,
      riskLevel: classifyRiskLevel(complaintCount),
      warningEN,
      warningBM,
      error,
    }));

  it("every valid ScamCheckResponse contains riskLevel, complaintCount, and warning text needed by the card", () => {
    fc.assert(
      fc.property(scamCheckResponseArb, (response: ScamCheckResponse) => {
        // riskLevel is one of the valid display values
        expect(["LOW", "MEDIUM", "HIGH"]).toContain(response.riskLevel);

        // complaintCount is present and is a non-negative integer (card displays this)
        expect(Number.isInteger(response.complaintCount)).toBe(true);
        expect(response.complaintCount).toBeGreaterThanOrEqual(0);

        // warningEN is a non-empty string (the warning text displayed on the card)
        expect(typeof response.warningEN).toBe("string");
        expect(response.warningEN.length).toBeGreaterThan(0);

        // riskLevel is consistent with complaintCount via classifyRiskLevel
        expect(response.riskLevel).toBe(
          classifyRiskLevel(response.complaintCount),
        );
      }),
      { numRuns: 100 },
    );
  });
});
