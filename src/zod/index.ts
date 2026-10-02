import { z } from "zod";
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
 * Options for Chronera Zod validation schema.
 */
export interface ZChroneraOptions {
  /**
   * Minimum allowed date (inclusive).
   */
  readonly min?: DateOrCalendarDate | string | Date;
  /**
   * Custom error message when value is before `min`.
   */
  readonly minMessage?: string;

  /**
   * Maximum allowed date (inclusive).
   */
  readonly max?: DateOrCalendarDate | string | Date;
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
   * Can be `true` (default calendar), a country code ("TH", "SG"), an array of countries, or full options.
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
   * Requires the date to fall on a weekday (Monday-Friday or regional custom weekdays).
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
 * Creates a Zod schema that validates date/time inputs (ISO string, timestamp, Date, etc.)
 * and transforms them into an immutable `Chronera` instance.
 *
 * @example
 * ```ts
 * import { z } from "zod";
 * import { zChronera } from "@intech-software/chronera/zod";
 *
 * const bookingSchema = z.object({
 *   appointmentDate: zChronera({
 *     future: true,
 *     businessDay: ["TH", "SG"],
 *     min: "2026-10-05",
 *   }),
 * });
 * ```
 */
export function zChronera(options: ZChroneraOptions = {}) {
  const base = z.custom<unknown>((val) => val !== null && val !== undefined, {
    message: options.invalidMessage ?? "Expected date input",
  });

  return base
    .transform((val, ctx): Chronera => {
      if (val instanceof Chronera) {
        return val;
      }
      try {
        return chronera(val as ChroneraInput);
      } catch (err) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            options.invalidMessage ??
            (err instanceof Error ? err.message : "Invalid date input"),
        });
        return z.NEVER;
      }
    })
    .superRefine((c, ctx) => {
      const now = chronera();

      // Future check
      if (options.future) {
        if (
          c.toInstant().epochMilliseconds <= now.toInstant().epochMilliseconds
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              options.futureMessage ?? "Date and time must be in the future",
          });
        }
      }

      // Past check
      if (options.past) {
        if (
          c.toInstant().epochMilliseconds >= now.toInstant().epochMilliseconds
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: options.pastMessage ?? "Date and time must be in the past",
          });
        }
      }

      // Min check
      if (options.min !== undefined) {
        const minC =
          options.min instanceof Chronera
            ? options.min
            : chronera(options.min as ChroneraInput);
        if (isBefore(c.toLocalDate(), minC.toLocalDate())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              options.minMessage ??
              `Date must be on or after ${minC.format("yyyy-MM-dd")}`,
          });
        }
      }

      // Max check
      if (options.max !== undefined) {
        const maxC =
          options.max instanceof Chronera
            ? options.max
            : chronera(options.max as ChroneraInput);
        if (isAfter(c.toLocalDate(), maxC.toLocalDate())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              options.maxMessage ??
              `Date must be on or before ${maxC.format("yyyy-MM-dd")}`,
          });
        }
      }

      // Business day check
      if (options.businessDay) {
        const target =
          typeof options.businessDay === "boolean"
            ? undefined
            : options.businessDay;
        if (
          !c.isBusinessDay(
            target as
              | HolidayTarget
              | readonly HolidayTarget[]
              | BusinessDaysOptions
              | undefined,
          )
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              options.businessDayMessage ??
              "Date must be a working business day",
          });
        }
      }

      // Not public holiday check
      if (options.notPublicHoliday) {
        if (c.isPublicHoliday(options.notPublicHoliday)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              options.notPublicHolidayMessage ??
              "Date must not be a public holiday",
          });
        }
      }

      // Weekend check
      if (options.weekend) {
        if (!c.isWeekend()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: options.weekendMessage ?? "Date must fall on a weekend",
          });
        }
      }

      // Weekday check
      if (options.weekday) {
        if (!c.isWeekday()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: options.weekdayMessage ?? "Date must fall on a weekday",
          });
        }
      }
    });
}

/**
 * Creates a Zod schema that validates date inputs and transforms them into a primitive `LocalDate`.
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   birthDate: zLocalDate({ past: true }),
 * });
 * ```
 */
export function zLocalDate(options: ZChroneraOptions = {}) {
  return zChronera(options).transform((c): LocalDate => c.toLocalDate());
}

/**
 * Creates a Zod schema that validates date/time inputs and transforms them into a primitive `Instant`.
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   createdAt: zInstant(),
 * });
 * ```
 */
export function zInstant(options: ZChroneraOptions = {}) {
  return zChronera(options).transform((c): Instant => c.toInstant());
}

/**
 * Creates a Zod schema that validates date/time inputs (including RFC 9557 IXDTF)
 * and transforms them into an immutable `ZonedDateTime`.
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   scheduledZoned: zZonedDateTime({ future: true }),
 * });
 * ```
 */
export function zZonedDateTime(
  timeZone: string = "UTC",
  options: ZChroneraOptions = {},
) {
  return zChronera(options).transform((c): ZonedDateTime => {
    return c.toZonedDateTime(timeZone);
  });
}
