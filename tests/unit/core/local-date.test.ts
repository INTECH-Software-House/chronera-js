import { describe, expect, it } from "vitest";
import { localDate } from "../../../src/core/local-date.js";
import { ChroneraError } from "../../../src/errors/errors.js";

describe("localDate", () => {
  it("creates valid Gregorian dates", () => {
    const d = localDate(2026, 9, 2);
    expect(d).toEqual({
      kind: "local-date",
      year: 2026,
      month: 9,
      day: 2,
    });
  });

  it("handles leap year February 29", () => {
    const leap = localDate(2024, 2, 29);
    expect(leap.day).toBe(29);
  });

  it("rejects February 29 in non-leap year 2026", () => {
    expect(() => localDate(2026, 2, 29)).toThrow(ChroneraError);
    expect(() => localDate(2026, 2, 29)).toThrowError(/Invalid day 29/);
  });

  it("rejects February 29 in century non-leap year 1900", () => {
    expect(() => localDate(1900, 2, 29)).toThrow(ChroneraError);
  });

  it("accepts February 29 in 400-year leap century 2000", () => {
    const d = localDate(2000, 2, 29);
    expect(d.day).toBe(29);
  });

  it("rejects year out of range [0001, 9999]", () => {
    expect(() => localDate(0, 1, 1)).toThrow(ChroneraError);
    expect(() => localDate(10000, 1, 1)).toThrow(ChroneraError);
  });

  it("rejects month out of range", () => {
    expect(() => localDate(2026, 0, 1)).toThrow(ChroneraError);
    expect(() => localDate(2026, 13, 1)).toThrow(ChroneraError);
  });

  it("rejects non-integer fields", () => {
    expect(() => localDate(2026.5, 1, 1)).toThrow(ChroneraError);
    expect(() => localDate(2026, 1.5, 1)).toThrow(ChroneraError);
    expect(() => localDate(2026, 1, 1.5)).toThrow(ChroneraError);
  });
});
