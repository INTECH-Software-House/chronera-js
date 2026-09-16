import { ChroneraError } from "../errors/errors.js";
import { dateRange } from "../core/range.js";
import {
  addDays,
  addMonths,
  getAbsoluteDay,
  isAfter,
  isEqual,
} from "./convenience.js";

import type { DateOrCalendarDate, DateRange } from "../public-types.js";

// ---------------------------------------------------------------------------
// Core Predicates
// ---------------------------------------------------------------------------

/**
 * Returns true if the given date falls within the range, respecting inclusivity flags.
 */
export function rangeContains<T extends DateOrCalendarDate>(
  range: DateRange<T>,
  date: T,
): boolean {
  const startAbs = getAbsoluteDay(range.start);
  const endAbs = getAbsoluteDay(range.end);
  const dateAbs = getAbsoluteDay(date);

  const afterStart = range.startInclusive
    ? dateAbs >= startAbs
    : dateAbs > startAbs;
  const beforeEnd = range.endInclusive ? dateAbs <= endAbs : dateAbs < endAbs;

  return afterStart && beforeEnd;
}

/**
 * Returns true if two ranges have any overlapping dates (respecting inclusivity).
 */
export function rangeOverlaps<T extends DateOrCalendarDate>(
  a: DateRange<T>,
  b: DateRange<T>,
): boolean {
  const aStartAbs = getAbsoluteDay(a.start);
  const aEndAbs = getAbsoluteDay(a.end);
  const bStartAbs = getAbsoluteDay(b.start);
  const bEndAbs = getAbsoluteDay(b.end);

  // a starts before b ends AND b starts before a ends
  const aBeforeBEnd =
    a.startInclusive && b.endInclusive
      ? aStartAbs <= bEndAbs
      : a.startInclusive || b.endInclusive
        ? aStartAbs < bEndAbs
        : aStartAbs < bEndAbs;

  const bBeforeAEnd =
    b.startInclusive && a.endInclusive
      ? bStartAbs <= aEndAbs
      : b.startInclusive || a.endInclusive
        ? bStartAbs < aEndAbs
        : bStartAbs < aEndAbs;

  return aBeforeBEnd && bBeforeAEnd;
}

/**
 * Returns the intersection of two ranges, or null if they do not overlap.
 * The resulting range uses the most restrictive inclusivity at each boundary.
 */
export function rangeIntersection<T extends DateOrCalendarDate>(
  a: DateRange<T>,
  b: DateRange<T>,
): DateRange<T> | null {
  if (!rangeOverlaps(a, b)) {
    return null;
  }

  const aStartAbs = getAbsoluteDay(a.start);
  const bStartAbs = getAbsoluteDay(b.start);
  const aEndAbs = getAbsoluteDay(a.end);
  const bEndAbs = getAbsoluteDay(b.end);

  let start: T;
  let startInclusive: boolean;
  if (aStartAbs > bStartAbs) {
    start = a.start;
    startInclusive = a.startInclusive;
  } else if (bStartAbs > aStartAbs) {
    start = b.start;
    startInclusive = b.startInclusive;
  } else {
    // same absolute day — use the more restrictive (exclusive takes priority)
    start = a.start;
    startInclusive = a.startInclusive && b.startInclusive;
  }

  let end: T;
  let endInclusive: boolean;
  if (aEndAbs < bEndAbs) {
    end = a.end;
    endInclusive = a.endInclusive;
  } else if (bEndAbs < aEndAbs) {
    end = b.end;
    endInclusive = b.endInclusive;
  } else {
    // same absolute day — use more restrictive
    end = a.end;
    endInclusive = a.endInclusive && b.endInclusive;
  }

  return dateRange(start, end, startInclusive, endInclusive);
}

/**
 * Returns the union (bounding range) of two ranges.
 * Throws if the ranges neither overlap nor are adjacent.
 */
export function rangeUnion<T extends DateOrCalendarDate>(
  a: DateRange<T>,
  b: DateRange<T>,
): DateRange<T> {
  const aStartAbs = getAbsoluteDay(a.start);
  const bStartAbs = getAbsoluteDay(b.start);
  const aEndAbs = getAbsoluteDay(a.end);
  const bEndAbs = getAbsoluteDay(b.end);

  // Check overlap or adjacency (within 1 day)
  const overlapsOrAdjacent =
    rangeOverlaps(a, b) ||
    Math.abs(aEndAbs - bStartAbs) <= 1 ||
    Math.abs(bEndAbs - aStartAbs) <= 1;

  if (!overlapsOrAdjacent) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      "Cannot compute union of non-overlapping, non-adjacent ranges.",
    );
  }

  let start: T;
  let startInclusive: boolean;
  if (aStartAbs < bStartAbs) {
    start = a.start;
    startInclusive = a.startInclusive;
  } else if (bStartAbs < aStartAbs) {
    start = b.start;
    startInclusive = b.startInclusive;
  } else {
    // same day — use the more inclusive (inclusive beats exclusive)
    start = a.start;
    startInclusive = a.startInclusive || b.startInclusive;
  }

  let end: T;
  let endInclusive: boolean;
  if (aEndAbs > bEndAbs) {
    end = a.end;
    endInclusive = a.endInclusive;
  } else if (bEndAbs > aEndAbs) {
    end = b.end;
    endInclusive = b.endInclusive;
  } else {
    // same day — use more inclusive
    end = a.end;
    endInclusive = a.endInclusive || b.endInclusive;
  }

  return dateRange(start, end, startInclusive, endInclusive);
}

