import { BoundedLRU } from "../runtime/bounded-lru.js";
import { BUILT_IN_HOLIDAYS, thailandBankHolidays } from "./countries/index.js";
import { evaluateRule } from "./rules/index.js";
import { ChroneraError } from "../errors/errors.js";
import { getIsoDayOfWeek } from "../core/iso-week.js";
import { addDays, getAbsoluteDay } from "../operations/convenience.js";

import type { LocalDate } from "../public-types.js";
import type {
  CountryCode,
  HolidayCalendar,
  PublicHoliday,
  HolidayOptions,
} from "./types.js";

const holidayCache = new BoundedLRU<readonly PublicHoliday[]>(128);
const customCalendars = new Map<string, HolidayCalendar>();

const SPECIAL_CALENDARS: Record<string, HolidayCalendar> = {
  "TH-BOT": thailandBankHolidays,
  "TH-BANK": thailandBankHolidays,
};

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
  const calendar =
    customCalendars.get(code) ??
    SPECIAL_CALENDARS[code] ??
    BUILT_IN_HOLIDAYS[code];

  if (!calendar) {
    throw new ChroneraError(
      "CHRONERA_INVALID_LOCALE",
      `Holiday calendar for country code "${countryCodeOrCalendar}" is not supported. Supported codes: ${Object.keys(BUILT_IN_HOLIDAYS).join(", ")}.`,
    );
  }

  return calendar;
}

function toDateKey(d: LocalDate): number {
  return d.year * 10000 + d.month * 100 + d.day;
}

/**
 * Resolves substitution holiday collisions (e.g. Songkran Apr 14 Sat + Apr 15 Sun,
 * Asarnha Bucha Sunday followed by Khao Phansa Monday, UK Christmas/Boxing Day Sat/Sun)
 * so each weekend holiday gets a distinct non-holiday, non-weekend observed date.
 */
function resolveObservedCollisions(
  rawList: readonly PublicHoliday[],
  defaultWeekendDays: readonly number[] | undefined,
): PublicHoliday[] {
  const weekendSet = new Set(defaultWeekendDays ?? [6, 7]);
  const occupied = new Set<number>();
  const primary: PublicHoliday[] = [];
  const observed: PublicHoliday[] = [];

  for (const h of rawList) {
    if (h.isObserved) {
      observed.push(h);
    } else {
      primary.push(h);
      occupied.add(toDateKey(h.date));
    }
  }

  // Process observed holidays chronologically by their original holiday date
  observed.sort((a, b) => {
    const ka = a.originalDate ? toDateKey(a.originalDate) : toDateKey(a.date);
    const kb = b.originalDate ? toDateKey(b.originalDate) : toDateKey(b.date);
    return ka - kb || toDateKey(a.date) - toDateKey(b.date);
  });

  const resolvedObserved: PublicHoliday[] = [];
  for (const h of observed) {
    let candidate = h.date;
    const step =
      h.originalDate && getAbsoluteDay(h.date) < getAbsoluteDay(h.originalDate)
        ? -1
        : 1;

    while (
      occupied.has(toDateKey(candidate)) ||
      weekendSet.has(getIsoDayOfWeek(getAbsoluteDay(candidate)))
    ) {
      candidate = addDays(candidate, step);
    }

    occupied.add(toDateKey(candidate));
    resolvedObserved.push(
      toDateKey(candidate) === toDateKey(h.date)
        ? h
        : { ...h, date: candidate },
    );
  }

  return [...primary, ...resolvedObserved];
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
    const rawList: PublicHoliday[] = [];
    for (const rule of calendar.rules) {
      const evaluated = evaluateRule(
        rule,
        year,
        calendar.country,
        includeObserved,
      );
      for (const h of evaluated) {
        rawList.push(h);
      }
    }

    const list = includeObserved
      ? resolveObservedCollisions(rawList, calendar.defaultWeekendDays)
      : rawList;

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
