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
 * Standard Schema Specification v1 Issue interface.
 */
export interface StandardIssue {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>;
}

/**
 * Standard Schema Specification v1 Result.
 */
export type StandardResult<Output> =
  | { readonly value: Output; readonly issues?: undefined }
  | { readonly issues: ReadonlyArray<StandardIssue> };

/**
 * Standard Schema Specification v1 Schema interface.
 * Compatible with TanStack Form, tRPC, React Hook Form, and all Standard Schema consumers.
 */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly "~standard": {
    readonly version: 1;
    readonly vendor: "chronera";
    readonly validate: (
      value: unknown,
    ) => StandardResult<Output> | Promise<StandardResult<Output>>;
    readonly types?: {
      readonly input: Input;
      readonly output: Output;
    };
  };
}

/**
 * Options for Chronera Standard Schema validation.
 */
export interface StandardChroneraOptions {
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

function validateChronera(
  val: unknown,
  options: StandardChroneraOptions,
): StandardResult<Chronera> {
  if (val === null || val === undefined) {
    return {
      issues: [{ message: options.invalidMessage ?? "Expected date input" }],
    };
  }

  let c: Chronera;
  if (val instanceof Chronera) {
    c = val;
  } else {
    try {
      c = chronera(val as ChroneraInput);
    } catch (err) {
      return {
        issues: [
          {
            message:
              options.invalidMessage ??
              (err instanceof Error ? err.message : "Invalid date input"),
          },
        ],
      };
    }
  }

  const issues: StandardIssue[] = [];
  const now = chronera();

  if (options.future) {
    if (c.toInstant().epochMilliseconds <= now.toInstant().epochMilliseconds) {
      issues.push({
        message: options.futureMessage ?? "Date and time must be in the future",
      });
    }
  }

  if (options.past) {
    if (c.toInstant().epochMilliseconds >= now.toInstant().epochMilliseconds) {
      issues.push({
        message: options.pastMessage ?? "Date and time must be in the past",
      });
    }
  }

  if (options.min !== undefined) {
    const minC =
      options.min instanceof Chronera
        ? options.min
        : chronera(options.min as ChroneraInput);
    if (isBefore(c.toLocalDate(), minC.toLocalDate())) {
      issues.push({
        message:
          options.minMessage ??
          `Date must be on or after ${minC.format("yyyy-MM-dd")}`,
      });
    }
  }

  if (options.max !== undefined) {
    const maxC =
      options.max instanceof Chronera
        ? options.max
        : chronera(options.max as ChroneraInput);
    if (isAfter(c.toLocalDate(), maxC.toLocalDate())) {
      issues.push({
        message:
          options.maxMessage ??
          `Date must be on or before ${maxC.format("yyyy-MM-dd")}`,
      });
    }
  }

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
      issues.push({
        message:
          options.businessDayMessage ?? "Date must be a working business day",
      });
    }
  }

  if (options.notPublicHoliday) {
    if (c.isPublicHoliday(options.notPublicHoliday)) {
      issues.push({
        message:
          options.notPublicHolidayMessage ??
          "Date must not be a public holiday",
      });
    }
  }

  if (options.weekend) {
    if (!c.isWeekend()) {
      issues.push({
        message: options.weekendMessage ?? "Date must fall on a weekend",
      });
    }
  }

  if (options.weekday) {
    if (!c.isWeekday()) {
      issues.push({
        message: options.weekdayMessage ?? "Date must fall on a weekday",
      });
    }
  }

  if (issues.length > 0) {
    return { issues };
  }

  return { value: c };
}

/**
 * Creates a zero-dependency schema compliant with the official Standard Schema specification (`~standard`).
 * Directly usable in TanStack Form, tRPC, React Hook Form, and all Standard Schema consumers.
 *
 * @example
 * ```ts
 * import { standardChronera } from "@intech-software/chronera/standard";
 *
 * const schema = standardChronera({
 *   future: true,
 *   businessDay: "TH",
 * });
 * ```
 */
export function standardChronera(
  options: StandardChroneraOptions = {},
): StandardSchemaV1<unknown, Chronera> {
  return {
    "~standard": {
      version: 1,
      vendor: "chronera",
      validate(value: unknown) {
        return validateChronera(value, options);
      },
    },
  };
}

/**
 * Creates a Standard Schema that validates date inputs and outputs a primitive `LocalDate`.
 */
export function standardLocalDate(
  options: StandardChroneraOptions = {},
): StandardSchemaV1<unknown, LocalDate> {
  return {
    "~standard": {
      version: 1,
      vendor: "chronera",
      validate(value: unknown) {
        const res = validateChronera(value, options);
        if (res.issues) return res;
        return { value: res.value.toLocalDate() };
      },
    },
  };
}

/**
 * Creates a Standard Schema that validates date/time inputs and outputs a primitive `Instant`.
 */
export function standardInstant(
  options: StandardChroneraOptions = {},
): StandardSchemaV1<unknown, Instant> {
  return {
    "~standard": {
      version: 1,
      vendor: "chronera",
      validate(value: unknown) {
        const res = validateChronera(value, options);
        if (res.issues) return res;
        return { value: res.value.toInstant() };
      },
    },
  };
}

/**
 * Creates a Standard Schema that validates date/time inputs and outputs an immutable `ZonedDateTime`.
 */
export function standardZonedDateTime(
  timeZone: string = "UTC",
  options: StandardChroneraOptions = {},
): StandardSchemaV1<unknown, ZonedDateTime> {
  return {
    "~standard": {
      version: 1,
      vendor: "chronera",
      validate(value: unknown) {
        const res = validateChronera(value, options);
        if (res.issues) return res;
        return { value: res.value.toZonedDateTime(timeZone) };
      },
    },
  };
}
