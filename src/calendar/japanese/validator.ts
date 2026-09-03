import {
  daysInGregorianMonth,
  isGregorianLeapYear,
  parseGregorianMonthCode,
} from "../../core/gregorian-math.js";
import { ChroneraError } from "../../errors/errors.js";
import { ERA_BY_ID, ERA_BY_KANJI, JAPANESE_IDENTITY } from "./constants.js";

import type { CalendarValidator } from "../types.js";
import type {
  CalendarDate,
  ChroneraIssue,
  MonthCode,
} from "../../public-types.js";

export function assertJapaneseDate(date: CalendarDate): void {
  if (date.calendar !== "japanese") {
    throw new ChroneraError(
      "CHRONERA_INVALID_CALENDAR",
      `Expected calendar "japanese", received "${date.calendar}".`,
    );
  }
}

export function resolveJapaneseEra(era?: string) {
  if (!era) return undefined;
  const lower = era.toLowerCase();
  return ERA_BY_ID.get(lower) ?? ERA_BY_KANJI.get(era);
}

export const japaneseValidator: CalendarValidator = {
  identity: JAPANESE_IDENTITY,

  validate(date: CalendarDate): readonly ChroneraIssue[] {
    assertJapaneseDate(date);
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

    // Resolve effective Gregorian year
    let effectiveYear = date.year;
    if (date.era) {
      const eraDef = resolveJapaneseEra(date.era);
      if (!eraDef) {
        issues.push({
          code: "CHRONERA_INVALID_DATE",
          message: `Unknown Japanese era: "${date.era}". Expected reiwa, heisei, showa, taisho, meiji.`,
          path: ["era"],
        });
        return issues;
      }
      if (date.eraYear !== undefined) {
        effectiveYear = eraDef.offset + date.eraYear;
      } else if (date.year < 100) {
        effectiveYear = eraDef.offset + date.year;
      }
    }

    if (effectiveYear < 1868 || effectiveYear > 9999) {
      issues.push({
        code: "CHRONERA_OUT_OF_RANGE",
        message: `Japanese calendar supports dates from 1868 (Meiji 1) to 9999 CE. Received year: ${effectiveYear}.`,
        path: ["year"],
      });
    }

    const maxDays = daysInGregorianMonth(effectiveYear, monthNum);
    if (date.day < 1 || date.day > maxDays) {
      issues.push({
        code: "CHRONERA_INVALID_DATE",
        message: `Invalid day ${date.day} for year ${effectiveYear} month ${monthNum}. Expected 1..${maxDays}.`,
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
    return daysInGregorianMonth(year, month);
  },

  isLeapYear(year: number): boolean {
    return isGregorianLeapYear(year);
  },
};
