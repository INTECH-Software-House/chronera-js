import { getIsoDayOfWeek } from "../core/iso-week.js";
import { localDate } from "../core/local-date.js";
import { gregorianFromAbsoluteDay } from "../calendar/gregory/absolute-day.js";
import { ChroneraError } from "../errors/errors.js";
import { addDays, getAbsoluteDay } from "./convenience.js";
import { isPublicHoliday } from "./holidays.js";
import { getHolidayCalendar } from "../holidays/registry.js";
import { parseLocalDate } from "../parse/parse-local-date.js";

import type {
  CorporateCalendarConfig,
  CountryCode,
  HolidayCalendar,
  HolidayTarget,
} from "../holidays/types.js";
import type { DateOrCalendarDate, LocalDate } from "../public-types.js";

/**
 * Options for business days arithmetic and queries.
 */
export interface BusinessDaysOptions {
  /**
   * Country code (e.g. "TH"), array of country codes (e.g. ["TH", "SG"]),
   * custom HolidayCalendar, holiday date list, or holiday predicate.
   */
  readonly holidays?:
    | CountryCode
    | string
    | HolidayCalendar
    | readonly (CountryCode | string | HolidayCalendar)[]
    | readonly (DateOrCalendarDate | string)[]
    | ((date: LocalDate) => boolean)
    | undefined;
  /**
   * Custom weekend days (defaults to [6, 7], or [4, 5] if country is Iran, etc.).
   */
  readonly weekendDays?: readonly number[] | undefined;
  /**
   * Additional company-specific or ad-hoc off-days (e.g. company retreat, annual shutdown).
   */
  readonly customHolidays?:
    readonly (DateOrCalendarDate | string)[] | undefined;
  /**
   * Dates that are normally holidays or weekends but designated as working days
   * (e.g. compensation working Saturdays). Overrides weekends and public holidays.
   */
  readonly workingDayOverrides?:
    readonly (DateOrCalendarDate | string)[] | undefined;
}

function toAbsoluteDaySafe(d: DateOrCalendarDate | string): number {
  if (typeof d === "string") {
    return getAbsoluteDay(parseLocalDate(d));
  }
  return getAbsoluteDay(d);
}

/**
 * Creates a corporate calendar configuration helper for business days calculations.
 *
 * @example
 * ```ts
 * const corpCal = createCorporateCalendar({
 *   baseCountry: ["TH", "SG"],
 *   customHolidays: [localDate(2026, 12, 28)], // Company shutdown
 *   workingDayOverrides: [localDate(2026, 10, 24)], // Working Saturday
 * });
 *
 * const isWorkDay = isBusinessDay(date, corpCal);
 * ```
 */
export function createCorporateCalendar(
  config: CorporateCalendarConfig,
): BusinessDaysOptions {
  const options: {
    holidays?: BusinessDaysOptions["holidays"];
    weekendDays?: readonly number[];
    customHolidays?: readonly (DateOrCalendarDate | string)[];
    workingDayOverrides?: readonly (DateOrCalendarDate | string)[];
  } = {};

  const holidays = config.publicHolidays ?? config.baseCountry;
  if (holidays !== undefined) {
    options.holidays = holidays;
  }
  if (config.weekendDays !== undefined) {
    options.weekendDays = config.weekendDays;
  }
  if (config.customHolidays !== undefined) {
    options.customHolidays = config.customHolidays;
  }
  if (config.workingDayOverrides !== undefined) {
    options.workingDayOverrides = config.workingDayOverrides;
  }

  return Object.freeze(options);
}

/**
 * Checks whether a given absolute day is a weekend according to options or country defaults.
 */
function isWeekendForOptions(
  abs: number,
  options?: BusinessDaysOptions,
): boolean {
  const dow = getIsoDayOfWeek(abs);
  if (options?.weekendDays && options.weekendDays.length > 0) {
    return options.weekendDays.includes(dow);
  }

  const holidays = options?.holidays;
  if (
    typeof holidays === "string" ||
    (typeof holidays === "object" && holidays !== null && "country" in holidays)
  ) {
    try {
      const cal = getHolidayCalendar(holidays as HolidayTarget);
      if (cal.defaultWeekendDays) {
        return cal.defaultWeekendDays.includes(dow);
      }
    } catch {
      // Fallback to standard Saturday & Sunday
    }
  }

  return dow === 6 || dow === 7;
}

/**
 * Returns true if the specified absolute day is a non-working day (weekend or holiday).
 */
