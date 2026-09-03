import { describe, expect, it } from "vitest";
import { parseInstant } from "../../../src/parse/parse-instant.js";
import { parseLocalDate } from "../../../src/parse/parse-local-date.js";
import { ChroneraError } from "../../../src/errors/errors.js";

describe("parse edge cases and complex patterns", () => {
  it("parses localDate with month name patterns (MMM and MMMM)", () => {
    const d1 = parseLocalDate("02 Sep 2026", {
      pattern: "dd MMM yyyy",
      locale: "en-US",
    });
    expect(d1.year).toBe(2026);
    expect(d1.month).toBe(9);
    expect(d1.day).toBe(2);

    const d2 = parseLocalDate("September 02, 2026", {
      pattern: "MMMM dd, yyyy",
      locale: "en-US",
    });
    expect(d2.year).toBe(2026);
    expect(d2.month).toBe(9);
    expect(d2.day).toBe(2);
  });

  it("handles rounding of excess fractional seconds in parseInstant", () => {
    // .1236 -> rounds to .124
    const inst = parseInstant("2026-09-02T06:45:00.1236Z", {
      excessFractionalSeconds: "round",
    });
    const expected = Date.parse("2026-09-02T06:45:00.124Z");
    expect(inst.epochMilliseconds).toBe(expected);
  });

  it("handles carry-over from rounding .9999 to next second", () => {
    const inst = parseInstant("2026-09-02T06:45:00.9999Z", {
      excessFractionalSeconds: "round",
    });
    const expected = Date.parse("2026-09-02T06:45:01.000Z");
    expect(inst.epochMilliseconds).toBe(expected);
  });

  it("formats and parses with era tokens", () => {
    const d = parseLocalDate("02/09/2026 AD", {
      pattern: "dd/MM/yyyy G",
      locale: "en-US",
    });
    expect(d.year).toBe(2026);
  });

  it("throws CHRONERA_PATTERN_TOO_LONG for pattern exceeding 256 chars", () => {
    const longPattern = "y".repeat(257);
    expect(() => parseLocalDate("2026", { pattern: longPattern })).toThrow(
      ChroneraError,
    );
  });
});
