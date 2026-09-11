import {
  absoluteDayFromGregorianFields,
  gregorianFieldsFromAbsoluteDay,
} from "../core/absolute-day.js";
import { daysInGregorianMonth } from "../core/gregorian-math.js";
import { addMonths, addYears, getAbsoluteDay } from "./convenience.js";
import type { DateOrCalendarDate, LocalDate } from "../public-types.js";

// ---------------------------------------------------------------------------
// Age & Birthday Engine
// ---------------------------------------------------------------------------

export interface AgeResult {
  readonly years: number;
  readonly months: number;
  readonly days: number;
  readonly totalDays: number;
}

function toLocalDate(date: DateOrCalendarDate): LocalDate {
  if (date.kind === "local-date") return date;
  // For CalendarDate, use absolute day to convert back to Gregorian LocalDate
  const abs = getAbsoluteDay(date);
  const f = gregorianFieldsFromAbsoluteDay(abs);
  return { kind: "local-date", year: f.year, month: f.month, day: f.day };
}

/**
 * Calculates the age between a birth date and a reference date (default: today).
 * Returns { years, months, days, totalDays }.
 *
 * @example
 * calculateAge(localDate(2000, 1, 15)) // → { years: 26, months: 7, days: 27, totalDays: 9736 }
 */
export function calculateAge(
  birthDate: DateOrCalendarDate,
  asOf?: DateOrCalendarDate,
): AgeResult {
  const birth = toLocalDate(birthDate);
  const ref = asOf
    ? toLocalDate(asOf)
    : (() => {
        const now = new Date();
        return {
          kind: "local-date" as const,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate(),
        };
      })();

  const birthAbs = absoluteDayFromGregorianFields(
    birth.year,
    birth.month,
    birth.day,
  );
  const refAbs = absoluteDayFromGregorianFields(ref.year, ref.month, ref.day);
  const totalDays = Math.max(0, refAbs - birthAbs);

  // Compute years
  let years = ref.year - birth.year;
  // Check if birthday hasn't occurred this year yet
  const hadBirthdayThisYear =
    ref.month > birth.month ||
    (ref.month === birth.month && ref.day >= birth.day);
  if (!hadBirthdayThisYear) years--;

  // Compute remaining months
  const afterYears = addYears(
    { ...birth, kind: "local-date" },
    years,
    "constrain",
  ) as LocalDate;
  let months = 0;
  let cursor = afterYears;
  while (true) {
    const next = addMonths(cursor, 1, "constrain") as LocalDate;
    const nextAbs = absoluteDayFromGregorianFields(
      next.year,
      next.month,
      next.day,
    );
    if (nextAbs > refAbs) break;
    months++;
    cursor = next;
  }

  // Remaining days
  const cursorAbs = absoluteDayFromGregorianFields(
    cursor.year,
    cursor.month,
    cursor.day,
  );
  const days = refAbs - cursorAbs;

  return { years, months, days, totalDays };
}

/**
 * Returns the next birthday after the reference date (exclusive).
 *
 * @example
 * nextBirthday(localDate(1990, 6, 15)) // → upcoming June 15
 */
export function nextBirthday(
  birthDate: DateOrCalendarDate,
  asOf?: DateOrCalendarDate,
): LocalDate {
  const birth = toLocalDate(birthDate);
  const ref = asOf
    ? toLocalDate(asOf)
    : (() => {
        const now = new Date();
        return {
          kind: "local-date" as const,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate(),
        };
      })();

  // Try this year's birthday
  const maxDay = daysInGregorianMonth(ref.year, birth.month);
  const birthdayDay = Math.min(birth.day, maxDay);
  const thisYear: LocalDate = {
    kind: "local-date",
    year: ref.year,
    month: birth.month,
    day: birthdayDay,
  };
  const thisYearAbs = absoluteDayFromGregorianFields(
    thisYear.year,
    thisYear.month,
    thisYear.day,
  );
  const refAbs = absoluteDayFromGregorianFields(ref.year, ref.month, ref.day);

  if (thisYearAbs > refAbs) return thisYear;

  // Next year's birthday
  const nextYear = ref.year + 1;
  const maxDayNext = daysInGregorianMonth(nextYear, birth.month);
  return {
    kind: "local-date",
    year: nextYear,
    month: birth.month,
    day: Math.min(birth.day, maxDayNext),
  };
}

