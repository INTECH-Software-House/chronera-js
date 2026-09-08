import { gregorianFromAbsoluteDay } from "../calendar/gregory/absolute-day.js";
import { localDate } from "../core/local-date.js";
import { getAbsoluteDay } from "./convenience.js";
import { resolveAnnualHolidays } from "../holidays/registry.js";

import type {
  CountryCode,
  HolidayCalendar,
  HolidayOptions,
  PublicHoliday,
} from "../holidays/types.js";
import type { DateOrCalendarDate, LocalDate } from "../public-types.js";

function toGregorianLocalDate(date: DateOrCalendarDate): LocalDate {
  if (date.kind === "local-date") {
    return date;
  }
  const abs = getAbsoluteDay(date);
  const fields = gregorianFromAbsoluteDay(abs);
  return localDate(fields.year, fields.month, fields.day);
}

/**
 * Returns true if the specified date is an official public holiday in the given country.
 * Supports both Gregorian LocalDate and any cultural CalendarDate (Thai Buddhist, Japanese Reiwa, Hijri, etc.).
 */
export function isPublicHoliday(
  date: DateOrCalendarDate,
  country: CountryCode | string | HolidayCalendar,
  options?: HolidayOptions,
): boolean {
  const gDate = toGregorianLocalDate(date);
  const annualHolidays = resolveAnnualHolidays(country, gDate.year, options);

  return annualHolidays.some(
    (h) => h.date.month === gDate.month && h.date.day === gDate.day,
  );
}

/**
 * Returns all public holidays for a given year in the specified country.
 */
export function getPublicHolidays(
  year: number,
  country: CountryCode | string | HolidayCalendar,
  options?: HolidayOptions,
): readonly PublicHoliday[] {
  return resolveAnnualHolidays(country, year, options);
}

/**
 * Returns the public holiday details if the specified date is a holiday, or undefined otherwise.
 */
export function getHolidayDetails(
  date: DateOrCalendarDate,
  country: CountryCode | string | HolidayCalendar,
  options?: HolidayOptions,
): PublicHoliday | undefined {
  const gDate = toGregorianLocalDate(date);
  const annualHolidays = resolveAnnualHolidays(country, gDate.year, options);

  return annualHolidays.find(
    (h) => h.date.month === gDate.month && h.date.day === gDate.day,
  );
}
