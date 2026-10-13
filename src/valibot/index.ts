import * as v from "valibot";
import { chronera, Chronera, type ChroneraInput } from "../chronera.js";
import { isBefore, isAfter } from "../operations/convenience.js";
import type {
  BusinessDaysOptions,
  DateOrCalendarDate,
  HolidayTarget,
  Instant,
  LocalDate,
  ZonedDateTime,
} from "../public-types.js";

/**
 * Options for Chronera Valibot validation schema.
 */
export interface VChroneraOptions {
  /**
   * Minimum allowed date (inclusive).
   */
  readonly min?: DateOrCalendarDate | string | Date | Chronera;
  /**
   * Custom error message when value is before `min`.
   */
  readonly minMessage?: string;

  /**
   * Maximum allowed date (inclusive).
   */
  readonly max?: DateOrCalendarDate | string | Date | Chronera;
  /**
   * Custom error message when value is after `max`.
   */
  readonly maxMessage?: string;

  /**
   * Requires the date/time to be in the future relative to validation time.
   */
  readonly future?: boolean;
  /**
   * Custom error message when value is not in the future.
   */
  readonly futureMessage?: string;

  /**
   * Requires the date/time to be in the past relative to validation time.
   */
  readonly past?: boolean;
  /**
   * Custom error message when value is not in the past.
   */
  readonly pastMessage?: string;

  /**
   * Requires the date to be an official working business day.
   */
  readonly businessDay?:
    boolean | HolidayTarget | readonly HolidayTarget[] | BusinessDaysOptions;
  /**
   * Custom error message when value is not a business day.
   */
  readonly businessDayMessage?: string;

  /**
   * Requires the date to NOT be an official statutory public holiday.
   */
  readonly notPublicHoliday?: HolidayTarget | readonly HolidayTarget[];
  /**
   * Custom error message when value falls on a public holiday.
   */
  readonly notPublicHolidayMessage?: string;

  /**
   * Requires the date to fall on a weekend.
   */
  readonly weekend?: boolean;
  /**
   * Custom error message when value is not on a weekend.
   */
  readonly weekendMessage?: string;

  /**
   * Requires the date to fall on a weekday (Monday-Friday).
   */
  readonly weekday?: boolean;
  /**
   * Custom error message when value is not on a weekday.
   */
  readonly weekdayMessage?: string;

  /**
   * Custom error message when input cannot be parsed into a valid date/time.
   */
  readonly invalidMessage?: string;
}

/**
 * Valibot transform action that parses an unknown input into an immutable `Chronera` instance.
 */
export function toChronera(invalidMessage?: string) {
  return v.rawTransform(({ dataset, addIssue, NEVER }) => {
    if (dataset.value === null || dataset.value === undefined) {
      addIssue({ message: invalidMessage ?? "Expected date input" });
      return NEVER;
    }
    if (dataset.value instanceof Chronera) {
      return dataset.value;
    }
    try {
      return chronera(dataset.value as ChroneraInput);
    } catch (err) {
      addIssue({
        message:
          invalidMessage ??
          (err instanceof Error ? err.message : "Invalid date input"),
      });
      return NEVER;
    }
  });
}

/**
 * Valibot transform action that converts a Chronera instance into a primitive `LocalDate`.
 */
export function toLocalDate() {
  return v.transform((c: Chronera): LocalDate => c.toLocalDate());
}

/**
 * Valibot transform action that converts a Chronera instance into a primitive `Instant`.
 */
export function toInstant() {
  return v.transform((c: Chronera): Instant => c.toInstant());
}

/**
 * Valibot transform action that converts a Chronera instance into an immutable `ZonedDateTime`.
 */
export function toZonedDateTime(timeZone: string = "UTC") {
  return v.transform((c: Chronera): ZonedDateTime =>
    c.toZonedDateTime(timeZone),
  );
}

/**
 * Valibot validation action ensuring date/time is in the future.
 */
export function chroneraFuture(
  message: string = "Date and time must be in the future",
) {
  return v.check((c: Chronera) => {
    const now = chronera();
    return c.toInstant().epochMilliseconds > now.toInstant().epochMilliseconds;
  }, message);
}

/**
 * Valibot validation action ensuring date/time is in the past.
 */
export function chroneraPast(
  message: string = "Date and time must be in the past",
) {
  return v.check((c: Chronera) => {
    const now = chronera();
    return c.toInstant().epochMilliseconds < now.toInstant().epochMilliseconds;
  }, message);
}

/**
 * Valibot validation action ensuring date is on or after minimum date.
 */
export function chroneraMin(
  min: DateOrCalendarDate | string | Date | Chronera,
  message?: string,
) {
  const minC = min instanceof Chronera ? min : chronera(min as ChroneraInput);
  return v.check(
    (c: Chronera) => !isBefore(c.toLocalDate(), minC.toLocalDate()),
    message ?? `Date must be on or after ${minC.format("yyyy-MM-dd")}`,
  );
}