/**
 * Returns number of days until the next birthday (0 = today).
 */
export function daysUntilBirthday(
  birthDate: DateOrCalendarDate,
  asOf?: DateOrCalendarDate,
): number {
  const ref = asOf
    ? toLocalDate(asOf)
    : (() => {
        const now = new Date();
        return {
          kind: "local-date" as const,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate(),
        };
      })();

  const next = nextBirthday(birthDate, ref);
  const refAbs = absoluteDayFromGregorianFields(ref.year, ref.month, ref.day);
  const nextAbs = absoluteDayFromGregorianFields(
    next.year,
    next.month,
    next.day,
  );
  return nextAbs - refAbs;
}

/**
 * Returns whether today (or asOf date) is the birthday.
 */
export function isBirthday(
  birthDate: DateOrCalendarDate,
  asOf?: DateOrCalendarDate,
): boolean {
  const birth = toLocalDate(birthDate);
  const ref = asOf
    ? toLocalDate(asOf)
    : (() => {
        const now = new Date();
        return {
          kind: "local-date" as const,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate(),
        };
      })();

  const maxDay = daysInGregorianMonth(ref.year, birth.month);
  return ref.month === birth.month && ref.day === Math.min(birth.day, maxDay);
}

/**
 * Returns true if the age is a milestone (1, 5, 10, 18, 21, 25, 30, ...).
 */
export function isMilestoneAge(
  birthDate: DateOrCalendarDate,
  milestones: number[],
  asOf?: DateOrCalendarDate,
): boolean {
  const age = calculateAge(birthDate, asOf);
  return milestones.includes(age.years);
}

// ---------------------------------------------------------------------------
// Countdown Engine
// ---------------------------------------------------------------------------

export interface CountdownResult {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly totalMilliseconds: number;
  readonly isPast: boolean;
}

/**
 * Returns the countdown from now to a future date.
 * For dates in the past, isPast = true and all values are 0.
 *
 * @example
 * countdown(localDate(2026, 12, 31)) // → { days: 111, hours: 0, minutes: 0, seconds: 0, ... }
 */
export function countdown(
  targetDate: DateOrCalendarDate,
  fromDate?: DateOrCalendarDate,
): CountdownResult {
  const target = toLocalDate(targetDate);
  const now = fromDate
    ? toLocalDate(fromDate)
    : (() => {
        const d = new Date();
        return {
          kind: "local-date" as const,
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          day: d.getDate(),
        };
      })();

  const targetAbs = absoluteDayFromGregorianFields(
    target.year,
    target.month,
    target.day,
  );
  const nowAbs = absoluteDayFromGregorianFields(now.year, now.month, now.day);
  const diffDays = targetAbs - nowAbs;

  if (diffDays < 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMilliseconds: 0,
      isPast: true,
    };
  }

  const totalMs = diffDays * 86_400_000;
  return {
    days: diffDays,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMilliseconds: totalMs,
    isPast: false,
  };
}

/**
 * Time elapsed from a past date to now (in days, months, years).
 */
export interface ElapsedResult {
  readonly years: number;
  readonly months: number;
  readonly days: number;
  readonly totalDays: number;
}

export function timeElapsed(
  pastDate: DateOrCalendarDate,
  asOf?: DateOrCalendarDate,
): ElapsedResult {
  const age = calculateAge(pastDate, asOf);
  return {
    years: age.years,
    months: age.months,
    days: age.days,
    totalDays: age.totalDays,
  };
}
