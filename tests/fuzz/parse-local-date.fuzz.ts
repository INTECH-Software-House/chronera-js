import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { safeParseLocalDate } from "../../src/parse/safe-parse.js";

describe("fuzz: parseLocalDate", () => {
  it("never throws unhandled exceptions on arbitrary unicode strings", () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const res = safeParseLocalDate(input);
        expect(typeof res.success).toBe("boolean");
      }),
      { numRuns: 1000 },
    );
  });
});
