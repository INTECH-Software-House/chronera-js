import { chronera, Chronera } from "../chronera.js";

import type {
  DateOrCalendarDate,
  Instant,
  LocalDate,
} from "../public-types.js";

/**
 * Serializes any Chronera, LocalDate, CalendarDate, or JavaScript Date to an SQL standard DATE string (YYYY-MM-DD).
 */
export function toSqlDate(
  input: Chronera | DateOrCalendarDate | Date | string,
): string {
  if (typeof input === "string") {
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(input.trim());
    if (match && match[1]) {
      return match[1];
    }
    return chronera(input).format("yyyy-MM-dd");
  }
  if (input instanceof Date) {
    const y = input.getFullYear().toString().padStart(4, "0");
    const m = (input.getMonth() + 1).toString().padStart(2, "0");
    const d = input.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (input instanceof Chronera) {
    return input.format("yyyy-MM-dd");
  }
  if ("kind" in input && input.kind === "local-date") {
    const ld = input as LocalDate;
    const y = ld.year.toString().padStart(4, "0");
    const m = ld.month.toString().padStart(2, "0");
    const d = ld.day.toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return chronera(input as DateOrCalendarDate).format("yyyy-MM-dd");
}

/**
 * Deserializes an SQL DATE string (YYYY-MM-DD) into an immutable Chronera instance.
 */
export function fromSqlDate(sqlDate: string): Chronera {
  return chronera(sqlDate.trim());
}

/**
 * Serializes a timestamp or Chronera instance into an ISO 8601 / SQL standard TIMESTAMPTZ string.
 */
export function toSqlTimestamp(
  input: Chronera | Instant | Date | string | number,
): string {
  if (typeof input === "string") {
    return chronera(input).toISOString();
  }
  if (typeof input === "number") {
    return new Date(input).toISOString();
  }
  if (input instanceof Date) {
    return input.toISOString();
  }
  if (input instanceof Chronera) {
    return input.toISOString();
  }
  return new Date(input.epochMilliseconds).toISOString();
}

/**
 * Deserializes an SQL TIMESTAMPTZ or TIMESTAMP string into an immutable Chronera instance.
 */
export function fromSqlTimestamp(sqlTimestamp: string): Chronera {
  return chronera(sqlTimestamp.trim());
}

/**
 * Universal configuration for Drizzle ORM date columns.
 */
export const chroneraDateConfig = {
  dataType(): string {
    return "date";
  },
  toDriver(value: Chronera | DateOrCalendarDate | Date | string): string {
    return toSqlDate(value);
  },
  fromDriver(value: string): Chronera {
    return fromSqlDate(value);
  },
};

/**
 * Universal configuration for Drizzle ORM timestamp with timezone columns.
 */
export const chroneraTimestampConfig = {
  dataType(): string {
    return "timestamp with time zone";
  },
  toDriver(value: Chronera | Instant | Date | string | number): string {
    return toSqlTimestamp(value);
  },
  fromDriver(value: string): Chronera {
    return fromSqlTimestamp(value);
  },
};

/**
 * Universal configuration for Drizzle ORM instant (epoch milliseconds / ISO string) columns.
 */
export const chroneraInstantConfig = {
  dataType(): string {
    return "timestamp with time zone";
  },
  toDriver(value: Instant | Chronera | Date | string | number): string {
    return toSqlTimestamp(value);
  },
  fromDriver(value: string): Instant {
    return chronera(value).toInstant();
  },
};

/**
 * Factory that creates a custom Chronera Date column for ANY Drizzle dialect (Postgres, SQLite, MySQL).
 *
 * @example
 * ```ts
 * import { customType } from "drizzle-orm/pg-core";
 * import { createChroneraDateColumn } from "@intech-software/chronera/drizzle";
 *
 * export const chroneraDate = createChroneraDateColumn(customType);
 * export const users = pgTable("users", {
 *   birthDate: chroneraDate("birth_date"),
 * });
 * ```
 */
export function createChroneraDateColumn<
  TFn extends (...args: never[]) => unknown,
>(customTypeFn: TFn): ReturnType<TFn> {
  return (customTypeFn as unknown as (config: unknown) => ReturnType<TFn>)(
    chroneraDateConfig,
  );
}

/**
 * Factory that creates a custom Chronera Timestamp column for ANY Drizzle dialect.
 */
export function createChroneraTimestampColumn<
  TFn extends (...args: never[]) => unknown,
>(customTypeFn: TFn): ReturnType<TFn> {
  return (customTypeFn as unknown as (config: unknown) => ReturnType<TFn>)(
    chroneraTimestampConfig,
  );
}

/**
 * Factory that creates a custom Chronera Instant column for ANY Drizzle dialect.
 */
export function createChroneraInstantColumn<
  TFn extends (...args: never[]) => unknown,
>(customTypeFn: TFn): ReturnType<TFn> {
  return (customTypeFn as unknown as (config: unknown) => ReturnType<TFn>)(
    chroneraInstantConfig,
  );
}
