import {
  absoluteDayFromGregorianFields,
  gregorianFieldsFromAbsoluteDay,
} from "./absolute-day.js";

export interface IsoWeekFields {
  readonly weekYear: number;
  readonly weekNumber: number;
  readonly dayOfWeek: number; // 1 (Monday) to 7 (Sunday)
}

/**
 * Computes ISO 8601 day of week from absolute day.
 * Monday = 1, Tuesday = 2, ..., Sunday = 7.
 * 1970-01-01 (absolute day 0) was Thursday (4).
 */
export function getIsoDayOfWeek(absoluteDay: number): number {
  return ((((absoluteDay + 3) % 7) + 7) % 7) + 1;
}

/**
 * Computes ISO 8601 week fields (weekYear, weekNumber, dayOfWeek) from Gregorian fields.
 */
export function getIsoWeekFromAbsoluteDay(absoluteDay: number): IsoWeekFields {
  const dayOfWeek = getIsoDayOfWeek(absoluteDay);
  // Find Thursday of current week
  const thursdayAbsoluteDay = absoluteDay + (4 - dayOfWeek);
  const thursdayFields = gregorianFieldsFromAbsoluteDay(thursdayAbsoluteDay);
  const weekYear = thursdayFields.year;

  // Find first Thursday of weekYear (which is the Thursday of the week containing Jan 4)
  const jan4AbsoluteDay = absoluteDayFromGregorianFields(weekYear, 1, 4);
  const jan4DayOfWeek = getIsoDayOfWeek(jan4AbsoluteDay);
  const firstThursdayAbsoluteDay = jan4AbsoluteDay + (4 - jan4DayOfWeek);

  const weekNumber =
    1 + Math.floor((thursdayAbsoluteDay - firstThursdayAbsoluteDay) / 7);

  return {
    weekYear,
    weekNumber,
    dayOfWeek,
  };
}

/**
 * Formats ISO 8601 week string: `YYYY-Www-D` or `YYYY-Www`.
 */
export function formatIsoWeekString(
  fields: IsoWeekFields,
  includeDayOfWeek = true,
): string {
  const yearStr = String(fields.weekYear).padStart(4, "0");
  const weekStr = String(fields.weekNumber).padStart(2, "0");
  if (!includeDayOfWeek) {
    return `${yearStr}-W${weekStr}`;
  }
  return `${yearStr}-W${weekStr}-${fields.dayOfWeek}`;
}
