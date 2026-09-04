import { getIsoDayOfWeek } from "../core/iso-week.js";
import { getAbsoluteDay } from "./convenience.js";

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