function isNonWorkingDay(abs: number, options?: BusinessDaysOptions): boolean {
  // 1. Explicit working day overrides always take absolute precedence!
  if (options?.workingDayOverrides && options.workingDayOverrides.length > 0) {
    if (options.workingDayOverrides.some((w) => toAbsoluteDaySafe(w) === abs)) {
      return false;
    }
  }

  // 2. Custom holidays / corporate off-days
  if (options?.customHolidays && options.customHolidays.length > 0) {
    if (options.customHolidays.some((h) => toAbsoluteDaySafe(h) === abs)) {
      return true;
    }
  }

  // 3. Weekend check
  if (isWeekendForOptions(abs, options)) {
    return true;
  }

  // 4. Public holidays
  const holidays = options?.holidays;
  if (!holidays) {
    return false;
  }

  const gFields = gregorianFromAbsoluteDay(abs);
  const gDate = localDate(gFields.year, gFields.month, gFields.day);

  if (typeof holidays === "function") {
    return holidays(gDate);
  }

  if (
    typeof holidays === "string" ||
    (typeof holidays === "object" && "rules" in holidays)
  ) {
    return isPublicHoliday(gDate, holidays as HolidayTarget);
  }

  if (Array.isArray(holidays)) {
    if (holidays.length === 0) return false;
    const first = holidays[0];
    if (
      (typeof first === "string" && !first.includes("-")) ||
      (typeof first === "object" && first !== null && "rules" in first)
    ) {
      // Array of country codes or HolidayCalendars, e.g. ["TH", "SG"]
      return isPublicHoliday(gDate, holidays as readonly HolidayTarget[]);
    }
    // Array of DateOrCalendarDate | string
    return (holidays as readonly (DateOrCalendarDate | string)[]).some(
      (hDate) => toAbsoluteDaySafe(hDate) === abs,
    );
  }

  return false;
}

/**
 * Returns true if the specified date falls on a weekend.
 * Supports custom weekend definitions per country (e.g. Thursday & Friday for Iran).
 */
export function isWeekend(
  date: DateOrCalendarDate | string,
  options?: Pick<BusinessDaysOptions, "weekendDays" | "holidays">,
): boolean {
  const abs = toAbsoluteDaySafe(date);
  return isWeekendForOptions(abs, options);
}

/**
 * Returns true if the specified date falls on a weekday.
 */
export function isWeekday(
  date: DateOrCalendarDate | string,
  options?: Pick<BusinessDaysOptions, "weekendDays" | "holidays">,
): boolean {
  return !isWeekend(date, options);
}

/**
 * Returns true if the specified date is a business day (neither weekend nor public holiday).
 */
export function isBusinessDay(
  date: DateOrCalendarDate | string,
  options?: BusinessDaysOptions,
): boolean {
  const abs = toAbsoluteDaySafe(date);
  return !isNonWorkingDay(abs, options);
}

/**
 * Adds business days to a LocalDate or CalendarDate, skipping weekends and optionally public holidays.
 * Supports positive, negative, and zero day additions.
 * Uses O(1) mathematical week advancement when no holidays are provided, or iterative evaluation with holiday constraints.
 */
export function addBusinessDays<T extends DateOrCalendarDate>(
  date: T,
  amount: number,
  options?: BusinessDaysOptions,
): T {
  if (!Number.isFinite(amount)) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
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

  // Fast-path: no holidays or custom weekends
  const hasHolidays = Boolean(options?.holidays);
  const hasCustomWeekends = Boolean(options?.weekendDays);

  if (!hasHolidays && !hasCustomWeekends) {
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
  } else {
    // Exact evaluation with holiday and custom weekend constraints
    while (remaining !== 0) {
      currentAbs += step;
      if (!isNonWorkingDay(currentAbs, options)) {
        remaining -= step;
      }
    }
  }

  const deltaDays = currentAbs - startAbs;
  return addDays(date, deltaDays);
}

/**
 * Subtracts business days from a LocalDate or CalendarDate, skipping weekends and optional holidays.
 */
export function subtractBusinessDays<T extends DateOrCalendarDate>(
  date: T,
  amount: number,
  options?: BusinessDaysOptions,
): T {
  return addBusinessDays(date, -amount, options);
}

/**
 * Returns the signed count of business days between two dates (left - right).
 * Positive if left is after right, negative if left is before right, 0 if identical.
 */
export function diffInBusinessDays(
  left: DateOrCalendarDate,
  right: DateOrCalendarDate,
  options?: BusinessDaysOptions,
): number {
  const absLeft = getAbsoluteDay(left);
  const absRight = getAbsoluteDay(right);

  if (absLeft === absRight) {
    return 0;
  }

  if (absLeft < absRight) {
    return -diffInBusinessDays(right, left, options);
  }

  let count = 0;
  let current = absRight;

  const hasHolidays = Boolean(options?.holidays);
  const hasCustomWeekends = Boolean(options?.weekendDays);

  if (!hasHolidays && !hasCustomWeekends) {
    // Fast-path O(1) acceleration: any consecutive 7 calendar days contains exactly 5 business days
    const fullWeeks = Math.floor((absLeft - current) / 7);
    if (fullWeeks > 0) {
      count += fullWeeks * 5;
      current += fullWeeks * 7;
    }

    while (current < absLeft) {
      current++;
      const dow = getIsoDayOfWeek(current);
      if (dow !== 6 && dow !== 7) {
        count++;
      }
    }
  } else {
    while (current < absLeft) {
      current++;
      if (!isNonWorkingDay(current, options)) {
        count++;
      }
    }
  }

  return count;
}
