import {
  daysInIslamicCivilMonth,
  isIslamicCivilLeapYear,
  islamicCivilFromAbsoluteDay,
  islamicCivilToAbsoluteDay,
} from "./civil-adapter.js";

import type {
  CalendarAdapter,
  CalendarIdentity,
  CalendarValidator,
} from "../types.js";
import type {
  CalendarDate,
  ChroneraIssue,
  MonthCode,
} from "../../public-types.js";

// Islamic Tabular (Astronomical epoch: Thursday July 15, 622 CE = -492998)
const ISLAMIC_TBLA_EPOCH = -492998;
const EPOCH_DIFF = ISLAMIC_TBLA_EPOCH - -492997; // -1

export const ISLAMIC_TBLA_IDENTITY: CalendarIdentity = {
  id: "islamic-tbla",
  algorithm: "chronera-islamic-tbla-astronomical-v1",
  deterministic: true,
  validRange: {
    first: ISLAMIC_TBLA_EPOCH,
    last: 2932896,
  },
};

export const islamicTblaValidator: CalendarValidator = {
  identity: ISLAMIC_TBLA_IDENTITY,
  validate(date: CalendarDate): readonly ChroneraIssue[] {
    const issues: ChroneraIssue[] = [];
    if (date.year < 1) {
      issues.push({
        code: "CHRONERA_OUT_OF_RANGE",
        message: `Islamic tbla year must be >= 1; received ${date.year}.`,
        path: ["year"],
      });
    }
    const month = date.month ?? Number.parseInt(date.monthCode.slice(1), 10);
    if (month < 1 || month > 12) {
      issues.push({
        code: "CHRONERA_INVALID_DATE",
        message: `Invalid month ${month}. Expected 1-12.`,
        path: ["monthCode"],
      });
    } else if (date.year >= 1) {
      const maxDay = daysInIslamicCivilMonth(date.year, month);
      if (date.day < 1 || date.day > maxDay) {
        issues.push({
          code: "CHRONERA_INVALID_DATE",
          message: `Invalid day ${date.day} for month ${date.monthCode} in Islamic tbla year ${date.year}.`,
          path: ["day"],
        });
      }
    }
    return issues;
  },
  daysInMonth(year: number, monthCode: MonthCode): number {
    const month = Number.parseInt(monthCode.slice(1), 10);
    return daysInIslamicCivilMonth(year, month);
  },
  isLeapYear(year: number): boolean {
    return isIslamicCivilLeapYear(year);
  },
};

export const islamicTblaAdapter: CalendarAdapter = {
  identity: ISLAMIC_TBLA_IDENTITY,
  converter: {
    identity: ISLAMIC_TBLA_IDENTITY,
    toAbsoluteDay(date: CalendarDate): number {
      const month = date.month ?? Number.parseInt(date.monthCode.slice(1), 10);
      const civilAbs = islamicCivilToAbsoluteDay(date.year, month, date.day);
      return civilAbs + EPOCH_DIFF;
    },
    fromAbsoluteDay(day: number): CalendarDate {
      const civilDay = day - EPOCH_DIFF;
      const res = islamicCivilFromAbsoluteDay(civilDay);
      return {
        kind: "calendar-date",
        calendar: "islamic-tbla",
        era: "AH",
        eraYear: res.year,
        year: res.year,
        monthCode: `M${String(res.month).padStart(2, "0")}`,
        month: res.month,
        day: res.day,
      };
    },
  },
  validator: islamicTblaValidator,
};
