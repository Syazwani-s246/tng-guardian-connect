import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import * as fs from "fs";
import * as path from "path";

/**
 * Bug Condition Exploration Test — Property 1
 *
 * Validates: Requirements 1.1, 1.3, 2.1, 2.3
 *
 * This test reads the raw content of ai-monitor.tsx and asserts that:
 * - The file SHALL NOT contain git merge conflict markers
 * - The file SHALL NOT contain a reference to the non-existent /demo route
 * - The file SHALL NOT import Link from @tanstack/react-router (unused after /demo removal)
 * - The file SHALL contain TransactionReview (HEAD functionality preserved)
 * - The file SHALL contain useQuery (React Query integration preserved)
 * - The file SHALL contain createFileRoute("/ai-monitor") (route definition intact)
 *
 * EXPECTED: This test FAILS on unfixed code — failure confirms the bug exists.
 */
describe("Bug Condition Exploration — ai-monitor.tsx merge conflict", () => {
  it("Property 1: file SHALL NOT contain merge conflict markers and SHALL preserve HEAD functionality", () => {
    /**
     * **Validates: Requirements 1.1, 1.3, 2.1, 2.3**
     */
    fc.assert(
      fc.property(
        fc.constant(path.resolve(__dirname, "ai-monitor.tsx")),
        (filePath: string) => {
          const content = fs.readFileSync(filePath, "utf-8");

          // Bug condition: no merge conflict markers
          expect(content).not.toContain("<<<<<<< HEAD");
          expect(content).not.toContain("=======");
          expect(content).not.toContain(">>>>>>>");

          // Bug condition: no invalid route reference
          expect(content).not.toContain('to="/demo"');

          // Bug condition: no unused Link import (unused after /demo removal)
          expect(content).not.toMatch(
            /import\s*\{[^}]*\bLink\b[^}]*\}\s*from\s*["']@tanstack\/react-router["']/,
          );

          // Preservation: HEAD functionality must be present
          expect(content).toContain("TransactionReview");
          expect(content).toContain("useQuery");
          expect(content).toContain('createFileRoute("/ai-monitor")');
        },
      ),
      { numRuns: 1 },
    );
  });
});
