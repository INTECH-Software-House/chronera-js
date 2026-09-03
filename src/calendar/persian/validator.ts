import { parseGregorianMonthCode } from "../../core/gregorian-math.js";
import { ChroneraError } from "../../errors/errors.js";
import { PERSIAN_IDENTITY } from "./constants.js";
import { daysInPersianMonth, isPersianLeapYear } from "./math.js";

import type { CalendarValidator } from "../types.js";
import type {
  CalendarDate,
  ChroneraIssue,
  MonthCode,
} from "../../public-types.js";

export function assertPersianDate(date: CalendarDate): void {
  if (date.calendar !== "persian") {
    throw new ChroneraError(
      "CHRONERA_INVALID_CALENDAR",
      `Expected calendar "persian", received "${date.calendar}".`,
    );
  }
}

export const persianValidator: CalendarValidator = {
  identity: PERSIAN_IDENTITY,

  validate(date: CalendarDate): readonly ChroneraIssue[] {
    assertPersianDate(date);
    const issues: ChroneraIssue[] = [];

    const monthNum = parseGregorianMonthCode(date.monthCode);
    if (monthNum === null) {
      issues.push({
        code: "CHRONERA_INVALID_DATE",
        message: `Invalid monthCode: "${date.monthCode}". Expected M01-M12.`,
        path: ["monthCode"],
      });
      return issues;
    }

    if (date.year < 1 || date.year > 9999) {
      issues.push({
        code: "CHRONERA_OUT_OF_RANGE",
        message: `Persian calendar supports years 1..9999. Received year: ${date.year}.`,
        path: ["year"],
      });
    }

    const maxDays = daysInPersianMonth(date.year, monthNum);
    if (date.day < 1 || date.day > maxDays) {
      issues.push({
        code: "CHRONERA_INVALID_DATE",
        message: `Invalid day ${date.day} for Persian year ${date.year} month ${monthNum}. Expected 1..${maxDays}.`,
        path: ["day"],
      });
    }

    return issues;
  },

  daysInMonth(year: number, monthCode: MonthCode): number {
    const month = parseGregorianMonthCode(monthCode);
    if (month === null) {
      throw new ChroneraError(
        "CHRONERA_INVALID_DATE",
        `Invalid monthCode: "${monthCode}". Expected M01-M12.`,
      );
    }
    return daysInPersianMonth(year, month);
  },

  isLeapYear(year: number): boolean {
    return isPersianLeapYear(year);
  },
};
