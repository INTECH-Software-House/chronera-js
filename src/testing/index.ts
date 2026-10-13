import { chronera, Chronera, type ChroneraInput } from "../chronera.js";
import {
  setSystemTimeEpoch,
  advanceSystemTimeEpoch,
  isSystemTimeMocked as checkMocked,
} from "../runtime/clock.js";
import { getPublicHolidays } from "../operations/holidays.js";
import { isBusinessDay } from "../operations/business-days.js";
import { addDays } from "../operations/convenience.js";
import { localDate } from "../core/local-date.js";
import type { CountryCode, HolidayTarget } from "../holidays/types.js";
import type { DateOrCalendarDate } from "../public-types.js";

/**
 * Freezes Chronera's internal clock at the specified timestamp or date.
 *
 * @example
 * ```ts
 * import { setSystemTime } from "@intech-software/chronera/testing";
 *
 * setSystemTime("2026-10-13T12:00:00Z");
 * expect(chronera().toISOString()).toBe("2026-10-13T12:00:00.000Z");
 * ```
 */
export function setSystemTime(date: Date | string | number | Chronera): void {
  const c = date instanceof Chronera ? date : chronera(date as ChroneraInput);
  setSystemTimeEpoch(c.toInstant().epochMilliseconds);
}

/**
 * Restores Chronera's internal clock to real system time.
 */
export function restoreSystemTime(): void {
  setSystemTimeEpoch(null);
}

/**
 * Returns current Chronera time, respecting any active mock time.
 */
export function getSystemTime(): Chronera {
  return chronera();
}

/**
 * Returns true if Chronera's clock is currently mocked.
 */
export function isSystemTimeMocked(): boolean {
  return checkMocked();
}

/**
 * Advances the active mock clock by the specified milliseconds.
 */
export function advanceSystemTimeBy(milliseconds: number): void {
  advanceSystemTimeEpoch(milliseconds);
}

/**
 * Executes a function within a scoped mock time window, automatically restoring
 * the real system clock upon completion (or failure).
 *
 * @example
 * ```ts
 * await withMockTime("2026-01-01", async () => {
 *   expect(chronera().format("yyyy-MM-dd")).toBe("2026-01-01");
 * });
 * ```
 */
export function withMockTime<T>(
  date: Date | string | number | Chronera,
  fn: () => T,
): T {
  setSystemTime(date);
  try {
    const result = fn();
    if (
      result !== null &&
      typeof result === "object" &&
      "then" in result &&
      typeof (result as { then: unknown }).then === "function"
    ) {
      return (result as unknown as Promise<unknown>).finally(() => {
        restoreSystemTime();
      }) as unknown as T;
    }
    restoreSystemTime();
    return result;
  } catch (err) {
    restoreSystemTime();
    throw err;
  }
}

/**
 * Options for generating mock business days.
 */
export interface MockBusinessDayOptions {
  readonly country?: CountryCode | HolidayTarget;
  readonly year?: number;
  readonly startMonth?: number;
}

/**
 * Generates a verified working business day for the specified jurisdiction and year.
 * Ideal for seeding databases or writing unit tests that require valid settlement days.
 *
 * @example
 * ```ts
 * const bDay = mockBusinessDay({ country: "TH", year: 2026 });
 * expect(bDay.isBusinessDay("TH")).toBe(true);
 * ```
 */
export function mockBusinessDay(
  options: MockBusinessDayOptions = {},
): Chronera {
  const year = options.year ?? 2026;
  const month = options.startMonth ?? 10;
  const target = options.country ?? "TH";

  let cur = localDate(year, month, 1);
  for (let i = 0; i < 365; i++) {
    if (isBusinessDay(cur, { holidays: target })) {
      return chronera(cur);
    }
    cur = addDays(cur, 1);
  }
  return chronera(cur);
}

/**
 * Options for generating mock public holidays.
 */
export interface MockHolidayOptions {
  readonly country?: CountryCode;
  readonly year?: number;
}

/**
 * Retrieves a real statutory holiday for testing holiday rules, payroll, or calendar views.
 *
 * @example
 * ```ts
 * const holiday = mockHoliday({ country: "TH", year: 2026 });
 * expect(holiday.date.isPublicHoliday("TH")).toBe(true);
 * ```
 */
export function mockHoliday(options: MockHolidayOptions = {}): {
  readonly date: Chronera;
  readonly name: string;
  readonly country: CountryCode;
} {
  const country = options.country ?? "TH";
  const year = options.year ?? 2026;
  const holidays = getPublicHolidays(year, country);

  if (holidays.length === 0) {
    throw new Error(`No holidays found for country ${country} in year ${year}`);
  }

  const first = holidays[0]!;
  return {
    date: chronera(first.date),
    name: first.name,
    country,
  };
}

/**
 * Generates a sequential range of Chronera dates for bulk testing.
 */
export function mockDateRange(
  options: {
    readonly start?: DateOrCalendarDate | string;
    readonly count?: number;
    readonly stepDays?: number;
  } = {},
): Chronera[] {
  const count = options.count ?? 7;
  const step = options.stepDays ?? 1;
  const start = options.start
    ? chronera(options.start)
    : chronera("2026-10-01");

  const results: Chronera[] = [];
  let current = start;
  for (let i = 0; i < count; i++) {
    results.push(current);
    current = current.addDays(step);
  }
  return results;
}
