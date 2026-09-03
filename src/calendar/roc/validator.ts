import {
  daysInGregorianMonth,
  isGregorianLeapYear,
  parseGregorianMonthCode,
} from "../../core/gregorian-math.js";
import { ChroneraError } from "../../errors/errors.js";
import { ROC_IDENTITY, ROC_OFFSET } from "./constants.js";

import type { CalendarValidator } from "../types.js";
import type {
  CalendarDate,
  ChroneraIssue,
  MonthCode,
} from "../../public-types.js";

export function assertRocDate(date: CalendarDate): void {
  if (date.calendar !== "roc") {
    throw new ChroneraError(
      "CHRONERA_INVALID_CALENDAR",
      `Expected calendar "roc", received "${date.calendar}".`,
    );
  }
}

export const rocValidator: CalendarValidator = {
  identity: ROC_IDENTITY,

  validate(date: CalendarDate): readonly ChroneraIssue[] {
    assertRocDate(date);
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

    const gregorianYear = date.year + ROC_OFFSET;
    if (date.year < 1 || gregorianYear > 9999) {
      issues.push({
        code: "CHRONERA_OUT_OF_RANGE",
        message: `ROC calendar supports years >= 1 (Gregorian 1912-9999). Received year: ${date.year}.`,
        path: ["year"],
      });
    }

    const maxDays = daysInGregorianMonth(gregorianYear, monthNum);
    if (date.day < 1 || date.day > maxDays) {
      issues.push({
        code: "CHRONERA_INVALID_DATE",
        message: `Invalid day ${date.day} for ROC year ${date.year} month ${monthNum}. Expected 1..${maxDays}.`,
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
    return daysInGregorianMonth(year + ROC_OFFSET, month);
  },

  isLeapYear(year: number): boolean {
    return isGregorianLeapYear(year + ROC_OFFSET);
  },
};
