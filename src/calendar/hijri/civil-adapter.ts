import { ChroneraError } from "../../errors/errors.js";

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

// Islamic Civil: Friday 16 July 622 CE (Julian) -> absolute day -492997
const ISLAMIC_CIVIL_EPOCH = -492997;

const LEAP_YEARS_IN_30 = new Set([2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29]);

export function isIslamicCivilLeapYear(year: number): boolean {
  const cycleYear = ((year % 30) + 30) % 30;
  return LEAP_YEARS_IN_30.has(cycleYear);
}

export function daysInIslamicCivilMonth(year: number, month: number): number {
  if (month < 1 || month > 12) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Islamic civil month must be between 1 and 12; received ${month}.`,
    );
  }
  if (month === 12) {
    return isIslamicCivilLeapYear(year) ? 30 : 29;
  }
  return month % 2 === 1 ? 30 : 29;
}

export function islamicCivilToAbsoluteDay(
  year: number,
  month: number,
  day: number,
): number {
  const yMinus1 = year - 1;
  const cycles = Math.floor(yMinus1 / 30);
  const remainingYears = yMinus1 - cycles * 30;

  let days = cycles * 10631;
  for (let y = 1; y <= remainingYears; y++) {
    days += isIslamicCivilLeapYear(y) ? 355 : 354;
  }

  for (let m = 1; m < month; m++) {
    days += daysInIslamicCivilMonth(year, m);
  }

  days += day - 1;
  return ISLAMIC_CIVIL_EPOCH + days;
}

export function islamicCivilFromAbsoluteDay(absDay: number): {
  year: number;
  month: number;
  day: number;
} {
  let days = absDay - ISLAMIC_CIVIL_EPOCH;
  if (days < 0) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `Absolute day ${absDay} is prior to the Islamic civil epoch.`,
    );
  }

  const cycles = Math.floor(days / 10631);
  let year = cycles * 30 + 1;
  days -= cycles * 10631;

  while (true) {
    const daysInYear = isIslamicCivilLeapYear(year) ? 355 : 354;
    if (days < daysInYear) {
      break;
    }
    days -= daysInYear;
    year++;
  }

  let month = 1;
  while (month <= 12) {
    const mDays = daysInIslamicCivilMonth(year, month);
    if (days < mDays) {
      break;
    }
    days -= mDays;
    month++;
  }

  const day = days + 1;
  return { year, month, day };
}

export const ISLAMIC_CIVIL_IDENTITY: CalendarIdentity = {
  id: "islamic-civil",
  algorithm: "chronera-islamic-civil-tabular-v1",
  deterministic: true,
  validRange: {
    first: ISLAMIC_CIVIL_EPOCH,
    last: 2932896,
  },
};

export const islamicCivilValidator: CalendarValidator = {
  identity: ISLAMIC_CIVIL_IDENTITY,
  validate(date: CalendarDate): readonly ChroneraIssue[] {
    const issues: ChroneraIssue[] = [];
    if (date.year < 1) {
      issues.push({
        code: "CHRONERA_OUT_OF_RANGE",
        message: `Islamic civil year must be >= 1; received ${date.year}.`,
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
          message: `Invalid day ${date.day} for month ${date.monthCode} in Islamic civil year ${date.year}.`,
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

export const islamicCivilAdapter: CalendarAdapter = {
  identity: ISLAMIC_CIVIL_IDENTITY,
  converter: {
    identity: ISLAMIC_CIVIL_IDENTITY,
    toAbsoluteDay(date: CalendarDate): number {
      const month = date.month ?? Number.parseInt(date.monthCode.slice(1), 10);
      return islamicCivilToAbsoluteDay(date.year, month, date.day);
    },
    fromAbsoluteDay(day: number): CalendarDate {
      const res = islamicCivilFromAbsoluteDay(day);
      return {
        kind: "calendar-date",
        calendar: "islamic-civil",
        era: "AH",
        eraYear: res.year,
        year: res.year,
        monthCode: `M${String(res.month).padStart(2, "0")}`,
        month: res.month,
        day: res.day,
      };
    },
  },
  validator: islamicCivilValidator,
};
