import {
  daysInGregorianMonth,
  isGregorianLeapYear,
  parseGregorianMonthCode,
} from "../../core/gregorian-math.js";
import { GREGORIAN_IDENTITY } from "./constants.js";

import type {
  CalendarDate,
  ChroneraIssue,
  MonthCode,
} from "../../public-types.js";
import type { CalendarValidator } from "../types.js";

export const gregorianValidator: CalendarValidator = {
  identity: GREGORIAN_IDENTITY,

  validate(date: CalendarDate): readonly ChroneraIssue[] {
    const issues: ChroneraIssue[] = [];

    if (date.year < 1 || date.year > 9999) {
      issues.push({
        code: "CHRONERA_OUT_OF_RANGE",
        message: `Gregorian year must be between 1 and 9999; received ${date.year}.`,
        path: ["year"],
      });
    }

    let month = 0;
    try {
      month = parseGregorianMonthCode(date.monthCode);
    } catch {
      issues.push({
        code: "CHRONERA_INVALID_DATE",
        message: `Invalid Gregorian monthCode: "${date.monthCode}". Expected M01-M12.`,
        path: ["monthCode"],
      });
    }

    if (month >= 1 && month <= 12 && date.year >= 1 && date.year <= 9999) {
      const maxDays = daysInGregorianMonth(date.year, month);
      if (date.day < 1 || date.day > maxDays) {
        issues.push({
          code: "CHRONERA_INVALID_DATE",
          message: `Invalid day ${date.day} for month ${date.monthCode} in Gregorian year ${date.year}.`,
          path: ["day"],
        });
      }
    }

    return issues;
  },

  daysInMonth(year: number, monthCode: MonthCode): number {
    const month = parseGregorianMonthCode(monthCode);
    return daysInGregorianMonth(year, month);
  },

  isLeapYear(year: number): boolean {
    return isGregorianLeapYear(year);
  },
};
