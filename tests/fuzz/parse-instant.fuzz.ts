import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { safeParseInstant } from "../../src/parse/safe-parse.js";

describe("fuzz: parseInstant", () => {
  it("never throws unhandled exceptions on arbitrary unicode strings", () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const res = safeParseInstant(input);
        expect(typeof res.success).toBe("boolean");
      }),
      { numRuns: 1000 },
    );
  });
});
