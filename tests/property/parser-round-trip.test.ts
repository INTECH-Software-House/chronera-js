import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { parseLocalDate } from "../../src/parse/parse-local-date.js";
import { formatWithPattern } from "../../src/format/format-pattern.js";
import { localDate } from "../../src/core/local-date.js";

describe("property: parser round trip", () => {
  it("localDate -> formatWithPattern yyyy-MM-dd -> parseLocalDate round-trips", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 28 }),
        (year, month, day) => {
          const ld = localDate(year, month, day);
          const str = formatWithPattern(ld, "yyyy-MM-dd");
          const parsed = parseLocalDate(str);

          expect(parsed.year).toBe(year);
          expect(parsed.month).toBe(month);
          expect(parsed.day).toBe(day);
        },
      ),
      { numRuns: 500 },
    );
  });
});
