import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";

/**
 * **Validates: Requirements 5.3**
 *
 * Property 3: Audit result structure is always valid.
 * For any valid AuditContext input, invokeAuditorLLM (with mocked Bedrock client)
 * returns an AuditResult where:
 * - auditVerdict is in {"CONFIRMED", "OVERRIDDEN", "FLAGGED"}
 * - consistencyScore is in [0.0, 1.0]
 * - auditReason is a non-empty string
 * - auditReasonBM is a non-empty string
 */

// Mock the AWS Bedrock client before importing the module under test
const { mockSend } = vi.hoisted(() => {
  return { mockSend: vi.fn() };
});

vi.mock("@aws-sdk/client-bedrock-runtime", () => {
  class MockBedrockRuntimeClient {
    send = mockSend;
  }
  class MockInvokeModelCommand {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  }
  return {
    BedrockRuntimeClient: MockBedrockRuntimeClient,
    InvokeModelCommand: MockInvokeModelCommand,
  };
});

import { invokeAuditorLLM } from "./bedrock";
import type { AuditContext } from "@/types/transaction";

// Arbitrary for generating valid AuditContext inputs
const auditContextArb: fc.Arbitrary<AuditContext> = fc.record({
  txnId: fc.string({ minLength: 1, maxLength: 36 }),
  transactionDetails: fc.record({
    amount: fc.double({ min: 0.01, max: 100000, noNaN: true }),
    receiverPhone: fc.string({ minLength: 1, maxLength: 15 }),
    receiverName: fc.string({ minLength: 1, maxLength: 100 }),
    xgboostScore: fc.double({ min: 0, max: 1, noNaN: true }),
    strikeCount: fc.integer({ min: 0, max: 100 }),
  }),
  layer2Decision: fc.record({
    decision: fc.constantFrom(
      "APPROVE" as const,
      "BLOCK" as const,
      "HOLD" as const
    ),
    reason: fc.string({ minLength: 1, maxLength: 500 }),
    reasonBM: fc.string({ minLength: 1, maxLength: 500 }),
    confidence: fc.double({ min: 0, max: 1, noNaN: true }),
  }),
});

// Arbitrary for generating valid Bedrock audit responses
const validAuditResponseArb = fc
  .record({
    auditVerdict: fc.constantFrom("CONFIRMED", "OVERRIDDEN", "FLAGGED"),
    auditReason: fc.string({ minLength: 1, maxLength: 500 }),
    auditReasonBM: fc.string({ minLength: 1, maxLength: 500 }),
    consistencyScore: fc.double({ min: 0, max: 1, noNaN: true }),
  })
  .filter(
    (r) => r.auditReason.trim().length > 0 && r.auditReasonBM.trim().length > 0
  );

function createBedrockResponse(jsonText: string) {
  const body = new TextEncoder().encode(
    JSON.stringify({
      content: [{ text: jsonText }],
    })
  );
  return { body };
}

describe("invokeAuditorLLM - Property-Based Tests", () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it("should always return a valid AuditResult for any valid AuditContext when Bedrock returns a valid response", async () => {
    await fc.assert(
      fc.asyncProperty(
        auditContextArb,
        validAuditResponseArb,
        async (context, mockResponse) => {
          mockSend.mockResolvedValueOnce(
            createBedrockResponse(JSON.stringify(mockResponse))
          );

          const result = await invokeAuditorLLM(context);

          // auditVerdict must be one of the valid values
          expect(["CONFIRMED", "OVERRIDDEN", "FLAGGED"]).toContain(
            result.auditVerdict
          );

          // consistencyScore must be in [0.0, 1.0]
          expect(result.consistencyScore).toBeGreaterThanOrEqual(0.0);
          expect(result.consistencyScore).toBeLessThanOrEqual(1.0);

          // auditReason must be a non-empty string
          expect(typeof result.auditReason).toBe("string");
          expect(result.auditReason.length).toBeGreaterThan(0);

          // auditReasonBM must be a non-empty string
          expect(typeof result.auditReasonBM).toBe("string");
          expect(result.auditReasonBM.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return a valid AuditResult with FLAGGED verdict when Bedrock call fails", async () => {
    await fc.assert(
      fc.asyncProperty(auditContextArb, async (context) => {
        mockSend.mockRejectedValueOnce(new Error("Bedrock service error"));

        const result = await invokeAuditorLLM(context);

        // Must still return a valid AuditResult
        expect(["CONFIRMED", "OVERRIDDEN", "FLAGGED"]).toContain(
          result.auditVerdict
        );
        expect(result.consistencyScore).toBeGreaterThanOrEqual(0.0);
        expect(result.consistencyScore).toBeLessThanOrEqual(1.0);
        expect(typeof result.auditReason).toBe("string");
        expect(result.auditReason.length).toBeGreaterThan(0);
        expect(typeof result.auditReasonBM).toBe("string");
        expect(result.auditReasonBM.length).toBeGreaterThan(0);

        // Specifically, on failure it should be FLAGGED with score 0.0
        expect(result.auditVerdict).toBe("FLAGGED");
        expect(result.auditReason).toBe("Audit service unavailable");
        expect(result.auditReasonBM).toBe(
          "Perkhidmatan audit tidak tersedia."
        );
        expect(result.consistencyScore).toBe(0.0);
      }),
      { numRuns: 50 }
    );
  });

  it("should return a valid AuditResult when Bedrock returns malformed JSON", async () => {
    await fc.assert(
      fc.asyncProperty(auditContextArb, async (context) => {
        mockSend.mockResolvedValueOnce(
          createBedrockResponse("this is not valid json {{{")
        );

        const result = await invokeAuditorLLM(context);

        // Must still return a valid AuditResult
        expect(["CONFIRMED", "OVERRIDDEN", "FLAGGED"]).toContain(
          result.auditVerdict
        );
        expect(result.consistencyScore).toBeGreaterThanOrEqual(0.0);
        expect(result.consistencyScore).toBeLessThanOrEqual(1.0);
        expect(typeof result.auditReason).toBe("string");
        expect(result.auditReason.length).toBeGreaterThan(0);
        expect(typeof result.auditReasonBM).toBe("string");
        expect(result.auditReasonBM.length).toBeGreaterThan(0);
      }),
      { numRuns: 50 }
    );
  });
});
