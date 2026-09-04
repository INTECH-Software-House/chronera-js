import { defaultCalendarRegistry } from "../calendar/registry.js";
import {
  absoluteDayFromGregorianFields,
  gregorianFieldsFromAbsoluteDay,
} from "../core/absolute-day.js";
import { daysInGregorianMonth } from "../core/gregorian-math.js";
import { ChroneraError } from "../errors/errors.js";
import { projectInstantToZonedFields } from "../runtime/timezone.js";

import type {
  CalendarDate,
  DateOrCalendarDate,
  Instant,
  IntervalInclusivity,
  MonthCode,
  TimeZoneId,
} from "../public-types.js";

/**
 * Returns the astronomical AbsoluteDay integer for any LocalDate or CalendarDate.
 */
export function getAbsoluteDay(date: DateOrCalendarDate): number {
  if (date.kind === "local-date") {
    return absoluteDayFromGregorianFields(date.year, date.month, date.day);
  }
  const adapter = defaultCalendarRegistry.getAdapter(date.calendar);
  if (!adapter.converter) {
    throw new ChroneraError(
      "CHRONERA_UNSUPPORTED_OPERATION",
      `Calendar "${date.calendar}" does not support conversion to absolute timeline.`,
    );
  }
  return adapter.converter.toAbsoluteDay(date);
}

// ---------------------------------------------------------------------------
// Comparison Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if date1 is strictly before date2 in the timeline.
 * Works seamlessly across all calendar systems.
 */
export function isBefore(
  date1: DateOrCalendarDate,
  date2: DateOrCalendarDate,
): boolean {
  return getAbsoluteDay(date1) < getAbsoluteDay(date2);
}

/**
 * Returns true if date1 is strictly after date2 in the timeline.
 * Works seamlessly across all calendar systems.
 */
export function isAfter(
  date1: DateOrCalendarDate,
  date2: DateOrCalendarDate,
): boolean {
  return getAbsoluteDay(date1) > getAbsoluteDay(date2);
}

/**
 * Returns true if date1 and date2 represent the exact same absolute day in the timeline.
 * For example, Thai Buddhist BE 2569-09-04 and Gregorian CE 2026-09-04 are equal.
 */
export function isEqual(
  date1: DateOrCalendarDate,
  date2: DateOrCalendarDate,
): boolean {
  return getAbsoluteDay(date1) === getAbsoluteDay(date2);
}

/**
 * Alias for isEqual: returns true if both dates represent the same day in the timeline.
 */
export function isSameDay(
  date1: DateOrCalendarDate,
  date2: DateOrCalendarDate,
): boolean {
  return isEqual(date1, date2);
}

/**
 * Returns true if date falls between start and end.
 * @param inclusivity - '[]' (inclusive), '[)' (half-open), '(]' (half-open), '()' (exclusive). Default is '[]'.
 */
export function isBetween(
  date: DateOrCalendarDate,
  start: DateOrCalendarDate,
  end: DateOrCalendarDate,
  inclusivity: IntervalInclusivity = "[]",
): boolean {
  const target = getAbsoluteDay(date);
  const s = getAbsoluteDay(start);
  const e = getAbsoluteDay(end);

  if (s > e) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      "Start date must not be after end date.",
    );
  }

  switch (inclusivity) {
    case "[]":
      return target >= s && target <= e;
    case "[)":
      return target >= s && target < e;
    case "(]":
      return target > s && target <= e;
    case "()":
      return target > s && target < e;
    default:
      throw new ChroneraError(
        "CHRONERA_INVALID_DATE",
        `Invalid inclusivity: "${String(inclusivity)}". Expected "[]", "[)", "(]", or "()".`,
      );
  }
}

/**
 * Returns true if date represents today in the specified timezone (or the host environment's timezone).
 */
