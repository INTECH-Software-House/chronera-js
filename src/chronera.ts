import { localDate } from "./core/local-date.js";
import {
  instantFromDate,
  instantFromEpochMilliseconds,
} from "./core/instant.js";
import { zonedDateTime } from "./core/zoned-date-time.js";
import { formatGregorianMonthCode } from "./core/gregorian-math.js";
import { parseLocalDate } from "./parse/parse-local-date.js";
import { parseInstant } from "./parse/parse-instant.js";
import { formatDate } from "./format/format-date.js";
import { formatDateTime } from "./format/format-date-time.js";
import { formatInTimeZone } from "./operations/timezone.js";
import { convertCalendarDate } from "./operations/convert-calendar-date.js";
import {
  addDays,
  addMonths,
  addYears,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  diffInDays,
  isBefore,
  isAfter,
  isEqual,
  isSameDay,
  isBetween,
} from "./operations/convenience.js";
import {
  startOfDay,
  endOfDay,
  addHours,
  addMinutes,
  addSeconds,
} from "./operations/time-convenience.js";
import {
  isWeekend,
  isWeekday,
  isBusinessDay,
  addBusinessDays,
  diffInBusinessDays,
} from "./operations/business-days.js";
import { isPublicHoliday } from "./operations/holidays.js";
import { daysInMonth, isLeapYear } from "./operations/validate.js";
import { addDuration, subtractDuration } from "./operations/duration-ops.js";
import {
  createZonedDateTime,
  getZonedFields,
  withTimeZone,
  addZonedDuration,
  subtractZonedDuration,
  formatZonedDateTime,
} from "./operations/zoned-operations.js";
import {
  isIXDTF,
  parseIXDTF,
  formatIXDTF,
  type FormatIXDTFOptions,
} from "./operations/ixdtf.js";
import { type BusinessDaysOptions } from "./operations/business-days.js";
import { ChroneraError } from "./errors/errors.js";

import type { CountryCode, HolidayTarget } from "./holidays/types.js";
import type {
  CalendarDate,
  CalendarId,
  Duration,
  FormatDateOptions,
  FormatDateTimeOptions,
  Instant,
  IntervalInclusivity,
  LocalDate,
  LocalDateTime,
  LocalTime,
  TimeZoneId,
  ZonedDateTime,
} from "./public-types.js";

export type ChroneraInput =
  | LocalDate
  | Instant
  | ZonedDateTime
  | CalendarDate
  | LocalDateTime
  | LocalTime
  | Date
  | string
  | number
  | Chronera
  | null
  | undefined;

function resolveBusinessDaysOptions(
  input?:
    | CountryCode
    | string
    | HolidayTarget
    | readonly HolidayTarget[]
    | BusinessDaysOptions,
): BusinessDaysOptions | undefined {
  if (!input) return undefined;
  if (typeof input === "string") {
    return { holidays: input as CountryCode };
  }
  if (Array.isArray(input)) {
    return { holidays: input as readonly HolidayTarget[] };
  }
  if (typeof input === "object") {
    if ("rules" in input) {
      return { holidays: input as HolidayTarget };
    }
    return input as BusinessDaysOptions;
  }
  return undefined;
}

/**
 * Chronera Fluent Wrapper providing immutable, chainable ergonomics
 * over Chronera's functional domain primitives.
 */
export class Chronera {
  readonly #value:
    | LocalDate
    | Instant
    | ZonedDateTime
    | CalendarDate
    | LocalDateTime
    | LocalTime;

  constructor(
    value:
      | LocalDate
      | Instant
      | ZonedDateTime
      | CalendarDate
      | LocalDateTime
      | LocalTime,
  ) {
    this.#value = value;
  }

  /**
   * Returns the underlying immutable domain value.
   */
  get value():
    | LocalDate
    | Instant
    | ZonedDateTime
    | CalendarDate
    | LocalDateTime
    | LocalTime {
    return this.#value;
  }

  /**
   * The kind of the underlying domain object.
   */
  get kind(): string {
    return "kind" in this.#value ? this.#value.kind : "unknown";
  }

  // --- Conversions ---

