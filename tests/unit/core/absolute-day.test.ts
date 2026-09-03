import { describe, expect, it } from "vitest";
import {
  absoluteDayFromGregorianFields,
  gregorianFieldsFromAbsoluteDay,
  MAX_ABSOLUTE_DAY,
  MIN_ABSOLUTE_DAY,
} from "../../../src/core/absolute-day.js";

describe("absolute-day", () => {
  it("maps 1970-01-01 to day 0", () => {
    expect(absoluteDayFromGregorianFields(1970, 1, 1)).toBe(0);
    expect(gregorianFieldsFromAbsoluteDay(0)).toEqual({
      year: 1970,
      month: 1,
      day: 1,
    });
  });

  it("maps 0001-01-01 to day -719162", () => {
    expect(absoluteDayFromGregorianFields(1, 1, 1)).toBe(MIN_ABSOLUTE_DAY);
    expect(gregorianFieldsFromAbsoluteDay(MIN_ABSOLUTE_DAY)).toEqual({
      year: 1,
      month: 1,
      day: 1,
    });
  });

  it("maps 9999-12-31 to day 2932896", () => {
    expect(absoluteDayFromGregorianFields(9999, 12, 31)).toBe(MAX_ABSOLUTE_DAY);
    expect(gregorianFieldsFromAbsoluteDay(MAX_ABSOLUTE_DAY)).toEqual({
      year: 9999,
      month: 12,
      day: 31,
    });
  });

  it("round-trips arbitrary dates", () => {
    const dates = [
      { year: 2026, month: 9, day: 2 },
      { year: 2024, month: 2, day: 29 },
      { year: 1900, month: 2, day: 28 },
      { year: 2000, month: 2, day: 29 },
      { year: 1582, month: 10, day: 15 },
    ];

    for (const d of dates) {
      const day = absoluteDayFromGregorianFields(d.year, d.month, d.day);
      const res = gregorianFieldsFromAbsoluteDay(day);
      expect(res).toEqual(d);
    }
  });
});
