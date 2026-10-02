import { gregorianFromAbsoluteDay } from "../calendar/gregory/absolute-day.js";
import { localDate } from "../core/local-date.js";
import { getAbsoluteDay } from "./convenience.js";
import { resolveAnnualHolidays } from "../holidays/registry.js";
import { parseLocalDate } from "../parse/parse-local-date.js";

import type {
  HolidayOptions,
  HolidayTarget,
  PublicHoliday,
} from "../holidays/types.js";
import type { DateOrCalendarDate, LocalDate } from "../public-types.js";

function toGregorianLocalDate(date: DateOrCalendarDate | string): LocalDate {
  if (typeof date === "string") {
    return parseLocalDate(date);
  }
  if (date.kind === "local-date") {
    return date;
  }
  const abs = getAbsoluteDay(date);
  const fields = gregorianFromAbsoluteDay(abs);
  return localDate(fields.year, fields.month, fields.day);
}

/**
 * Returns true if the specified date is an official public holiday in the given country
 * or in ANY of the specified countries if an array is provided.
 *
 * Supports both Gregorian LocalDate, any cultural CalendarDate, and ISO date strings.
 *
 * @example
 * ```ts
 * // Single country check
 * isPublicHoliday(localDate(2026, 4, 13), "TH"); // true (Songkran)
 *
 * // Cross-border multi-region check
 * isPublicHoliday(date, ["TH", "SG"]); // true if holiday in Thailand OR Singapore
 * ```
 */
export function isPublicHoliday(
  date: DateOrCalendarDate | string,
  country: HolidayTarget | readonly HolidayTarget[],
  options?: HolidayOptions,
): boolean {
  if (Array.isArray(country)) {
    return country.some((c) => isPublicHoliday(date, c, options));
  }

  const gDate = toGregorianLocalDate(date);
  const annualHolidays = resolveAnnualHolidays(
    country as HolidayTarget,
    gDate.year,
    options,
  );

  return annualHolidays.some(
    (h) => h.date.month === gDate.month && h.date.day === gDate.day,
  );
}

/**
 * Returns all public holidays for a given year in the specified country,
 * or across all specified countries if an array is provided (chronologically sorted).
 *
 * @example
 * ```ts
 * const holidays = getPublicHolidays(2026, ["TH", "SG"]);
 * ```
 */
export function getPublicHolidays(
  year: number,
  country: HolidayTarget | readonly HolidayTarget[],
  options?: HolidayOptions,
): readonly PublicHoliday[] {
  if (Array.isArray(country)) {
    const list: PublicHoliday[] = [];
    for (const c of country) {
      list.push(...resolveAnnualHolidays(c as HolidayTarget, year, options));
    }
    // Sort chronologically by date
    list.sort((a, b) => {
      const aAbs = getAbsoluteDay(a.date);
      const bAbs = getAbsoluteDay(b.date);
      return aAbs - bAbs;
    });
    return Object.freeze(list);
  }

  return resolveAnnualHolidays(country as HolidayTarget, year, options);
}

/**
 * Returns the public holiday details if the specified date is a holiday, or undefined otherwise.
 * If multiple countries are specified, returns the first matching holiday.
 */
export function getHolidayDetails(
  date: DateOrCalendarDate | string,
  country: HolidayTarget | readonly HolidayTarget[],
  options?: HolidayOptions,
): PublicHoliday | undefined {
  if (Array.isArray(country)) {
    for (const c of country) {
      const found = getHolidayDetails(date, c, options);
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  const gDate = toGregorianLocalDate(date);
  const annualHolidays = resolveAnnualHolidays(
    country as HolidayTarget,
    gDate.year,
    options,
  );

  return annualHolidays.find(
    (h) => h.date.month === gDate.month && h.date.day === gDate.day,
  );
}

/**
 * Returns all public holiday details across all specified countries matching the given date.
 * Useful when a date coincides with holidays in multiple countries (e.g. New Year Jan 1 across TH, SG, US).
 *
 * @example
 * ```ts
 * const matches = getHolidayDetailsAll(localDate(2026, 1, 1), ["TH", "SG", "US"]);
 * console.log(matches.map(m => m.country)); // ["TH", "SG", "US"]
 * ```
 */
export function getHolidayDetailsAll(
  date: DateOrCalendarDate | string,
  countries: readonly HolidayTarget[],
  options?: HolidayOptions,
): readonly PublicHoliday[] {
  const gDate = toGregorianLocalDate(date);
  const results: PublicHoliday[] = [];

  for (const c of countries) {
    const annualHolidays = resolveAnnualHolidays(
      c as HolidayTarget,
      gDate.year,
      options,
    );
    for (const h of annualHolidays) {
      if (h.date.month === gDate.month && h.date.day === gDate.day) {
        results.push(h);
      }
    }
  }

  return Object.freeze(results);
}
