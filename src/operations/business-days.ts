import { getIsoDayOfWeek } from "../core/iso-week.js";
import { ChroneraError } from "../errors/errors.js";
import { addDays, getAbsoluteDay } from "./convenience.js";

import type { DateOrCalendarDate } from "../public-types.js";

/**
 * Returns true if the specified date falls on a weekend (Saturday or Sunday).
 * Works across all calendars (Gregorian, Thai Buddhist, Japanese, Hijri, etc.).
 */
export function isWeekend(date: DateOrCalendarDate): boolean {
  const abs = getAbsoluteDay(date);
  const dow = getIsoDayOfWeek(abs);
  return dow === 6 || dow === 7;
}

/**
 * Returns true if the specified date falls on a weekday (Monday through Friday).
 * Works across all calendars (Gregorian, Thai Buddhist, Japanese, Hijri, etc.).
 */
export function isWeekday(date: DateOrCalendarDate): boolean {
  return !isWeekend(date);
}

/**
 * Adds business days to a LocalDate or CalendarDate, skipping Saturdays and Sundays.
 * Supports positive, negative, and zero day additions.
 * Uses O(1) mathematical week advancement for large intervals while preserving exact calendar semantics.
 */
export function addBusinessDays<T extends DateOrCalendarDate>(
  date: T,
  amount: number,
): T {
  if (!Number.isFinite(amount)) {
    throw new ChroneraError(
      "CHRONERA_INVALID_ARGUMENT",
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

  const deltaDays = currentAbs - startAbs;
  return addDays(date, deltaDays);
}

/**
 * Subtracts business days from a LocalDate or CalendarDate, skipping weekends.
 */
export function subtractBusinessDays<T extends DateOrCalendarDate>(
  date: T,
  amount: number,
): T {
  return addBusinessDays(date, -amount);
}

/**
 * Returns the signed count of business days between two dates (left - right).
 * Positive if left is after right, negative if left is before right, 0 if identical.
 * Works across all calendar systems with O(1) mathematical week acceleration.
 */
export function diffInBusinessDays(
  left: DateOrCalendarDate,
  right: DateOrCalendarDate,
): number {
  const absLeft = getAbsoluteDay(left);
  const absRight = getAbsoluteDay(right);

  if (absLeft === absRight) {
    return 0;
  }

  if (absLeft < absRight) {
    return -diffInBusinessDays(right, left);
  }

  let count = 0;
  let current = absRight;

  // O(1) acceleration: any consecutive 7 calendar days contains exactly 5 business days
  const fullWeeks = Math.floor((absLeft - current) / 7);
  if (fullWeeks > 0) {
    count += fullWeeks * 5;
    current += fullWeeks * 7;
  }

  // Step through remainder (at most 6 days)
  while (current < absLeft) {
    current++;
    const dow = getIsoDayOfWeek(current);
    if (dow !== 6 && dow !== 7) {
      count++;
    }
  }

  return count;
}
