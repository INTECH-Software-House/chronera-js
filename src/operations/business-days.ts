import { getIsoDayOfWeek } from "../core/iso-week.js";
import { localDate } from "../core/local-date.js";
import { gregorianFromAbsoluteDay } from "../calendar/gregory/absolute-day.js";
import { ChroneraError } from "../errors/errors.js";
import { addDays, getAbsoluteDay } from "./convenience.js";
import { isPublicHoliday } from "./holidays.js";
import { getHolidayCalendar } from "../holidays/registry.js";

import type { CountryCode, HolidayCalendar } from "../holidays/types.js";
import type { DateOrCalendarDate, LocalDate } from "../public-types.js";

/**
 * Options for business days arithmetic and queries.
 */
export interface BusinessDaysOptions {
  /**
   * Country code (e.g. "TH", "JP", "US") or custom HolidayCalendar or holiday date list or holiday predicate.
   */
  readonly holidays?:
    | CountryCode
    | string
    | HolidayCalendar
    | readonly DateOrCalendarDate[]
    | ((date: LocalDate) => boolean);
  /**
   * Custom weekend days (defaults to [6, 7], or [4, 5] if country is Iran, etc.).
   */
  readonly weekendDays?: readonly number[];
}

/**
 * Checks whether a given absolute day is a weekend according to options or country defaults.
 */
function isWeekendForOptions(
  abs: number,
  options?: BusinessDaysOptions,
): boolean {
  const dow = getIsoDayOfWeek(abs);
  if (options?.weekendDays && options.weekendDays.length > 0) {
    return options.weekendDays.includes(dow);
  }

  if (
    typeof options?.holidays === "string" ||
    (typeof options?.holidays === "object" &&
      options?.holidays !== null &&
      "country" in options.holidays)
  ) {
    try {
      const cal = getHolidayCalendar(options.holidays);
      if (cal.defaultWeekendDays) {
        return cal.defaultWeekendDays.includes(dow);
      }
    } catch {
      // Fallback to standard Saturday & Sunday
    }
  }

  return dow === 6 || dow === 7;
}

/**
 * Returns true if the specified absolute day is a non-working day (weekend or holiday).
 */
function isNonWorkingDay(abs: number, options?: BusinessDaysOptions): boolean {
  if (isWeekendForOptions(abs, options)) {
    return true;
  }

  const holidays = options?.holidays;
  if (!holidays) {
    return false;
  }

  const gFields = gregorianFromAbsoluteDay(abs);
  const gDate = localDate(gFields.year, gFields.month, gFields.day);

  if (typeof holidays === "function") {
    return holidays(gDate);
  }

  if (typeof holidays === "string" || "rules" in holidays) {
    return isPublicHoliday(gDate, holidays);
  }

  return holidays.some((hDate) => getAbsoluteDay(hDate) === abs);
}

/**
 * Returns true if the specified date falls on a weekend.
 * Supports custom weekend definitions per country (e.g. Thursday & Friday for Iran).
 */
export function isWeekend(
  date: DateOrCalendarDate,
  options?: Pick<BusinessDaysOptions, "weekendDays" | "holidays">,
): boolean {
  const abs = getAbsoluteDay(date);
  return isWeekendForOptions(abs, options);
}

/**
 * Returns true if the specified date falls on a weekday.
 */
export function isWeekday(
  date: DateOrCalendarDate,
  options?: Pick<BusinessDaysOptions, "weekendDays" | "holidays">,
): boolean {
  return !isWeekend(date, options);
}

/**
 * Returns true if the specified date is a business day (neither weekend nor public holiday).
 */
export function isBusinessDay(
  date: DateOrCalendarDate,
  options?: BusinessDaysOptions,
): boolean {
  const abs = getAbsoluteDay(date);
  return !isNonWorkingDay(abs, options);
}

/**
 * Adds business days to a LocalDate or CalendarDate, skipping weekends and optionally public holidays.
 * Supports positive, negative, and zero day additions.
 * Uses O(1) mathematical week advancement when no holidays are provided, or iterative evaluation with holiday constraints.
 */
export function addBusinessDays<T extends DateOrCalendarDate>(
  date: T,
  amount: number,
  options?: BusinessDaysOptions,
): T {
  if (!Number.isFinite(amount)) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      "Amount must be a finite integer.",
    );
  }

  const intAmount = Math.trunc(amount);
  if (intAmount === 0) {
    return date;
  }

  const startAbs = getAbsoluteDay(date);
  let currentAbs = startAbs;
  let remaining = intAmount;
  const step = remaining > 0 ? 1 : -1;

  // Fast-path: no holidays or custom weekends
  const hasHolidays = Boolean(options?.holidays);
  const hasCustomWeekends = Boolean(options?.weekendDays);

  if (!hasHolidays && !hasCustomWeekends) {
    while (remaining !== 0) {
      const currentDow = getIsoDayOfWeek(currentAbs);
      if (currentDow !== 6 && currentDow !== 7 && Math.abs(remaining) >= 5) {
        const fullWeeks = Math.trunc(remaining / 5);
        currentAbs += fullWeeks * 7;
        remaining %= 5;
      } else {
        currentAbs += step;
        const dow = getIsoDayOfWeek(currentAbs);
        if (dow !== 6 && dow !== 7) {
          remaining -= step;
        }
      }
    }
  } else {
    // Exact evaluation with holiday and custom weekend constraints
    while (remaining !== 0) {
      currentAbs += step;
      if (!isNonWorkingDay(currentAbs, options)) {
        remaining -= step;
      }
    }
  }

  const deltaDays = currentAbs - startAbs;
  return addDays(date, deltaDays);
}

/**
 * Subtracts business days from a LocalDate or CalendarDate, skipping weekends and optional holidays.
 */
export function subtractBusinessDays<T extends DateOrCalendarDate>(
  date: T,
  amount: number,
  options?: BusinessDaysOptions,
): T {
  return addBusinessDays(date, -amount, options);
}

/**
 * Returns the signed count of business days between two dates (left - right).
 * Positive if left is after right, negative if left is before right, 0 if identical.
 */
export function diffInBusinessDays(
  left: DateOrCalendarDate,
  right: DateOrCalendarDate,
  options?: BusinessDaysOptions,
): number {
  const absLeft = getAbsoluteDay(left);
  const absRight = getAbsoluteDay(right);

  if (absLeft === absRight) {
    return 0;
  }

  if (absLeft < absRight) {
    return -diffInBusinessDays(right, left, options);
  }

  let count = 0;
  let current = absRight;

  const hasHolidays = Boolean(options?.holidays);
  const hasCustomWeekends = Boolean(options?.weekendDays);

  if (!hasHolidays && !hasCustomWeekends) {
    // Fast-path O(1) acceleration: any consecutive 7 calendar days contains exactly 5 business days
    const fullWeeks = Math.floor((absLeft - current) / 7);
    if (fullWeeks > 0) {
      count += fullWeeks * 5;
      current += fullWeeks * 7;
    }

    while (current < absLeft) {
      current++;
      const dow = getIsoDayOfWeek(current);
      if (dow !== 6 && dow !== 7) {
        count++;
      }
    }
  } else {
    while (current < absLeft) {
      current++;
      if (!isNonWorkingDay(current, options)) {
        count++;
      }
    }
  }

  return count;
}