  toLocalDate(): LocalDate {
    if (this.#value.kind === "local-date") return this.#value;
    if (this.#value.kind === "calendar-date") {
      const g = convertCalendarDate(this.#value, "gregory").value;
      return localDate(g.year, g.month ?? 1, g.day);
    }
    if (this.#value.kind === "zoned-date-time") {
      const f = getZonedFields(this.#value);
      return localDate(f.year, f.month, f.day);
    }
    if (this.#value.kind === "local-date-time") {
      return this.#value.date;
    }
    if (this.#value.kind === "instant") {
      const d = new Date(this.#value.epochMilliseconds);
      return localDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    }
    throw new ChroneraError(
      "CHRONERA_UNSUPPORTED_OPERATION",
      `Cannot convert ${this.#value.kind} to LocalDate.`,
    );
  }

  toInstant(): Instant {
    if (this.#value.kind === "instant") return this.#value;
    if (this.#value.kind === "zoned-date-time") return this.#value.instant;
    if (this.#value.kind === "local-date") {
      const ms = Date.UTC(
        this.#value.year,
        this.#value.month - 1,
        this.#value.day,
      );
      return instantFromEpochMilliseconds(ms);
    }
    if (this.#value.kind === "local-date-time") {
      const ms = Date.UTC(
        this.#value.date.year,
        this.#value.date.month - 1,
        this.#value.date.day,
        this.#value.time.hour,
        this.#value.time.minute,
        this.#value.time.second,
        this.#value.time.millisecond,
      );
      return instantFromEpochMilliseconds(ms);
    }
    throw new ChroneraError(
      "CHRONERA_UNSUPPORTED_OPERATION",
      `Cannot convert ${this.#value.kind} to Instant.`,
    );
  }

  toDate(): Date {
    return new Date(this.toInstant().epochMilliseconds);
  }

  toZoned(timeZone: TimeZoneId, calendar: CalendarId = "gregory"): Chronera {
    if (this.#value.kind === "zoned-date-time") {
      return new Chronera(withTimeZone(this.#value, timeZone));
    }
    if (this.#value.kind === "local-date") {
      const zdt = createZonedDateTime(
        {
          year: this.#value.year,
          month: this.#value.month,
          day: this.#value.day,
        },
        timeZone,
        { calendar },
      );
      return new Chronera(zdt);
    }
    const inst = this.toInstant();
    return new Chronera(zonedDateTime(inst, timeZone, calendar));
  }

  toZonedDateTime(
    timeZone: TimeZoneId = "UTC",
    calendar: CalendarId = "gregory",
  ): ZonedDateTime {
    if (this.#value.kind === "zoned-date-time") {
      return this.#value;
    }
    if (this.#value.kind === "local-date") {
      return createZonedDateTime(
        {
          year: this.#value.year,
          month: this.#value.month,
          day: this.#value.day,
        },
        timeZone,
        { calendar },
      );
    }
    const inst = this.toInstant();
    return zonedDateTime(inst, timeZone, calendar);
  }

  toIXDTF(options?: FormatIXDTFOptions): string {
    const zdt = this.toZonedDateTime(
      this.#value.kind === "zoned-date-time" ? this.#value.timeZone : "UTC",
      this.#value.kind === "zoned-date-time" ? this.#value.calendar : "gregory",
    );
    return formatIXDTF(zdt, options);
  }

  toCalendar(calendarId: CalendarId): Chronera {
    if (this.#value.kind === "calendar-date") {
      return new Chronera(convertCalendarDate(this.#value, calendarId).value);
    }
    const ld = this.toLocalDate();
    const calDate: CalendarDate = {
      kind: "calendar-date",
      calendar: "gregory",
      year: ld.year,
      monthCode: `M${String(ld.month).padStart(2, "0")}`,
      month: ld.month,
      day: ld.day,
    };
    return new Chronera(convertCalendarDate(calDate, calendarId).value);
  }

  // --- Arithmetic (Calendar & Date) ---

  addDays(amount: number): Chronera {
    if (this.#value.kind === "zoned-date-time") {
      return new Chronera(addZonedDuration(this.#value, { days: amount }));
    }
    const ld = this.toLocalDate();
    return new Chronera(addDays(ld, amount));
  }

  subtractDays(amount: number): Chronera {
    return this.addDays(-amount);
  }

  addMonths(amount: number): Chronera {
    if (this.#value.kind === "zoned-date-time") {
      return new Chronera(addZonedDuration(this.#value, { months: amount }));
    }
    const ld = this.toLocalDate();
    return new Chronera(addMonths(ld, amount));
  }

  subtractMonths(amount: number): Chronera {
    return this.addMonths(-amount);
  }

  addYears(amount: number): Chronera {
    if (this.#value.kind === "zoned-date-time") {
      return new Chronera(addZonedDuration(this.#value, { years: amount }));
    }
    const ld = this.toLocalDate();
    return new Chronera(addYears(ld, amount));
  }

  subtractYears(amount: number): Chronera {
    return this.addYears(-amount);
  }

  addHours(amount: number): Chronera {
    if (this.#value.kind === "zoned-date-time") {
      return new Chronera(addZonedDuration(this.#value, { hours: amount }));
    }
    const inst = this.toInstant();
    return new Chronera(addHours(inst, amount));
  }

  subtractHours(amount: number): Chronera {
    return this.addHours(-amount);
  }

  addMinutes(amount: number): Chronera {
    if (this.#value.kind === "zoned-date-time") {
      return new Chronera(addZonedDuration(this.#value, { minutes: amount }));
    }
    const inst = this.toInstant();
    return new Chronera(addMinutes(inst, amount));
  }

  subtractMinutes(amount: number): Chronera {
    return this.addMinutes(-amount);
  }

  addSeconds(amount: number): Chronera {
    if (this.#value.kind === "zoned-date-time") {
      return new Chronera(addZonedDuration(this.#value, { seconds: amount }));
    }
    const inst = this.toInstant();
    return new Chronera(addSeconds(inst, amount));
  }

  subtractSeconds(amount: number): Chronera {
    return this.addSeconds(-amount);
  }

  addDuration(duration: Duration): Chronera {
    if (this.#value.kind === "zoned-date-time") {
      return new Chronera(addZonedDuration(this.#value, duration));
    }
    const ld = this.toLocalDate();
    return new Chronera(addDuration(ld, duration));
  }

  subtractDuration(duration: Duration): Chronera {
    if (this.#value.kind === "zoned-date-time") {
      return new Chronera(subtractZonedDuration(this.#value, duration));
    }
    const ld = this.toLocalDate();
    return new Chronera(subtractDuration(ld, duration));
  }

  startOfDay(): Chronera {
    const ld = this.toLocalDate();
    const inst = startOfDay(ld);
    return new Chronera(inst);
  }

  endOfDay(): Chronera {
    const ld = this.toLocalDate();
    const inst = endOfDay(ld);
    return new Chronera(inst);
  }

  startOfMonth(): Chronera {
    const ld = this.toLocalDate();
    return new Chronera(startOfMonth(ld));
  }

  endOfMonth(): Chronera {
    const ld = this.toLocalDate();
    return new Chronera(endOfMonth(ld));
  }

  startOfYear(): Chronera {
    const ld = this.toLocalDate();
    return new Chronera(startOfYear(ld));
  }

  endOfYear(): Chronera {
    const ld = this.toLocalDate();
    return new Chronera(endOfYear(ld));
  }

  // --- Business Days & Holidays ---

  isWeekend(): boolean {
    return isWeekend(this.toLocalDate());
  }

  isWeekday(): boolean {
    return isWeekday(this.toLocalDate());
  }

  isBusinessDay(
    optionsOrCountry?:
      | CountryCode
      | string
      | HolidayTarget
      | readonly HolidayTarget[]
      | BusinessDaysOptions,
  ): boolean {
    const opts = resolveBusinessDaysOptions(optionsOrCountry);
    return isBusinessDay(this.toLocalDate(), opts);
  }

  isPublicHoliday(
    country: HolidayTarget | readonly HolidayTarget[] = "TH",
  ): boolean {
    return isPublicHoliday(this.toLocalDate(), country);
  }

  addBusinessDays(
    amount: number,
    optionsOrCountry?:
      | CountryCode
      | string
      | HolidayTarget
      | readonly HolidayTarget[]
      | BusinessDaysOptions,
  ): Chronera {
    const ld = this.toLocalDate();
    const opts = resolveBusinessDaysOptions(optionsOrCountry);
    const res = addBusinessDays(ld, amount, opts);
    return new Chronera(res);
  }

  subtractBusinessDays(
    amount: number,
    optionsOrCountry?:
      | CountryCode
      | string
      | HolidayTarget
      | readonly HolidayTarget[]
      | BusinessDaysOptions,
  ): Chronera {
    return this.addBusinessDays(-amount, optionsOrCountry);
  }

  diffInBusinessDays(
    other: ChroneraInput,
    optionsOrCountry?:
      | CountryCode
      | string
      | HolidayTarget
      | readonly HolidayTarget[]
      | BusinessDaysOptions,
  ): number {
    const otherLd = chronera(other).toLocalDate();
    const opts = resolveBusinessDaysOptions(optionsOrCountry);
    return diffInBusinessDays(this.toLocalDate(), otherLd, opts);
  }

  // --- Predicates & Comparison ---

  isBefore(other: ChroneraInput): boolean {
    const o = chronera(other);
    if (this.#value.kind === "instant" || o.#value.kind === "instant") {
      return (
        this.toInstant().epochMilliseconds < o.toInstant().epochMilliseconds
      );
    }
    return isBefore(this.toLocalDate(), o.toLocalDate());
  }

  isAfter(other: ChroneraInput): boolean {
    const o = chronera(other);
    if (this.#value.kind === "instant" || o.#value.kind === "instant") {
      return (
        this.toInstant().epochMilliseconds > o.toInstant().epochMilliseconds
      );
    }
    return isAfter(this.toLocalDate(), o.toLocalDate());
  }

  isEqual(other: ChroneraInput): boolean {
    const o = chronera(other);
    if (this.#value.kind === "instant" || o.#value.kind === "instant") {
      return (
        this.toInstant().epochMilliseconds === o.toInstant().epochMilliseconds
      );
    }
    return isEqual(this.toLocalDate(), o.toLocalDate());
  }

  isSameDay(other: ChroneraInput): boolean {
    const o = chronera(other);
    return isSameDay(this.toLocalDate(), o.toLocalDate());
  }

  isBetween(
    start: ChroneraInput,
    end: ChroneraInput,
    inclusivity: IntervalInclusivity = "[]",
  ): boolean {
    const s = chronera(start).toLocalDate();
    const e = chronera(end).toLocalDate();
    return isBetween(this.toLocalDate(), s, e, inclusivity);
  }

  diffInDays(other: ChroneraInput): number {
    const o = chronera(other).toLocalDate();
    return diffInDays(this.toLocalDate(), o);
  }

  daysInMonth(): number {
    const ld = this.toLocalDate();
    return daysInMonth(ld.year, formatGregorianMonthCode(ld.month), "gregory");
  }

  isLeapYear(): boolean {
    return isLeapYear(this.toLocalDate().year, "gregory");
  }

  // --- Formatting ---

  format(optionsOrPattern?: string | Readonly<FormatDateOptions>): string {
    if (this.#value.kind === "zoned-date-time") {
      return formatZonedDateTime(this.#value, optionsOrPattern);
    }
    if (typeof optionsOrPattern === "string") {
      const inst = this.toInstant();
      return formatInTimeZone(inst, "UTC", optionsOrPattern);
    }
    if (this.#value.kind === "instant") {
      return formatDateTime(
        this.#value,
        optionsOrPattern as FormatDateTimeOptions,
      );
    }
    return formatDate(this.toLocalDate(), optionsOrPattern);
  }

  toISOString(): string {
    return this.toDate().toISOString();
  }

  toString(): string {
    if (this.#value.kind === "local-date") {
      const { year, month, day } = this.#value;
      return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    return this.toISOString();
  }
}

/**
 * Entry point factory for creating a fluent, chainable Chronera instance.
 *
 * @example
 * ```ts
 * const formatted = chronera("2026-09-27")
 *   .addDays(5)
 *   .toCalendar("buddhist")
 *   .format({ locale: "th-TH", style: "long" });
 * ```
 */
export function chronera(input?: ChroneraInput): Chronera {
  if (input === null || input === undefined) {
    return new Chronera(instantFromDate(new Date()));
  }

  if (input instanceof Chronera) {
    return input;
  }

  if (input instanceof Date) {
    return new Chronera(instantFromDate(input));
  }

  if (typeof input === "number") {
    return new Chronera(instantFromEpochMilliseconds(input));
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    // Check if it's an RFC 9557 (IXDTF) string with timezone/calendar annotations
    if (isIXDTF(trimmed)) {
      return new Chronera(parseIXDTF(trimmed));
    }
    // Check if it's an ISO timestamp with time or timezone
    if (
      trimmed.includes("T") ||
      trimmed.endsWith("Z") ||
      /[+-]\d{2}:?\d{2}$/.test(trimmed)
    ) {
      return new Chronera(parseInstant(trimmed));
    }
    // Otherwise parse as LocalDate
    return new Chronera(parseLocalDate(trimmed));
  }

  if (typeof input === "object" && "kind" in input) {
    return new Chronera(input);
  }

  throw new ChroneraError(
    "CHRONERA_INVALID_DATE",
    `Unsupported input type for chronera(): ${typeof input}`,
  );
}
