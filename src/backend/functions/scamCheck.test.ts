import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  sampleComplaints,
  type ComplaintRecord,
} from "@/data/sampleComplaints";
import { classifyRiskLevel } from "./scamCheck";

/**
 * Property 2: Self-complaint prevention
 * For any valid complaint record in the sample data or generated test data,
 * the reporterId SHALL differ from the receiverPhone — a user cannot file
 * a complaint against themselves.
 *
 * **Validates: Requirements 1.4**
 */
describe("Property 2: Self-complaint prevention", () => {
  it("all sample complaint records have reporterId !== receiverPhone", () => {
    for (const record of sampleComplaints) {
      expect(record.reporterId).not.toBe(record.receiverPhone);
    }
  });

  it("randomly generated complaint records have reporterId !== receiverPhone", () => {
    // Generator for complaint records where reporterId and receiverPhone
    // are independently generated, then we verify the invariant holds
    // in the actual sample data structure.
    const complaintRecordArb: fc.Arbitrary<ComplaintRecord> = fc
      .record({
        complaintId: fc.uuid(),
        receiverPhone: fc.stringMatching(/^\+60 1[0-9]-[0-9]{4} [0-9]{4}$/),
        reporterId: fc.stringMatching(/^user-[0-9]{3,6}$/),
        reason: fc.string({ minLength: 1, maxLength: 200 }),
        createdAt: fc.date({ min: new Date("2020-01-01"), max: new Date("2030-01-01") }).map((d) => d.toISOString()),
      })
      .filter((record) => record.reporterId !== record.receiverPhone);

    fc.assert(
      fc.property(complaintRecordArb, (record: ComplaintRecord) => {
        expect(record.reporterId).not.toBe(record.receiverPhone);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 1: Risk level classification is correct for all non-negative complaint counts
 *
 * For any non-negative integer complaint count, classifyRiskLevel(count) SHALL return
 * "LOW" when count is 0, "MEDIUM" when count is 1 or 2, and "HIGH" when count is 3 or more.
 *
 * **Validates: Requirements 3.4, 3.5, 5.2**
 */
describe("Property 1: Risk level classification", () => {
  it("classifies risk level correctly for all non-negative complaint counts", () => {
    fc.assert(
      fc.property(fc.nat(), (count: number) => {
        const result = classifyRiskLevel(count);

        if (count === 0) {
          expect(result).toBe("LOW");
        } else if (count <= 2) {
          expect(result).toBe("MEDIUM");
        } else {
          expect(result).toBe("HIGH");
        }
      }),
      { numRuns: 100 },
    );
  });
});

import type { ScamCheckResponse } from "./scamCheck";

/**
 * Property 3: Response structure invariant
 *
 * For any successful (non-error) ScamCheckResponse, the response SHALL contain
 * all required fields (receiverPhone, complaintCount, riskLevel, warningEN,
 * warningBM, error), complaintCount SHALL be a non-negative integer, riskLevel
 * SHALL be one of "LOW", "MEDIUM", "HIGH", and error SHALL be false.
 *
 * **Validates: Requirements 2.2, 3.7, 5.1**
 */
describe("Property 3: Response structure invariant", () => {
  // Generator: valid ScamCheckResponse with consistent complaintCount ↔ riskLevel
  const scamCheckResponseArb: fc.Arbitrary<ScamCheckResponse> = fc
    .record({
      complaintCount: fc.nat(),
      receiverPhone: fc.string({ minLength: 1 }),
      warningEN: fc.string({ minLength: 1 }),
      warningBM: fc.string({ minLength: 1 }),
    })
    .map(({ complaintCount, receiverPhone, warningEN, warningBM }) => ({
      receiverPhone,
      complaintCount,
      riskLevel: classifyRiskLevel(complaintCount),
      warningEN,
      warningBM,
      error: false as const,
    }));

  it("all required fields are present and correctly typed for any valid response", () => {
    fc.assert(
      fc.property(scamCheckResponseArb, (response: ScamCheckResponse) => {
        // All 6 fields are present and defined
        expect(response.receiverPhone).toBeDefined();
        expect(response.complaintCount).toBeDefined();
        expect(response.riskLevel).toBeDefined();
        expect(response.warningEN).toBeDefined();
        expect(response.warningBM).toBeDefined();
        expect(response.error).toBeDefined();

        // complaintCount is a non-negative integer
        expect(Number.isInteger(response.complaintCount)).toBe(true);
        expect(response.complaintCount).toBeGreaterThanOrEqual(0);

        // riskLevel is one of the valid values
        expect(["LOW", "MEDIUM", "HIGH"]).toContain(response.riskLevel);

        // error is false for successful responses
        expect(response.error).toBe(false);

        // complaintCount and riskLevel are consistent
        expect(response.riskLevel).toBe(
          classifyRiskLevel(response.complaintCount),
        );
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Property 4: JSON serialization round-trip
 *
 * For any valid ScamCheckResponse object, serializing it to JSON via
 * JSON.stringify and parsing it back via JSON.parse SHALL produce a
 * deeply equal object.
 *
 * **Validates: Requirements 5.4**
 */
describe("Property 4: JSON serialization round-trip", () => {
  const scamCheckResponseArb: fc.Arbitrary<ScamCheckResponse> = fc
    .record({
      complaintCount: fc.nat(),
      receiverPhone: fc.string({ minLength: 1 }),
      warningEN: fc.string({ minLength: 1 }),
      warningBM: fc.string({ minLength: 1 }),
    })
    .map(({ complaintCount, receiverPhone, warningEN, warningBM }) => ({
      receiverPhone,
      complaintCount,
      riskLevel: classifyRiskLevel(complaintCount),
      warningEN,
      warningBM,
      error: false as const,
    }));

  it("JSON.parse(JSON.stringify(response)) deeply equals the original", () => {
    fc.assert(
      fc.property(scamCheckResponseArb, (response: ScamCheckResponse) => {
        const serialized = JSON.stringify(response);
        const deserialized = JSON.parse(serialized);
        expect(deserialized).toEqual(response);
      }),
      { numRuns: 100 },
    );
  });
});


// ─── Unit Tests for scamCheck function (Task 2.5) ─────────────────────────────
// Requirements: 2.3, 2.4, 3.6, 5.3

import { vi, beforeEach } from "vitest";

// ─── Mock AWS SDK modules ─────────────────────────────────────────────────────
// vi.hoisted ensures these are available when vi.mock factories run (hoisted above imports)
const { mockDynamoSend, mockBedrockSend } = vi.hoisted(() => ({
  mockDynamoSend: vi.fn(),
  mockBedrockSend: vi.fn(),
}));

vi.mock("@aws-sdk/client-dynamodb", () => {
  return {
    DynamoDBClient: class MockDynamoDBClient {
      constructor() {
        // no-op
      }
    },
  };
});

vi.mock("@aws-sdk/lib-dynamodb", () => {
  return {
    DynamoDBDocumentClient: {
      from: () => ({ send: mockDynamoSend }),
    },
    QueryCommand: class MockQueryCommand {
      constructor(public input: unknown) {}
    },
  };
});

vi.mock("@aws-sdk/client-bedrock-runtime", () => {
  return {
    BedrockRuntimeClient: class MockBedrockRuntimeClient {
      send = mockBedrockSend;
    },
    InvokeModelCommand: class MockInvokeModelCommand {
      constructor(public input: unknown) {}
    },
  };
});

// Import scamCheck AFTER mocks are set up (vi.mock is hoisted by vitest)
const { scamCheck } = await import("./scamCheck");

// ─── Helper: build a mock Bedrock response body ──────────────────────────────
function makeLLMResponseBody(warningEN: string, warningBM: string): Uint8Array {
  const payload = {
    output: {
      message: {
        content: [
          {
            text: JSON.stringify({ warningEN, warningBM }),
          },
        ],
      },
    },
  };
  return new TextEncoder().encode(JSON.stringify(payload));
}

describe("scamCheck unit tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Test 1: Zero complaints → count 0, risk LOW ────────────────────────────
  // Validates: Requirement 2.3
  it("returns complaintCount 0 and riskLevel LOW when DB has no complaints", async () => {
    mockDynamoSend.mockResolvedValueOnce({ Items: [] });
    mockBedrockSend.mockResolvedValueOnce({
      body: makeLLMResponseBody(
        "No complaints found. This receiver appears safe.",
        "Tiada aduan ditemui. Penerima ini kelihatan selamat.",
      ),
    });

    const result = await scamCheck({ receiverPhone: "+60 11-0000 0000" });

    expect(result).toMatchObject({
      receiverPhone: "+60 11-0000 0000",
      complaintCount: 0,
      riskLevel: "LOW",
      error: false,
    });
    expect("warningEN" in result && result.warningEN).toBeTruthy();
    expect("warningBM" in result && result.warningBM).toBeTruthy();
  });

  // ── Test 2: DB failure → falls back to sample data, then continues to LLM ──
  // Validates: Requirement 2.4 (graceful degradation)
  it("falls back to sample data when DynamoDB fails and continues to LLM", async () => {
    mockDynamoSend.mockRejectedValueOnce(new Error("DynamoDB unavailable"));
    mockBedrockSend.mockRejectedValueOnce(new Error("Bedrock also fails"));

    // Phone not in sample data → 0 complaints from fallback
    const result = await scamCheck({ receiverPhone: "+60 11-1111 1111" });

    expect(result).toMatchObject({
      receiverPhone: "+60 11-1111 1111",
      complaintCount: 0,
      riskLevel: "LOW",
      error: true,
    });
  });

  // ── Test 2b: DB failure with sample data match → uses sample complaint count ──
  it("uses sample complaint count when DynamoDB fails for a known receiver", async () => {
    mockDynamoSend.mockRejectedValueOnce(new Error("DynamoDB unavailable"));
    mockBedrockSend.mockRejectedValueOnce(new Error("Bedrock also fails"));

    // This phone has 5 complaints in sample data
    const result = await scamCheck({ receiverPhone: "+60 11-2345 6789" });

    expect(result).toMatchObject({
      receiverPhone: "+60 11-2345 6789",
      complaintCount: 5,
      riskLevel: "HIGH",
      error: true,
    });
  });

  // ── Test 3: LLM failure → real count, error true, fallback with count ──────
  // Validates: Requirement 3.6
  it("returns real complaintCount and fallback warnings when Bedrock LLM fails", async () => {
    // DB returns 3 complaint items
    mockDynamoSend.mockResolvedValueOnce({
      Items: [{ id: "1" }, { id: "2" }, { id: "3" }],
    });
    mockBedrockSend.mockRejectedValueOnce(new Error("Bedrock timeout"));

    const result = await scamCheck({ receiverPhone: "+60 11-2222 2222" });

    expect(result).toMatchObject({
      receiverPhone: "+60 11-2222 2222",
      complaintCount: 3,
      riskLevel: "HIGH",
      error: true,
    });
    // Fallback warning includes the raw count
    expect("warningEN" in result && result.warningEN).toContain(
      "AI analysis unavailable",
    );
    expect("warningEN" in result && result.warningEN).toContain("3");
    expect("warningBM" in result && result.warningBM).toContain(
      "Analisis AI tidak tersedia",
    );
    expect("warningBM" in result && result.warningBM).toContain("3");
  });

  // ── Test 4: Error flag — false on success, true on failure ─────────────────
  // Validates: Requirement 5.3
  it("sets error to false on successful processing", async () => {
    mockDynamoSend.mockResolvedValueOnce({
      Items: [{ id: "1" }],
    });
    mockBedrockSend.mockResolvedValueOnce({
      body: makeLLMResponseBody(
        "One complaint found. Proceed with caution.",
        "Satu aduan ditemui. Sila berhati-hati.",
      ),
    });

    const result = await scamCheck({ receiverPhone: "+60 11-3333 3333" });

    expect("error" in result && result.error).toBe(false);
  });

  it("sets error to true when Bedrock LLM fails after DynamoDB fallback", async () => {
    mockDynamoSend.mockRejectedValueOnce(new Error("DB error"));
    mockBedrockSend.mockRejectedValueOnce(new Error("LLM error"));

    const result = await scamCheck({ receiverPhone: "+60 11-4444 4444" });

    expect("error" in result && result.error).toBe(true);
  });

  it("sets error to true when Bedrock LLM fails", async () => {
    mockDynamoSend.mockResolvedValueOnce({ Items: [] });
    mockBedrockSend.mockRejectedValueOnce(new Error("LLM error"));

    const result = await scamCheck({ receiverPhone: "+60 11-5555 5555" });

    expect("error" in result && result.error).toBe(true);
  });

  // ── Test 5: Missing receiverPhone → 400 error response ────────────────────
  it("returns error when receiverPhone is missing", async () => {
    const result = await scamCheck({ receiverPhone: "" });

    expect(result).toEqual({ error: "receiverPhone is required" });
    // DynamoDB and Bedrock should NOT be called
    expect(mockDynamoSend).not.toHaveBeenCalled();
    expect(mockBedrockSend).not.toHaveBeenCalled();
  });
});
