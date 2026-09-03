import {
  daysInGregorianMonth,
  isGregorianLeapYear,
  parseGregorianMonthCode,
} from "../../core/gregorian-math.js";
import { ChroneraError } from "../../errors/errors.js";
import { BUDDHIST_ERA_YEAR_OFFSET, BUDDHIST_IDENTITY } from "./constants.js";

import type {
  CalendarDate,
  ChroneraIssue,
  MonthCode,
} from "../../public-types.js";
import type { CalendarValidator } from "../types.js";

export function assertBuddhistDate(date: CalendarDate): void {
  if (date.calendar !== "buddhist") {
    throw new ChroneraError(
      "CHRONERA_INVALID_CALENDAR",
      `Expected calendar "buddhist"; received "${date.calendar}".`,
    );
  }
}

export const buddhistValidator: CalendarValidator = {
  identity: BUDDHIST_IDENTITY,

  validate(date: CalendarDate): readonly ChroneraIssue[] {
    assertBuddhistDate(date);
    const issues: ChroneraIssue[] = [];

    const minYear = 1 + BUDDHIST_ERA_YEAR_OFFSET;
    const maxYear = 9999 + BUDDHIST_ERA_YEAR_OFFSET;

    if (date.year < minYear || date.year > maxYear) {
      issues.push({
        code: "CHRONERA_OUT_OF_RANGE",
        message: `Buddhist year must be between ${minYear} and ${maxYear}; received ${date.year}.`,
        path: ["year"],
      });
    }

    let month = 0;
    try {
      month = parseGregorianMonthCode(date.monthCode);
    } catch {
      issues.push({
        code: "CHRONERA_INVALID_DATE",
        message: `Invalid Buddhist monthCode: "${date.monthCode}". Expected M01-M12.`,
        path: ["monthCode"],
      });
    }

    if (
      month >= 1 &&
      month <= 12 &&
      date.year >= minYear &&
      date.year <= maxYear
    ) {
      const gregYear = date.year - BUDDHIST_ERA_YEAR_OFFSET;
      const maxDays = daysInGregorianMonth(gregYear, month);
      if (date.day < 1 || date.day > maxDays) {
        issues.push({
          code: "CHRONERA_INVALID_DATE",
          message: `Invalid day ${date.day} for month ${date.monthCode} in Buddhist year ${date.year}.`,
          path: ["day"],
        });
      }
    }

    return issues;
  },

  daysInMonth(year: number, monthCode: MonthCode): number {
    const gregYear = year - BUDDHIST_ERA_YEAR_OFFSET;
    const month = parseGregorianMonthCode(monthCode);
    return daysInGregorianMonth(gregYear, month);
  },

  isLeapYear(year: number): boolean {
    const gregYear = year - BUDDHIST_ERA_YEAR_OFFSET;
    return isGregorianLeapYear(gregYear);
  },
};