/**
 * Valibot validation action ensuring date is on or before maximum date.
 */
export function chroneraMax(
  max: DateOrCalendarDate | string | Date | Chronera,
  message?: string,
) {
  const maxC = max instanceof Chronera ? max : chronera(max as ChroneraInput);
  return v.check(
    (c: Chronera) => !isAfter(c.toLocalDate(), maxC.toLocalDate()),
    message ?? `Date must be on or before ${maxC.format("yyyy-MM-dd")}`,
  );
}

/**
 * Valibot validation action ensuring date is a working business day.
 */
export function chroneraBusinessDay(
  target?:
    boolean | HolidayTarget | readonly HolidayTarget[] | BusinessDaysOptions,
  message: string = "Date must be a working business day",
) {
  const resolvedTarget = typeof target === "boolean" ? undefined : target;
  return v.check(
    (c: Chronera) =>
      c.isBusinessDay(
        resolvedTarget as
          | HolidayTarget
          | readonly HolidayTarget[]
          | BusinessDaysOptions
          | undefined,
      ),
    message,
  );
}

/**
 * Valibot validation action ensuring date is not a statutory public holiday.
 */
export function chroneraNotPublicHoliday(
  target: HolidayTarget | readonly HolidayTarget[],
  message: string = "Date must not be a public holiday",
) {
  return v.check((c: Chronera) => !c.isPublicHoliday(target), message);
}

/**
 * Valibot validation action ensuring date falls on a weekend.
 */
export function chroneraWeekend(
  message: string = "Date must fall on a weekend",
) {
  return v.check((c: Chronera) => c.isWeekend(), message);
}

/**
 * Valibot validation action ensuring date falls on a weekday.
 */
export function chroneraWeekday(
  message: string = "Date must fall on a weekday",
) {
  return v.check((c: Chronera) => c.isWeekday(), message);
}

/**
 * Creates a Valibot schema that parses date/time inputs and transforms them into an immutable `Chronera` instance.
 *
 * @example
 * ```ts
 * import * as v from "valibot";
 * import { vChronera } from "@intech-software/chronera/valibot";
 *
 * const bookingSchema = v.object({
 *   appointmentDate: vChronera({
 *     future: true,
 *     businessDay: ["TH", "SG"],
 *     min: "2026-10-15",
 *   }),
 * });
 * ```
 */
export function vChronera(
  options: VChroneraOptions = {},
): v.GenericSchema<unknown, Chronera> {
  const actions: readonly unknown[] = [
    toChronera(options.invalidMessage),
    ...(options.future ? [chroneraFuture(options.futureMessage)] : []),
    ...(options.past ? [chroneraPast(options.pastMessage)] : []),
    ...(options.min !== undefined
      ? [chroneraMin(options.min, options.minMessage)]
      : []),
    ...(options.max !== undefined
      ? [chroneraMax(options.max, options.maxMessage)]
      : []),
    ...(options.businessDay
      ? [chroneraBusinessDay(options.businessDay, options.businessDayMessage)]
      : []),
    ...(options.notPublicHoliday
      ? [
          chroneraNotPublicHoliday(
            options.notPublicHoliday,
            options.notPublicHolidayMessage,
          ),
        ]
      : []),
    ...(options.weekend ? [chroneraWeekend(options.weekendMessage)] : []),
    ...(options.weekday ? [chroneraWeekday(options.weekdayMessage)] : []),
  ];

  return (
    v.pipe as unknown as (
      ...args: readonly unknown[]
    ) => v.GenericSchema<unknown, Chronera>
  )(v.unknown(), ...actions);
}

/**
 * Creates a Valibot schema that validates date inputs and transforms them into a primitive `LocalDate`.
 */
export function vLocalDate(
  options: VChroneraOptions = {},
): v.GenericSchema<unknown, LocalDate> {
  return (
    v.pipe as unknown as (
      ...args: readonly unknown[]
    ) => v.GenericSchema<unknown, LocalDate>
  )(vChronera(options), toLocalDate());
}

/**
 * Creates a Valibot schema that validates date/time inputs and transforms them into a primitive `Instant`.
 */
export function vInstant(
  options: VChroneraOptions = {},
): v.GenericSchema<unknown, Instant> {
  return (
    v.pipe as unknown as (
      ...args: readonly unknown[]
    ) => v.GenericSchema<unknown, Instant>
  )(vChronera(options), toInstant());
}

/**
 * Creates a Valibot schema that validates date/time inputs and transforms them into an immutable `ZonedDateTime`.
 */
export function vZonedDateTime(
  timeZone: string = "UTC",
  options: VChroneraOptions = {},
): v.GenericSchema<unknown, ZonedDateTime> {
  return (
    v.pipe as unknown as (
      ...args: readonly unknown[]
    ) => v.GenericSchema<unknown, ZonedDateTime>
  )(vChronera(options), toZonedDateTime(timeZone));
}
