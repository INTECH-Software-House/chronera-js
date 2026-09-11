import {
  absoluteDayFromGregorianFields,
  gregorianFieldsFromAbsoluteDay,
} from "../core/absolute-day.js";
import { getAbsoluteDay } from "./convenience.js";
import type { DateOrCalendarDate, LocalDate } from "../public-types.js";

// ---------------------------------------------------------------------------
// Time Series & Bucketing Engine
// ---------------------------------------------------------------------------

export type BucketUnit = "day" | "week" | "month" | "quarter" | "year";

export interface BucketKey {
  readonly key: string;
  readonly label: string;
  readonly unit: BucketUnit;
}

export type BucketMap<T extends DateOrCalendarDate> = Map<string, T[]>;

function toLocalDate(date: DateOrCalendarDate): LocalDate {
  if (date.kind === "local-date") return date;
  const abs = getAbsoluteDay(date);
  const f = gregorianFieldsFromAbsoluteDay(abs);
  return { kind: "local-date", year: f.year, month: f.month, day: f.day };
}

function pad(n: number, w = 2): string {
  return String(n).padStart(w, "0");
}

function bucketKeyFor(date: LocalDate, unit: BucketUnit): string {
  switch (unit) {
    case "day":
      return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
    case "week": {
      // ISO week: find Monday of that week
      const abs = absoluteDayFromGregorianFields(
        date.year,
        date.month,
        date.day,
      );
      const dow = abs % 7; // 0=Mon
      const monday = gregorianFieldsFromAbsoluteDay(abs - dow);
      return `${monday.year}-W${pad(monday.month)}-${pad(monday.day)}`;
    }
    case "month":
      return `${date.year}-${pad(date.month)}`;
    case "quarter": {
      const q = Math.ceil(date.month / 3);
      return `${date.year}-Q${q}`;
    }
    case "year":
      return `${date.year}`;
  }
}

function bucketLabelFor(key: string, unit: BucketUnit): string {
  switch (unit) {
    case "day":
      return key; // YYYY-MM-DD
    case "week":
      return key; // YYYY-WMM-DD (start of week)
    case "month":
      return key; // YYYY-MM
    case "quarter":
      return key; // YYYY-Q1
    case "year":
      return key; // YYYY
  }
}

/**
 * Groups an array of dates into buckets by the given unit.
 * Returns a Map of key → dates[].
 * Keys are sorted chronologically.
 *
 * @example
 * const dates = [localDate(2026,9,1), localDate(2026,9,15), localDate(2026,10,1)];
 * bucketDates(dates, 'month')
 * // Map { '2026-09' => [...], '2026-10' => [...] }
 */
export function bucketDates<T extends DateOrCalendarDate>(
  dates: T[],
  unit: BucketUnit,
): BucketMap<T> {
  const map = new Map<string, T[]>();
  for (const date of dates) {
    const local = toLocalDate(date);
    const key = bucketKeyFor(local, unit);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(date);
  }
  // Sort keys chronologically
  const sorted = new Map<string, T[]>(
    [...map.entries()].sort(([a], [b]) => a.localeCompare(b)),
  );
  return sorted;
}

export function bucketByDay<T extends DateOrCalendarDate>(
  dates: T[],
): BucketMap<T> {
  return bucketDates(dates, "day");
}

export function bucketByWeek<T extends DateOrCalendarDate>(
  dates: T[],
): BucketMap<T> {
  return bucketDates(dates, "week");
}

export function bucketByMonth<T extends DateOrCalendarDate>(
  dates: T[],
): BucketMap<T> {
  return bucketDates(dates, "month");
}

export function bucketByQuarter<T extends DateOrCalendarDate>(
  dates: T[],
): BucketMap<T> {
  return bucketDates(dates, "quarter");
}

export function bucketByYear<T extends DateOrCalendarDate>(
  dates: T[],
): BucketMap<T> {
  return bucketDates(dates, "year");
}

// ---------------------------------------------------------------------------
// Histogram
// ---------------------------------------------------------------------------

export interface HistogramEntry {
  readonly key: string;
  readonly label: string;
  readonly count: number;
}

/**
 * Returns a frequency histogram of dates grouped by the given unit.
 * Result is sorted chronologically.
 *
 * @example
 * histogram(dates, 'month')
 * // [{ key: '2026-09', label: '2026-09', count: 12 }, ...]
 */
export function histogram(
  dates: DateOrCalendarDate[],
  unit: BucketUnit,
): HistogramEntry[] {
  const bucketed = bucketDates(dates, unit);
  return [...bucketed.entries()].map(([key, items]) => ({
    key,
    label: bucketLabelFor(key, unit),
    count: items.length,
  }));
}

// ---------------------------------------------------------------------------
// Sorting & Finding
// ---------------------------------------------------------------------------

/**
 * Sorts an array of dates chronologically (ascending).
 */
export function sortDates<T extends DateOrCalendarDate>(
  dates: T[],
  direction: "asc" | "desc" = "asc",
): T[] {
  const sorted = [...dates].sort(
    (a, b) => getAbsoluteDay(a) - getAbsoluteDay(b),
  );
  return direction === "desc" ? sorted.reverse() : sorted;
}

/**
 * Finds the minimum (earliest) date in an array.
 */
export function minDate<T extends DateOrCalendarDate>(dates: T[]): T {
  if (dates.length === 0)
    throw new RangeError("Cannot find min of empty array.");
  return dates.reduce((m, d) =>
    getAbsoluteDay(d) < getAbsoluteDay(m) ? d : m,
  );
}

/**
 * Finds the maximum (latest) date in an array.
 */
export function maxDate<T extends DateOrCalendarDate>(dates: T[]): T {
  if (dates.length === 0)
    throw new RangeError("Cannot find max of empty array.");
  return dates.reduce((m, d) =>
    getAbsoluteDay(d) > getAbsoluteDay(m) ? d : m,
  );
}

/**
 * Finds the date nearest to the reference date.
 */
export function nearestDate<T extends DateOrCalendarDate>(
  dates: T[],
  ref: T,
): T {
  if (dates.length === 0)
    throw new RangeError("Cannot find nearest in empty array.");
  const refAbs = getAbsoluteDay(ref);
  return dates.reduce((nearest, d) =>
    Math.abs(getAbsoluteDay(d) - refAbs) <
    Math.abs(getAbsoluteDay(nearest) - refAbs)
      ? d
      : nearest,
  );
}

/**
 * Removes duplicate dates from an array (keeps first occurrence).
 */
export function uniqueDates<T extends DateOrCalendarDate>(dates: T[]): T[] {
  const seen = new Set<number>();
  return dates.filter((d) => {
    const abs = getAbsoluteDay(d);
    if (seen.has(abs)) return false;
    seen.add(abs);
    return true;
  });
}