export function isToday(
  date: DateOrCalendarDate,
  timeZone?: TimeZoneId,
): boolean {
  const tz =
    timeZone ??
    (typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC") ??
    "UTC";

  const nowInstant: Instant = {
    kind: "instant",
    epochMilliseconds: Date.now(),
  };

  const zoned = projectInstantToZonedFields(nowInstant, tz);
  const todayAbsDay = absoluteDayFromGregorianFields(
    zoned.year,
    zoned.month,
    zoned.day,
  );
  return getAbsoluteDay(date) === todayAbsDay;
}

// ---------------------------------------------------------------------------
// Date Arithmetic Shortcuts
// ---------------------------------------------------------------------------

/**
 * Adds days to a LocalDate or CalendarDate.
 * Operates on astronomical timeline days, ensuring 100% precision across all calendars.
 */
export function addDays<T extends DateOrCalendarDate>(
  date: T,
  amount: number,
  overflow: "constrain" | "reject" = "reject",
): T {
  if (date.kind === "local-date") {
    const currentAbs = absoluteDayFromGregorianFields(
      date.year,
      date.month,
      date.day,
    );
    const newAbs = currentAbs + amount;
    const fields = gregorianFieldsFromAbsoluteDay(newAbs);
    return {
      kind: "local-date",
      year: fields.year,
      month: fields.month,
      day: fields.day,
    } as T;
  }

  const adapter = defaultCalendarRegistry.getAdapter(date.calendar);
  if (adapter.arithmetic) {
    return adapter.arithmetic.add(date, { days: amount }, overflow) as T;
  }

  if (adapter.converter) {
    const currentAbs = adapter.converter.toAbsoluteDay(date);
    const newAbs = currentAbs + amount;
    return adapter.converter.fromAbsoluteDay(newAbs) as T;
  }

  throw new ChroneraError(
    "CHRONERA_UNSUPPORTED_OPERATION",
    `Calendar "${date.calendar}" does not support date arithmetic or conversion.`,
  );
}

/**
 * Subtracts days from a LocalDate or CalendarDate.
 */
export function subtractDays<T extends DateOrCalendarDate>(
  date: T,
  amount: number,
  overflow: "constrain" | "reject" = "reject",
): T {
  return addDays(date, -amount, overflow);
}

/**
 * Adds months to a LocalDate or CalendarDate.
 * Handles month-end clamping according to overflow parameter ("constrain" or "reject").
 */
export function addMonths<T extends DateOrCalendarDate>(
  date: T,
  amount: number,
  overflow: "constrain" | "reject" = "reject",
): T {
  if (date.kind === "local-date") {
    const currentMonth = date.month;
    const totalMonths = date.year * 12 + (currentMonth - 1) + amount;
    const year = Math.floor(totalMonths / 12);
    const month = (((totalMonths % 12) + 12) % 12) + 1;

    const maxDays = daysInGregorianMonth(year, month);
    let day = date.day;
    if (day > maxDays) {
      if (overflow === "reject") {
        throw new ChroneraError(
          "CHRONERA_OUT_OF_RANGE",
          `Day ${day} exceeds maximum days ${maxDays} for month ${month} in year ${year}.`,
        );
      }
      day = maxDays;
    }
    return {
      kind: "local-date",
      year,
      month,
      day,
    } as T;
  }

  const adapter = defaultCalendarRegistry.getAdapter(date.calendar);
  if (adapter.arithmetic) {
    return adapter.arithmetic.add(date, { months: amount }, overflow) as T;
  }

  const currentMonth =
    date.month ?? Number.parseInt(date.monthCode.slice(1), 10);
  const totalMonths = date.year * 12 + (currentMonth - 1) + amount;
  const year = Math.floor(totalMonths / 12);
  const month = (((totalMonths % 12) + 12) % 12) + 1;
  const monthCode = `M${String(month).padStart(2, "0")}` as MonthCode;

  const maxDays = adapter.validator.daysInMonth(year, monthCode);
  let day = date.day;
  if (day > maxDays) {
    if (overflow === "reject") {
      throw new ChroneraError(
        "CHRONERA_OUT_OF_RANGE",
        `Day ${day} exceeds maximum days ${maxDays} for month ${monthCode} in year ${year}.`,
      );
    }
    day = maxDays;
  }

  if (adapter.converter) {
    const candidate: CalendarDate = {
      kind: "calendar-date",
      calendar: date.calendar,
      year,
      monthCode,
      month,
      day,
    };
    const absDay = adapter.converter.toAbsoluteDay(candidate);
    return adapter.converter.fromAbsoluteDay(absDay) as T;
  }

  return {
    ...date,
    year,
    monthCode,
    month,
    day,
  } as T;
}

/**
 * Subtracts months from a LocalDate or CalendarDate.
 */
export function subtractMonths<T extends DateOrCalendarDate>(
  date: T,
  amount: number,
  overflow: "constrain" | "reject" = "reject",
): T {
  return addMonths(date, -amount, overflow);
}

/**
 * Adds years to a LocalDate or CalendarDate.
 * Handles leap year constraints according to overflow parameter ("constrain" or "reject").
 */
export function addYears<T extends DateOrCalendarDate>(
  date: T,
  amount: number,
  overflow: "constrain" | "reject" = "reject",
): T {
  if (date.kind === "local-date") {
    const targetYear = date.year + amount;
    const maxDays = daysInGregorianMonth(targetYear, date.month);
    let day = date.day;
    if (day > maxDays) {
      if (overflow === "reject") {
        throw new ChroneraError(
          "CHRONERA_OUT_OF_RANGE",
          `Day ${day} exceeds maximum days ${maxDays} for month ${date.month} in year ${targetYear}.`,
        );
      }
      day = maxDays;
    }
    return {
      kind: "local-date",
      year: targetYear,
      month: date.month,
      day,
    } as T;
  }

  const adapter = defaultCalendarRegistry.getAdapter(date.calendar);
  if (adapter.arithmetic) {
    return adapter.arithmetic.add(date, { years: amount }, overflow) as T;
  }

  const targetYear = date.year + amount;
  const month = date.month ?? Number.parseInt(date.monthCode.slice(1), 10);
  const maxDays = adapter.validator.daysInMonth(targetYear, date.monthCode);

  let day = date.day;
  if (day > maxDays) {
    if (overflow === "reject") {
      throw new ChroneraError(
        "CHRONERA_OUT_OF_RANGE",
        `Day ${day} exceeds maximum days ${maxDays} for month ${date.monthCode} in year ${targetYear}.`,
      );
    }
    day = maxDays;
  }

  if (adapter.converter) {
    const candidate: CalendarDate = {
      kind: "calendar-date",
      calendar: date.calendar,
      year: targetYear,
      monthCode: date.monthCode,
      month,
      day,
    };
    const absDay = adapter.converter.toAbsoluteDay(candidate);
    return adapter.converter.fromAbsoluteDay(absDay) as T;
  }

  return {
    ...date,
    year: targetYear,
    day,
    eraYear: date.eraYear !== undefined ? date.eraYear + amount : undefined,
  } as T;
}

/**
 * Subtracts years from a LocalDate or CalendarDate.
 */
export function subtractYears<T extends DateOrCalendarDate>(
  date: T,
  amount: number,
  overflow: "constrain" | "reject" = "reject",
): T {
  return addYears(date, -amount, overflow);
}

/**
 * Returns the signed difference in days between two dates (left - right).
 * Works across different calendars.
 */
export function diffInDays(
  left: DateOrCalendarDate,
  right: DateOrCalendarDate,
): number {
  return getAbsoluteDay(left) - getAbsoluteDay(right);
}

// ---------------------------------------------------------------------------
// Date Boundary Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the start of the month (Day 1) for a LocalDate or CalendarDate.
 */
export function startOfMonth<T extends DateOrCalendarDate>(date: T): T {
  if (date.kind === "local-date") {
    return {
      kind: "local-date",
      year: date.year,
      month: date.month,
      day: 1,
    } as T;
  }

  const adapter = defaultCalendarRegistry.getAdapter(date.calendar);
  if (adapter.converter) {
    const month = date.month ?? Number.parseInt(date.monthCode.slice(1), 10);
    const candidate: CalendarDate = {
      kind: "calendar-date",
      calendar: date.calendar,
      year: date.year,
      monthCode: date.monthCode,
      month,
      day: 1,
    };
    const absDay = adapter.converter.toAbsoluteDay(candidate);
    return adapter.converter.fromAbsoluteDay(absDay) as T;
  }

  return {
    ...date,
    day: 1,
  } as T;
}

/**
 * Returns the end of the month (last day) for a LocalDate or CalendarDate.
 * Properly accounts for leap years in any calendar.
 */
export function endOfMonth<T extends DateOrCalendarDate>(date: T): T {
  if (date.kind === "local-date") {
    const maxDay = daysInGregorianMonth(date.year, date.month);
    return {
      kind: "local-date",
      year: date.year,
      month: date.month,
      day: maxDay,
    } as T;
  }

  const adapter = defaultCalendarRegistry.getAdapter(date.calendar);
  const maxDay = adapter.validator.daysInMonth(date.year, date.monthCode);

  if (adapter.converter) {
    const month = date.month ?? Number.parseInt(date.monthCode.slice(1), 10);
    const candidate: CalendarDate = {
      kind: "calendar-date",
      calendar: date.calendar,
      year: date.year,
      monthCode: date.monthCode,
      month,
      day: maxDay,
    };
    const absDay = adapter.converter.toAbsoluteDay(candidate);
    return adapter.converter.fromAbsoluteDay(absDay) as T;
  }

  return {
    ...date,
    day: maxDay,
  } as T;
}

/**
 * Returns the start of the year (Month 1, Day 1) for a LocalDate or CalendarDate.
 */
export function startOfYear<T extends DateOrCalendarDate>(date: T): T {
  if (date.kind === "local-date") {
    return {
      kind: "local-date",
      year: date.year,
      month: 1,
      day: 1,
    } as T;
  }

  const adapter = defaultCalendarRegistry.getAdapter(date.calendar);
  if (adapter.converter) {
    const candidate: CalendarDate = {
      kind: "calendar-date",
      calendar: date.calendar,
      year: date.year,
      monthCode: "M01",
      month: 1,
      day: 1,
    };
    const absDay = adapter.converter.toAbsoluteDay(candidate);
    return adapter.converter.fromAbsoluteDay(absDay) as T;
  }

  return {
    ...date,
    monthCode: "M01" as MonthCode,
    month: 1,
    day: 1,
  } as T;
}

/**
 * Returns the end of the year (last day of the final month) for a LocalDate or CalendarDate.
 */
export function endOfYear<T extends DateOrCalendarDate>(date: T): T {
  if (date.kind === "local-date") {
    return {
      kind: "local-date",
      year: date.year,
      month: 12,
      day: 31,
    } as T;
  }

  const adapter = defaultCalendarRegistry.getAdapter(date.calendar);
  const finalMonthCode: MonthCode = "M12";
  const maxDay = adapter.validator.daysInMonth(date.year, finalMonthCode);

  if (adapter.converter) {
    const candidate: CalendarDate = {
      kind: "calendar-date",
      calendar: date.calendar,
      year: date.year,
      monthCode: finalMonthCode,
      month: 12,
      day: maxDay,
    };
    const absDay = adapter.converter.toAbsoluteDay(candidate);
    return adapter.converter.fromAbsoluteDay(absDay) as T;
  }

  return {
    ...date,
    monthCode: finalMonthCode,
    month: 12,
    day: maxDay,
  } as T;
}
