import type SuperJSON from "superjson";
import { Chronera, chronera } from "../chronera.js";
import { localDate } from "../core/local-date.js";
import { instantFromEpochMilliseconds } from "../core/instant.js";
import { zonedDateTime } from "../core/zoned-date-time.js";
import { calendarDate } from "../core/calendar-date.js";

import type {
  CalendarDate,
  CalendarId,
  EraId,
  Instant,
  LocalDate,
  MonthCode,
  ZonedDateTime,
} from "../public-types.js";

/**
 * Interface contract matching SuperJSON.registerCustom.
 */
export interface SuperJSONCustomTransformer<T, S = unknown> {
  isApplicable(v: unknown): v is T;
  serialize(v: T): S;
  deserialize(v: S): T;
}

export type SuperJSONInstance =
  | typeof SuperJSON
  | SuperJSON
  | {
      registerCustom: typeof SuperJSON.registerCustom;
    };

export interface SerializedChroneraData {
  readonly kind: string;
  readonly payload: unknown;
}

export interface SerializedLocalDateData {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export interface SerializedInstantData {
  readonly epochMilliseconds: number;
}

export interface SerializedZonedDateTimeData {
  readonly epochMilliseconds: number;
  readonly timeZone: string;
  readonly calendar?: string;
}

export interface SerializedCalendarDateData {
  readonly calendar: string;
  readonly era?: string | undefined;
  readonly eraYear?: number | undefined;
  readonly year: number;
  readonly monthCode: string;
  readonly month?: number | undefined;
  readonly day: number;
}

/**
 * SuperJSON Custom Transformer for Chronera fluent instance.
 */
export const chroneraSuperJSONTransformer: SuperJSONCustomTransformer<
  Chronera,
  SerializedChroneraData
> = {
  isApplicable(v: unknown): v is Chronera {
    return (
      v instanceof Chronera ||
      (typeof v === "object" &&
        v !== null &&
        "kind" in v &&
        typeof (v as { toLocalDate?: unknown }).toLocalDate === "function" &&
        typeof (v as { toInstant?: unknown }).toInstant === "function")
    );
  },
  serialize(c: Chronera): SerializedChroneraData {
    const val = c.value;
    if (val.kind === "local-date") {
      return {
        kind: "local-date",
        payload: { year: val.year, month: val.month, day: val.day },
      };
    }
    if (val.kind === "instant") {
      return {
        kind: "instant",
        payload: { epochMilliseconds: val.epochMilliseconds },
      };
    }
    if (val.kind === "zoned-date-time") {
      return {
        kind: "zoned-date-time",
        payload: {
          epochMilliseconds: val.instant.epochMilliseconds,
          timeZone: val.timeZone,
          calendar: val.calendar,
        },
      };
    }
    if (val.kind === "calendar-date") {
      return {
        kind: "calendar-date",
        payload: {
          calendar: val.calendar,
          era: val.era,
          eraYear: val.eraYear,
          year: val.year,
          monthCode: val.monthCode,
          month: val.month,
          day: val.day,
        },
      };
    }
    return {
      kind: "iso",
      payload: c.toISOString(),
    };
  },
  deserialize(data: SerializedChroneraData): Chronera {
    if (data.kind === "local-date") {
      const p = data.payload as SerializedLocalDateData;
      return chronera(localDate(p.year, p.month, p.day));
    }
    if (data.kind === "instant") {
      const p = data.payload as SerializedInstantData;
      return chronera(instantFromEpochMilliseconds(p.epochMilliseconds));
    }
    if (data.kind === "zoned-date-time") {
      const p = data.payload as SerializedZonedDateTimeData;
      return chronera(
        zonedDateTime(
          instantFromEpochMilliseconds(p.epochMilliseconds),
          p.timeZone,
          (p.calendar as CalendarId) ?? "gregory",
        ),
      );
    }
    if (data.kind === "calendar-date") {
      const p = data.payload as SerializedCalendarDateData;
      return chronera(
        calendarDate({
          calendar: p.calendar as CalendarId,
          ...(p.era !== undefined ? { era: p.era as EraId } : {}),
          ...(p.eraYear !== undefined ? { eraYear: p.eraYear } : {}),
          year: p.year,
          monthCode: p.monthCode as MonthCode,
          ...(p.month !== undefined ? { month: p.month } : {}),
          day: p.day,
        }),
      );
    }
    return chronera(data.payload as string);
  },
};

/**
 * SuperJSON Custom Transformer for domain LocalDate.
 */
export const localDateSuperJSONTransformer: SuperJSONCustomTransformer<
  LocalDate,
  SerializedLocalDateData
> = {
  isApplicable(v: unknown): v is LocalDate {
    return (
      typeof v === "object" &&
      v !== null &&
      (v as { kind?: unknown }).kind === "local-date" &&
      typeof (v as { year?: unknown }).year === "number" &&
      typeof (v as { month?: unknown }).month === "number" &&
      typeof (v as { day?: unknown }).day === "number"
    );
  },
  serialize(d: LocalDate): SerializedLocalDateData {
    return { year: d.year, month: d.month, day: d.day };
  },
  deserialize(d: SerializedLocalDateData): LocalDate {
    return localDate(d.year, d.month, d.day);
  },
};

/**
 * SuperJSON Custom Transformer for domain Instant.
 */
export const instantSuperJSONTransformer: SuperJSONCustomTransformer<
  Instant,
  SerializedInstantData
> = {
  isApplicable(v: unknown): v is Instant {
    return (
      typeof v === "object" &&
      v !== null &&
      (v as { kind?: unknown }).kind === "instant" &&
      typeof (v as { epochMilliseconds?: unknown }).epochMilliseconds ===
        "number"
    );
  },
  serialize(i: Instant): SerializedInstantData {
    return { epochMilliseconds: i.epochMilliseconds };
  },
  deserialize(i: SerializedInstantData): Instant {
    return instantFromEpochMilliseconds(i.epochMilliseconds);
  },
};

/**
 * SuperJSON Custom Transformer for domain ZonedDateTime.
 */
export const zonedDateTimeSuperJSONTransformer: SuperJSONCustomTransformer<
  ZonedDateTime,
  SerializedZonedDateTimeData
> = {
  isApplicable(v: unknown): v is ZonedDateTime {
    return (
      typeof v === "object" &&
      v !== null &&
      (v as { kind?: unknown }).kind === "zoned-date-time" &&
      typeof (v as { instant?: { epochMilliseconds?: unknown } }).instant
        ?.epochMilliseconds === "number" &&
      typeof (v as { timeZone?: unknown }).timeZone === "string"
    );
  },
  serialize(z: ZonedDateTime): SerializedZonedDateTimeData {
    return {
      epochMilliseconds: z.instant.epochMilliseconds,
      timeZone: z.timeZone,
      calendar: z.calendar,
    };
  },
  deserialize(z: SerializedZonedDateTimeData): ZonedDateTime {
    return zonedDateTime(
      instantFromEpochMilliseconds(z.epochMilliseconds),
      z.timeZone,
      (z.calendar as CalendarId) ?? "gregory",
    );
  },
};

/**
 * SuperJSON Custom Transformer for domain CalendarDate.
 */
export const calendarDateSuperJSONTransformer: SuperJSONCustomTransformer<
  CalendarDate,
  SerializedCalendarDateData
> = {
  isApplicable(v: unknown): v is CalendarDate {
    return (
      typeof v === "object" &&
      v !== null &&
      (v as { kind?: unknown }).kind === "calendar-date" &&
      typeof (v as { year?: unknown }).year === "number" &&
      typeof (v as { day?: unknown }).day === "number" &&
      typeof (v as { calendar?: unknown }).calendar === "string"
    );
  },
  serialize(c: CalendarDate): SerializedCalendarDateData {
    return {
      calendar: c.calendar,
      era: c.era,
      eraYear: c.eraYear,
      year: c.year,
      monthCode: c.monthCode,
      month: c.month,
      day: c.day,
    };
  },
  deserialize(c: SerializedCalendarDateData): CalendarDate {
    return calendarDate({
      calendar: c.calendar as CalendarId,
      ...(c.era !== undefined ? { era: c.era as EraId } : {}),
      ...(c.eraYear !== undefined ? { eraYear: c.eraYear } : {}),
      year: c.year,
      monthCode: c.monthCode as MonthCode,
      ...(c.month !== undefined ? { month: c.month } : {}),
      day: c.day,
    });
  },
};

type RegisterCustomFn = (transformer: unknown, name: string) => void;

/**
 * Registers all Chronera custom transformers with SuperJSON in a single call.
 *
 * @example
 * ```ts
 * import SuperJSON from "superjson";
 * import { registerChroneraSuperJSON } from "@intech-software/chronera/superjson";
 *
 * registerChroneraSuperJSON(SuperJSON);
 *
 * const serialized = SuperJSON.stringify({ date: chronera("2026-09-27") });
 * const deserialized = SuperJSON.parse(serialized);
 * // deserialized.date is a full Chronera instance with all methods intact!
 * ```
 */
export function registerChroneraSuperJSON(superjson: SuperJSONInstance): void {
  const register = superjson.registerCustom as unknown as RegisterCustomFn;
  register(chroneraSuperJSONTransformer, "Chronera");
  register(localDateSuperJSONTransformer, "ChroneraLocalDate");
  register(instantSuperJSONTransformer, "ChroneraInstant");
  register(zonedDateTimeSuperJSONTransformer, "ChroneraZonedDateTime");
  register(calendarDateSuperJSONTransformer, "ChroneraCalendarDate");
}
