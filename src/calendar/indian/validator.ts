import {
  isGregorianLeapYear,
  parseGregorianMonthCode,
} from "../../core/gregorian-math.js";
import { ChroneraError } from "../../errors/errors.js";
import { INDIAN_IDENTITY, SAKA_OFFSET } from "./constants.js";

import type { CalendarValidator } from "../types.js";
import type {
  CalendarDate,
  ChroneraIssue,
  MonthCode,
} from "../../public-types.js";

export function assertIndianDate(date: CalendarDate): void {
  if (date.calendar !== "indian") {
    throw new ChroneraError(
      "CHRONERA_INVALID_CALENDAR",
      `Expected calendar "indian", received "${date.calendar}".`,
    );
  }
}

export function isIndianLeapYear(sakaYear: number): boolean {
  return isGregorianLeapYear(sakaYear + SAKA_OFFSET);
}

export function daysInIndianMonth(sakaYear: number, month: number): number {
  if (month < 1 || month > 12) return 0;
  if (month === 1) {
    return isIndianLeapYear(sakaYear) ? 31 : 30;
  }
  if (month <= 6) {
    return 31;
  }
  return 30;
}

export const indianValidator: CalendarValidator = {
  identity: INDIAN_IDENTITY,

  validate(date: CalendarDate): readonly ChroneraIssue[] {
    assertIndianDate(date);
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

    if (date.year < 1 || date.year > 9900) {
      issues.push({
        code: "CHRONERA_OUT_OF_RANGE",
        message: `Indian Saka calendar supports years 1..9900. Received year: ${date.year}.`,
        path: ["year"],
      });
    }

    const maxDays = daysInIndianMonth(date.year, monthNum);
    if (date.day < 1 || date.day > maxDays) {
      issues.push({
        code: "CHRONERA_INVALID_DATE",
        message: `Invalid day ${date.day} for Saka year ${date.year} month ${monthNum}. Expected 1..${maxDays}.`,
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
    return daysInIndianMonth(year, month);
  },

  isLeapYear(year: number): boolean {
    return isIndianLeapYear(year);
  },
};
