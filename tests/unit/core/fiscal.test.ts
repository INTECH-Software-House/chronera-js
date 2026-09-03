import { describe, expect, it } from "vitest";
import {
  calendarDate,
  getFiscalYear,
  getQuarter,
  localDate,
} from "../../../src/index.js";
import { ChroneraError } from "../../../src/errors/errors.js";

import type { LocalDate, MonthCode } from "../../../src/public-types.js";

describe("Fiscal Year & Quarters Engine", () => {
  it("determines standard calendar quarters (Q1-Q4)", () => {
    expect(getQuarter(localDate(2026, 1, 15))).toBe(1);
    expect(getQuarter(localDate(2026, 3, 31))).toBe(1);
    expect(getQuarter(localDate(2026, 4, 1))).toBe(2);
    expect(getQuarter(localDate(2026, 6, 30))).toBe(2);
    expect(getQuarter(localDate(2026, 7, 1))).toBe(3);
    expect(getQuarter(localDate(2026, 9, 30))).toBe(3);
    expect(getQuarter(localDate(2026, 10, 1))).toBe(4);
    expect(getQuarter(localDate(2026, 12, 31))).toBe(4);
  });

  it("calculates fiscal year starting in April (UK/Japan/India/Canada)", () => {
    // 2026-04-01 is FY2027 Q1 (endYear default) or FY2026 Q1 (startYear)
    const aprilDate = localDate(2026, 4, 1);
    const fyEnd = getFiscalYear(aprilDate, {
      startMonth: 4,
      label: "endYear",
    });
    expect(fyEnd.fiscalYear).toBe(2027);
    expect(fyEnd.fiscalQuarter).toBe(1);
    expect(fyEnd.quarterMonth).toBe(1);

    const fyStart = getFiscalYear(aprilDate, {
      startMonth: 4,
      label: "startYear",
    });
    expect(fyStart.fiscalYear).toBe(2026);
    expect(fyStart.fiscalQuarter).toBe(1);

    // 2027-03-31 is FY2027 Q4
    const marchDate = localDate(2027, 3, 31);
    const fyMarch = getFiscalYear(marchDate, { startMonth: 4 });
    expect(fyMarch.fiscalYear).toBe(2027);
    expect(fyMarch.fiscalQuarter).toBe(4);
    expect(fyMarch.quarterMonth).toBe(3);
  });

  it("calculates fiscal year starting in October (US Federal Government)", () => {
    // 2025-10-01 starts FY2026 Q1
    const octDate = localDate(2025, 10, 1);
    const fyOct = getFiscalYear(octDate, { startMonth: 10 });
    expect(fyOct.fiscalYear).toBe(2026);
    expect(fyOct.fiscalQuarter).toBe(1);

    // 2026-09-30 is FY2026 Q4
    const sepDate = localDate(2026, 9, 30);
    const fySep = getFiscalYear(sepDate, { startMonth: 10 });
    expect(fySep.fiscalYear).toBe(2026);
    expect(fySep.fiscalQuarter).toBe(4);
  });

  it("supports CalendarDate inputs and rejects invalid inputs", () => {
    const cal = calendarDate({
      calendar: "gregory",
      year: 2026,
      monthCode: "M09",
      day: 2,
    });
    expect(getQuarter(cal)).toBe(3);

    expect(() => getQuarter({} as unknown as LocalDate)).toThrow(ChroneraError);

    const badMonthCode = {
      kind: "calendar-date" as const,
      calendar: "gregory" as const,
      year: 2026,
      monthCode: "M99" as unknown as MonthCode,
      day: 2,
    };
    expect(() => getQuarter(badMonthCode)).toThrow(ChroneraError);

    expect(() =>
      getFiscalYear(localDate(2026, 1, 1), { startMonth: 13 }),
    ).toThrow(RangeError);
  });
});