/**
 * Returns the length of the range in days (absolute difference, respecting inclusivity).
 * Exclusive boundaries reduce the count by one on the corresponding side.
 *
 * - `[s, e]` inclusive-inclusive → `e - s + 1`
 * - `[s, e)` half-open → `e - s`
 * - `(s, e]` half-open → `e - s`
 * - `(s, e)` exclusive-exclusive → `e - s - 1`
 */
export function rangeLengthInDays<T extends DateOrCalendarDate>(
  range: DateRange<T>,
): number {
  const startAbs = getAbsoluteDay(range.start);
  const endAbs = getAbsoluteDay(range.end);
  const base = endAbs - startAbs;
  const startAdj = range.startInclusive ? 0 : 1;
  const endAdj = range.endInclusive ? 1 : 0;
  return base - startAdj + endAdj;
}

// ---------------------------------------------------------------------------
// Iterators
// ---------------------------------------------------------------------------

const MAX_EACH_DAY = 3650;

/**
 * Returns an array of every day from start to end (both inclusive).
 * Throws `ChroneraError('CHRONERA_OUT_OF_RANGE')` if the range exceeds 3650 days.
 */
export function eachDayOfInterval<T extends DateOrCalendarDate>(
  start: T,
  end: T,
): T[] {
  const startAbs = getAbsoluteDay(start);
  const endAbs = getAbsoluteDay(end);
  const count = endAbs - startAbs + 1;

  if (count > MAX_EACH_DAY) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `eachDayOfInterval: range of ${count} days exceeds the maximum of ${MAX_EACH_DAY} days (~10 years). Use eachWeekOfInterval or eachMonthOfInterval for larger ranges.`,
    );
  }

  if (count <= 0) {
    return [];
  }

  const result: T[] = [];
  let current = start;
  for (let i = 0; i < count; i++) {
    result.push(current);
    current = addDays(current, 1);
  }
  return result;
}

/**
 * Returns an array of the first day of each 7-day week interval within [start, end].
 */
export function eachWeekOfInterval<T extends DateOrCalendarDate>(
  start: T,
  end: T,
): T[] {
  const endAbs = getAbsoluteDay(end);
  const result: T[] = [];
  let current = start;

  while (!isAfter(current, end) && getAbsoluteDay(current) <= endAbs) {
    result.push(current);
    current = addDays(current, 7);
  }
  return result;
}

/**
 * Returns the first day of each calendar month within [start, end].
 */
export function eachMonthOfInterval<T extends DateOrCalendarDate>(
  start: T,
  end: T,
): T[] {
  const result: T[] = [];
  let current = start;

  while (!isAfter(current, end)) {
    result.push(current);
    // Move to start of next month relative to the original start
    const nextMonth = addMonths(start, result.length, "constrain");
    if (isAfter(nextMonth, end)) break;
    current = nextMonth;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Splitters
// ---------------------------------------------------------------------------

/**
 * Splits a [start, end] interval into individual day ranges (each 1 day long).
 */
export function splitByDay<T extends DateOrCalendarDate>(
  start: T,
  end: T,
): DateRange<T>[] {
  const days = eachDayOfInterval(start, end);
  return days.map((day) => dateRange(day, day, true, true));
}

/**
 * Splits a [start, end] interval into week-long sub-ranges (7 days each),
 * with the first and last sub-ranges bounded by the original start/end.
 */
export function splitByWeek<T extends DateOrCalendarDate>(
  start: T,
  end: T,
): DateRange<T>[] {
  const result: DateRange<T>[] = [];
  let weekStart = start;

  while (!isAfter(weekStart, end)) {
    const weekEnd = addDays(weekStart, 6);
    const clampedEnd = isAfter(weekEnd, end) ? end : weekEnd;
    result.push(dateRange(weekStart, clampedEnd, true, true));
    weekStart = addDays(weekStart, 7);
  }
  return result;
}

/**
 * Splits a [start, end] interval into month sub-ranges, bounded by original start/end.
 */
export function splitByMonth<T extends DateOrCalendarDate>(
  start: T,
  end: T,
): DateRange<T>[] {
  const result: DateRange<T>[] = [];
  let monthStart = start;
  let offset = 0;

  while (!isAfter(monthStart, end)) {
    // Calculate the end of the current month relative to `start`
    // by getting the next month start and subtracting 1 day
    const nextMonthStart = addMonths(start, offset + 1, "constrain");
    const monthEnd = isAfter(nextMonthStart, end)
      ? end
      : addDays(nextMonthStart, -1);

    result.push(dateRange(monthStart, monthEnd, true, true));

    if (isAfter(nextMonthStart, end) || isEqual(nextMonthStart, end)) {
      break;
    }

    monthStart = nextMonthStart;
    offset++;
  }

  return result;
}
