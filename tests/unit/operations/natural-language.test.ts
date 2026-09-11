import { describe, it, expect } from "vitest";
import {
  parseNaturalDate,
  safeParseNaturalDate,
  parseNaturalDateDebug,
} from "../../../src/operations/natural-language.js";
import { localDate } from "../../../src/core/local-date.js";

const REF = localDate(2026, 9, 11); // Friday

describe("parseNaturalDate — English", () => {
  it("today", () => {
    const d = parseNaturalDate("today", { referenceDate: REF });
    expect(d).toEqual(REF);
  });
  it("yesterday", () => {
    const d = parseNaturalDate("yesterday", { referenceDate: REF });
    expect(d).toEqual(localDate(2026, 9, 10));
  });
  it("tomorrow", () => {
    const d = parseNaturalDate("tomorrow", { referenceDate: REF });
    expect(d).toEqual(localDate(2026, 9, 12));
  });
  it("day after tomorrow", () => {
    const d = parseNaturalDate("day after tomorrow", { referenceDate: REF });
    expect(d).toEqual(localDate(2026, 9, 13));
  });
  it("next week", () => {
    const d = parseNaturalDate("next week", { referenceDate: REF });
    expect(d).toEqual(localDate(2026, 9, 18));
  });
  it("last week", () => {
    const d = parseNaturalDate("last week", { referenceDate: REF });
    expect(d).toEqual(localDate(2026, 9, 4));
  });
  it("next month", () => {
    const d = parseNaturalDate("next month", { referenceDate: REF });
    expect(d.month).toBe(10);
  });
  it("last month", () => {
    const d = parseNaturalDate("last month", { referenceDate: REF });
    expect(d.month).toBe(8);
  });
  it("next year", () => {
    const d = parseNaturalDate("next year", { referenceDate: REF });
    expect(d.year).toBe(2027);
  });
  it("last year", () => {
    const d = parseNaturalDate("last year", { referenceDate: REF });
    expect(d.year).toBe(2025);
  });
  it("next monday", () => {
    const d = parseNaturalDate("next monday", { referenceDate: REF }); // REF is Friday
    expect(d).toEqual(localDate(2026, 9, 14));
  });
  it("last friday", () => {
    const d = parseNaturalDate("last friday", { referenceDate: REF });
    expect(d).toEqual(localDate(2026, 9, 4));
  });
  it("in 3 days", () => {
    const d = parseNaturalDate("in 3 days", { referenceDate: REF });
    expect(d).toEqual(localDate(2026, 9, 14));
  });
  it("in 2 weeks", () => {
    const d = parseNaturalDate("in 2 weeks", { referenceDate: REF });
    expect(d).toEqual(localDate(2026, 9, 25));
  });
  it("3 days ago", () => {
    const d = parseNaturalDate("3 days ago", { referenceDate: REF });
    expect(d).toEqual(localDate(2026, 9, 8));
  });
  it("5 months ago", () => {
    const d = parseNaturalDate("5 months ago", { referenceDate: REF });
    expect(d.month).toBe(4);
  });
  it("2 years ago", () => {
    const d = parseNaturalDate("2 years ago", { referenceDate: REF });
    expect(d.year).toBe(2024);
  });
  it("start of month", () => {
    const d = parseNaturalDate("start of month", { referenceDate: REF });
    expect(d).toEqual(localDate(2026, 9, 1));
  });
  it("end of month", () => {
    const d = parseNaturalDate("end of month", { referenceDate: REF });
    expect(d).toEqual(localDate(2026, 9, 30));
  });
  it("start of year", () => {
    const d = parseNaturalDate("start of year", { referenceDate: REF });
    expect(d).toEqual(localDate(2026, 1, 1));
  });
  it("end of year", () => {
    const d = parseNaturalDate("end of year", { referenceDate: REF });
    expect(d).toEqual(localDate(2026, 12, 31));
  });
  it("start of next month", () => {
    const d = parseNaturalDate("start of next month", { referenceDate: REF });
    expect(d).toEqual(localDate(2026, 10, 1));
  });
  it("end of last year", () => {
    const d = parseNaturalDate("end of last year", { referenceDate: REF });
    expect(d).toEqual(localDate(2025, 12, 31));
  });
  it("ISO date passthrough", () => {
    const d = parseNaturalDate("2026-01-15", { referenceDate: REF });
    expect(d).toEqual(localDate(2026, 1, 15));
  });
  it("N days from now", () => {
    const d = parseNaturalDate("7 days from now", { referenceDate: REF });
    expect(d).toEqual(localDate(2026, 9, 18));
  });
});

describe("parseNaturalDate — Thai locale", () => {
  it("วันนี้", () => {
    const d = parseNaturalDate("วันนี้", { referenceDate: REF, locale: "th" });
    expect(d).toEqual(REF);
  });
  it("พรุ่งนี้", () => {
    const d = parseNaturalDate("พรุ่งนี้", {
      referenceDate: REF,
      locale: "th",
    });
    expect(d).toEqual(localDate(2026, 9, 12));
  });
  it("เมื่อวาน", () => {
    const d = parseNaturalDate("เมื่อวาน", {
      referenceDate: REF,
      locale: "th",
    });
    expect(d).toEqual(localDate(2026, 9, 10));
  });
  it("เดือนหน้า", () => {
    const d = parseNaturalDate("เดือนหน้า", {
      referenceDate: REF,
      locale: "th",
    });
    expect(d.month).toBe(10);
  });
});

describe("parseNaturalDate — Japanese locale", () => {
  it("今日", () => {
    const d = parseNaturalDate("今日", { referenceDate: REF, locale: "ja" });
    expect(d).toEqual(REF);
  });
  it("明日", () => {
    const d = parseNaturalDate("明日", { referenceDate: REF, locale: "ja" });
    expect(d).toEqual(localDate(2026, 9, 12));
  });
  it("来週", () => {
    const d = parseNaturalDate("来週", { referenceDate: REF, locale: "ja" });
    expect(d).toEqual(localDate(2026, 9, 18));
  });
});

describe("safeParseNaturalDate", () => {
  it("returns null for unrecognized input", () => {
    expect(
      safeParseNaturalDate("gibberish xyz", { referenceDate: REF }),
    ).toBeNull();
  });
  it("returns date for valid input", () => {
    expect(safeParseNaturalDate("tomorrow", { referenceDate: REF })).toEqual(
      localDate(2026, 9, 12),
    );
  });
});

describe("parseNaturalDateDebug", () => {
  it("returns pattern info", () => {
    const r = parseNaturalDateDebug("yesterday", { referenceDate: REF });
    expect(r.pattern).toBe("yesterday");
    expect(r.date).toEqual(localDate(2026, 9, 10));
  });
});
