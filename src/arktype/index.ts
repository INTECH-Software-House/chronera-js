import { type, type Traversal } from "arktype";
import { Chronera, chronera } from "../chronera.js";
import { isAfter, isBefore } from "../operations/convenience.js";
import {
  isBusinessDay,
  isWeekend,
  isWeekday,
} from "../operations/business-days.js";

import type {
  DateOrCalendarDate,
  Instant,
  LocalDate,
} from "../public-types.js";
import type { CountryCode } from "../holidays/types.js";

export interface ArkTypeChroneraOptions {
  readonly min?: DateOrCalendarDate | Chronera | string;
  readonly max?: DateOrCalendarDate | Chronera | string;
  readonly future?: boolean;
  readonly past?: boolean;
  readonly businessDay?: boolean | string;
  readonly weekday?: boolean;
  readonly weekend?: boolean;
}

function resolveToChronera(val: unknown): Chronera | null {
  if (val instanceof Chronera) return val;
  if (
    typeof val === "string" ||
    typeof val === "number" ||
    val instanceof Date ||
    (typeof val === "object" && val !== null && "kind" in val)
  ) {
    try {
      return chronera(val as string);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * ArkType Schema for validating and transforming inputs into an immutable Chronera instance.
 */
export function aChronera(options: ArkTypeChroneraOptions = {}) {
  return type("unknown").pipe((val: unknown, ctx: Traversal) => {
    const c = resolveToChronera(val);
    if (!c) {
      return ctx.error({
        code: "predicate",
        expected: "a valid Chronera date, ISO string, Date, or timestamp",
      });
    }

    if (options.min !== undefined) {
      const minC = chronera(options.min);
      if (isBefore(c.toLocalDate(), minC.toLocalDate())) {
        return ctx.error({
          code: "predicate",
          expected: `a date on or after ${minC.format("yyyy-MM-dd")}`,
        });
      }
    }

    if (options.max !== undefined) {
      const maxC = chronera(options.max);
      if (isAfter(c.toLocalDate(), maxC.toLocalDate())) {
        return ctx.error({
          code: "predicate",
          expected: `a date on or before ${maxC.format("yyyy-MM-dd")}`,
        });
      }
    }

    if (options.future) {
      const now = chronera();
      if (!isAfter(c.toLocalDate(), now.toLocalDate())) {
        return ctx.error({
          code: "predicate",
          expected: "a future date",
        });
      }
    }

    if (options.past) {
      const now = chronera();
      if (!isBefore(c.toLocalDate(), now.toLocalDate())) {
        return ctx.error({
          code: "predicate",
          expected: "a past date",
        });
      }
    }

    if (options.businessDay) {
      const cal =
        typeof options.businessDay === "string" ? options.businessDay : "TH";
      if (!isBusinessDay(c.toLocalDate(), { holidays: cal as CountryCode })) {
        return ctx.error({
          code: "predicate",
          expected: `a working business day in calendar ${cal}`,
        });
      }
    }

    if (options.weekend && !isWeekend(c.toLocalDate())) {
      return ctx.error({
        code: "predicate",
        expected: "a weekend date (Saturday or Sunday)",
      });
    }

    if (options.weekday && !isWeekday(c.toLocalDate())) {
      return ctx.error({
        code: "predicate",
        expected: "a weekday date (Monday through Friday)",
      });
    }

    return c;
  });
}

/**
 * ArkType Schema transforming valid inputs into domain LocalDate.
 */
export function aLocalDate(options: ArkTypeChroneraOptions = {}) {
  return aChronera(options).pipe((c: Chronera) => c.toLocalDate());
}

/**
 * ArkType Schema transforming valid inputs into domain Instant.
 */
export function aInstant(options: ArkTypeChroneraOptions = {}) {
  return aChronera(options).pipe((c: Chronera) => c.toInstant());
}

/**
 * ArkType Schema transforming valid inputs into domain ZonedDateTime.
 */
export function aZonedDateTime(options: ArkTypeChroneraOptions = {}) {
  return aChronera(options).pipe((c: Chronera) => c.toZonedDateTime());
}

// Standalone pipe transformation functions
export const toChronera = (val: unknown, ctx: Traversal): Chronera => {
  const c = resolveToChronera(val);
  if (!c) {
    return ctx.error({
      code: "predicate",
      expected: "a valid Chronera date",
    }) as unknown as Chronera;
  }
  return c;
};

export const toLocalDate = (val: unknown, ctx: Traversal): LocalDate => {
  const c = resolveToChronera(val);
  if (!c) {
    return ctx.error({
      code: "predicate",
      expected: "a valid Chronera date",
    }) as unknown as LocalDate;
  }
  return c.toLocalDate();
};

export const toInstant = (val: unknown, ctx: Traversal): Instant => {
  const c = resolveToChronera(val);
  if (!c) {
    return ctx.error({
      code: "predicate",
      expected: "a valid Chronera date",
    }) as unknown as Instant;
  }
  return c.toInstant();
};
