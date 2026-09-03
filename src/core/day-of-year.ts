import {
  absoluteDayFromGregorianFields,
  gregorianFieldsFromAbsoluteDay,
} from "./absolute-day.js";

export interface DayOfYearFields {
  readonly year: number;
  readonly dayOfYear: number;
}

/**
 * Calculates the ordinal day of year (1..366) from an absolute day.
 */
export function getDayOfYearFromAbsoluteDay(
  absoluteDay: number,
): DayOfYearFields {
  const fields = gregorianFieldsFromAbsoluteDay(absoluteDay);
  const startOfYearAbsDay = absoluteDayFromGregorianFields(fields.year, 1, 1);
  const dayOfYear = absoluteDay - startOfYearAbsDay + 1;
  return {
    year: fields.year,
    dayOfYear,
  };
}

/**
 * Calculates the ordinal day of year (1..366) from Gregorian year, month, and day.
 */
export function getDayOfYearFromGregorianFields(
  year: number,
  month: number,
  day: number,
): number {
  const targetAbsDay = absoluteDayFromGregorianFields(year, month, day);
  const startOfYearAbsDay = absoluteDayFromGregorianFields(year, 1, 1);
  return targetAbsDay - startOfYearAbsDay + 1;
}

/**
 * Formats an ISO 8601 ordinal date string: YYYY-DDD (e.g. 2026-245).
 */
export function formatOrdinalDate(year: number, dayOfYear: number): string {
  const paddedYear = String(year).padStart(4, "0");
  const paddedDoy = String(dayOfYear).padStart(3, "0");
  return `${paddedYear}-${paddedDoy}`;
}
