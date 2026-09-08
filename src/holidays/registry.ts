import { BoundedLRU } from "../runtime/bounded-lru.js";
import { BUILT_IN_HOLIDAYS } from "./countries/index.js";
import { evaluateRule } from "./rules/index.js";
import { ChroneraError } from "../errors/errors.js";

import type {
  CountryCode,
  HolidayCalendar,
  PublicHoliday,
  HolidayOptions,
} from "./types.js";

const holidayCache = new BoundedLRU<readonly PublicHoliday[]>(128);
const customCalendars = new Map<string, HolidayCalendar>();

/**
 * Registers a custom or corporate holiday calendar.
 */
export function registerHolidayCalendar(calendar: HolidayCalendar): void {
  customCalendars.set(calendar.country.toUpperCase(), calendar);
}

/**
 * Retrieves a holiday calendar by country code.
 */
export function getHolidayCalendar(
  countryCodeOrCalendar: CountryCode | string | HolidayCalendar,
): HolidayCalendar {
  if (
    typeof countryCodeOrCalendar === "object" &&
    countryCodeOrCalendar !== null
  ) {
    return countryCodeOrCalendar;
  }

  const code = countryCodeOrCalendar.toUpperCase() as CountryCode;
  const calendar = customCalendars.get(code) ?? BUILT_IN_HOLIDAYS[code];

  if (!calendar) {
    throw new ChroneraError(
      "CHRONERA_INVALID_LOCALE",
      `Holiday calendar for country code "${countryCodeOrCalendar}" is not supported. Supported codes: ${Object.keys(BUILT_IN_HOLIDAYS).join(", ")}.`,
    );
  }

  return calendar;
}

/**
 * Resolves all public holidays for a given country and Gregorian year.
 * Uses bounded LRU caching for microsecond deterministic lookups.
 */
export function resolveAnnualHolidays(
  country: CountryCode | string | HolidayCalendar,
  year: number,
  options?: HolidayOptions,
): readonly PublicHoliday[] {
  const calendar = getHolidayCalendar(country);
  const includeObserved = options?.includeObserved ?? true;
  const cacheKey = `${calendar.country}:${year}:${includeObserved}`;

  let holidays = holidayCache.get(cacheKey);

  if (!holidays) {
    const list: PublicHoliday[] = [];
    for (const rule of calendar.rules) {
      const evaluated = evaluateRule(
        rule,
        year,
        calendar.country,
        includeObserved,
      );
      for (const h of evaluated) {
        list.push(h);
      }
    }

    // Sort chronologically by date
    list.sort((a, b) => {
      if (a.date.year !== b.date.year) return a.date.year - b.date.year;
      if (a.date.month !== b.date.month) return a.date.month - b.date.month;
      return a.date.day - b.date.day;
    });

    holidays = Object.freeze(list);
    holidayCache.set(cacheKey, holidays);
  }

  if (options?.additionalHolidays && options.additionalHolidays.length > 0) {
    const combined = [...holidays];
    for (const [idx, addDate] of options.additionalHolidays.entries()) {
      combined.push({
        id: `custom-additional-${idx + 1}`,
        date: addDate,
        name: "วันหยุดพิเศษ / Additional Holiday",
        nameEn: "Additional Holiday",
        country: calendar.country,
        isObserved: false,
      });
    }
    combined.sort((a, b) => {
      if (a.date.year !== b.date.year) return a.date.year - b.date.year;
      if (a.date.month !== b.date.month) return a.date.month - b.date.month;
      return a.date.day - b.date.day;
    });
    return Object.freeze(combined);
  }

  return holidays;
}
