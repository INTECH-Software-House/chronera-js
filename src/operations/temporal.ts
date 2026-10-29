import { localDate } from "../core/local-date.js";
import { localTime } from "../core/local-time.js";
import { localDateTime } from "../core/local-date-time.js";
import {
  instantFromDate,
  instantFromEpochMilliseconds,
} from "../core/instant.js";
import { zonedDateTime } from "../core/zoned-date-time.js";
import {
  formatGregorianMonthCode,
  parseGregorianMonthCode,
} from "../core/gregorian-math.js";
import { ChroneraError } from "../errors/errors.js";
import { parseLocalDate } from "../parse/parse-local-date.js";
import { parseInstant } from "../parse/parse-instant.js";
import { durationToISO, parseDuration } from "./duration-ops.js";
import { formatIXDTF, isIXDTF, parseIXDTF } from "./ixdtf.js";
import { getZonedFields } from "./zoned-operations.js";
import { convertCalendarDate } from "./convert-calendar-date.js";

import type { Chronera } from "../chronera.js";
import type {
  CalendarDate,
  CalendarId,
  Duration,
  Instant,
  LocalDate,
  LocalDateTime,
  LocalTime,
  TimeZoneId,
  ZonedDateTime,
} from "../public-types.js";

// ---------------------------------------------------------------------------
// Structural TC39 Temporal Interfaces (Zero-Dependency)
// ---------------------------------------------------------------------------

export interface TemporalPlainDateLike {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly monthCode: string;
  readonly calendarId: string;
  readonly isoYear?: number;
  readonly isoMonth?: number;
  readonly isoDay?: number;
  toString(): string;
  toJSON(): string;
}

export interface TemporalPlainTimeLike {
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;
  readonly microsecond: number;
  readonly nanosecond: number;
  toString(): string;
  toJSON(): string;
}

export interface TemporalPlainDateTimeLike {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly monthCode: string;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;
  readonly microsecond: number;
  readonly nanosecond: number;
  readonly calendarId: string;
  readonly isoYear?: number;
  readonly isoMonth?: number;
  readonly isoDay?: number;
  toString(): string;
  toJSON(): string;
}

export interface TemporalInstantLike {
  readonly epochMilliseconds: number;
  readonly epochNanoseconds: bigint;
  toString(): string;
  toJSON(): string;
}

export interface TemporalZonedDateTimeLike {
  readonly epochMilliseconds: number;
  readonly epochNanoseconds: bigint;
  readonly timeZoneId: string;
  readonly calendarId: string;
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly monthCode: string;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;
  readonly microsecond: number;
  readonly nanosecond: number;
  readonly offset: string;
  readonly offsetNanoseconds: number;
  toString(): string;
  toJSON(): string;
}

export interface TemporalDurationLike {
  readonly years: number;
  readonly months: number;
  readonly weeks: number;
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly milliseconds: number;
  readonly microseconds: number;
  readonly nanoseconds: number;
  readonly sign: -1 | 0 | 1;
  readonly blank: boolean;
  toString(): string;
  toJSON(): string;
}

export type AnyTemporalLike =
  | TemporalPlainDateLike
  | TemporalPlainTimeLike
  | TemporalPlainDateTimeLike
  | TemporalInstantLike
  | TemporalZonedDateTimeLike
  | TemporalDurationLike;

export interface TemporalNamespaceLike {
  readonly PlainDate?: {
    from(item: unknown): TemporalPlainDateLike;
  };
  readonly PlainTime?: {
    from(item: unknown): TemporalPlainTimeLike;
  };
  readonly PlainDateTime?: {
    from(item: unknown): TemporalPlainDateTimeLike;
  };
  readonly Instant?: {
    fromEpochMilliseconds(epochMilliseconds: number): TemporalInstantLike;
    from(item: unknown): TemporalInstantLike;
  };
  readonly ZonedDateTime?: {
    from(item: unknown): TemporalZonedDateTimeLike;
  };
  readonly Duration?: {
    from(item: unknown): TemporalDurationLike;
  };
}

export interface ToTemporalOptions {
  /**
   * Optional TC39 `Temporal` namespace (e.g. `globalThis.Temporal` or `@js-temporal/polyfill`).
   * If omitted, auto-detects `globalThis.Temporal` when `useNative` is true.
   */
  readonly temporal?: TemporalNamespaceLike;
  /**
   * Whether to instantiate native `Temporal.*` objects when a runtime `Temporal` namespace is available.
   * Defaults to `true`.
   */
  readonly useNative?: boolean;
}

export type TemporalDateInput =
  | LocalDate
  | CalendarDate
  | LocalDateTime
  | ZonedDateTime
  | Instant
  | Chronera
  | Date
  | string
  | number;

export type TemporalTimeInput =
  | LocalTime
  | LocalDateTime
  | ZonedDateTime
  | Instant
  | Chronera
  | Date
  | string
  | number;

// ---------------------------------------------------------------------------
// Runtime Detection & Helpers
// ---------------------------------------------------------------------------

function getRuntimeTemporal(
  options?: ToTemporalOptions,
): TemporalNamespaceLike | undefined {
  if (options?.useNative === false) {
    return undefined;
  }
  if (options?.temporal) {
    return options.temporal;
  }
  const g = globalThis as { Temporal?: TemporalNamespaceLike };
  return typeof g.Temporal === "object" && g.Temporal !== null
    ? g.Temporal
    : undefined;
}

/**
 * Returns `true` if a TC39 `Temporal` implementation is available on `globalThis.Temporal`
 * (or in the provided namespace).
 */
export function isTemporalSupported(temporal?: TemporalNamespaceLike): boolean {
  const ns =
    temporal ?? (globalThis as { Temporal?: TemporalNamespaceLike }).Temporal;
  return Boolean(
    ns &&
    typeof ns === "object" &&
    typeof ns.PlainDate?.from === "function" &&
    typeof ns.Instant?.fromEpochMilliseconds === "function" &&
    typeof ns.ZonedDateTime?.from === "function",
  );
}

/**
 * Type guard checking if an unknown value is a TC39 `Temporal` object or structural `Temporal*Like`.
 */
export function isTemporalObject(input: unknown): input is AnyTemporalLike {
  if (typeof input !== "object" || input === null || "kind" in input) {
    return false;
  }
  const tag = (input as { [Symbol.toStringTag]?: unknown })[Symbol.toStringTag];
  if (typeof tag === "string" && tag.startsWith("Temporal.")) {
    return true;
  }
  // Structural check for ZonedDateTime, Instant, PlainDateTime, PlainDate, PlainTime, Duration
  const rec = input as Record<string, unknown>;
  if (
    typeof rec["epochMilliseconds"] === "number" &&
    typeof rec["timeZoneId"] === "string"
  ) {
    return true;
  }
  if (
    typeof rec["epochNanoseconds"] === "bigint" &&
    typeof rec["epochMilliseconds"] === "number"
  ) {
    return true;
  }
  if (
    typeof rec["year"] === "number" &&
    typeof rec["month"] === "number" &&
    typeof rec["day"] === "number" &&
    typeof rec["calendarId"] === "string"
  ) {
    return true;
  }
  if (
    typeof rec["hour"] === "number" &&
    typeof rec["minute"] === "number" &&
    typeof rec["second"] === "number" &&
    typeof rec["microsecond"] === "number" &&
    typeof rec["nanosecond"] === "number"
  ) {
    return true;
  }
  if (typeof rec["sign"] === "number" && typeof rec["blank"] === "boolean") {
    return true;
  }
  return false;
}

function throwTemporalValueOf(): never {
  throw new TypeError(
    "Cannot convert a Temporal object to a primitive value. Use toString() or explicit comparison instead.",
  );
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function pad4(n: number): string {
  return String(n).padStart(4, "0");
}

function formatTimeIso(
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
): string {
  const base = `${pad2(hour)}:${pad2(minute)}:${pad2(second)}`;
  if (millisecond === 0) {
    return base;
  }
  const frac = String(millisecond).padStart(3, "0").replace(/0+$/, "");
  return `${base}.${frac}`;
}

type DomainPrimitive =
  | LocalDate
  | CalendarDate
  | LocalDateTime
  | LocalTime
  | Instant
  | ZonedDateTime;

function isDomainPrimitive(val: object): val is DomainPrimitive {
  return "kind" in val && !("toLocalDate" in val);
}

// ---------------------------------------------------------------------------
// Chronera -> Temporal (toTemporal*)
// ---------------------------------------------------------------------------

/**
 * Converts a Chronera `LocalDate`, `CalendarDate`, `Chronera` instance, `Date`, or ISO string
 * into a TC39 `Temporal.PlainDate` (or structural `TemporalPlainDateLike`).
 */
export function toTemporalPlainDate(
  input: TemporalDateInput,
  options?: ToTemporalOptions,
): TemporalPlainDateLike {
  let ld: LocalDate;
  let calendarId: CalendarId = "iso8601";

  if (typeof input === "object" && input !== null) {
    if (isDomainPrimitive(input)) {
      if (input.kind === "local-date") {
        ld = input;
      } else if (input.kind === "calendar-date") {
        calendarId = input.calendar;
        const greg = convertCalendarDate(input, "gregory").value;
        const m = greg.month ?? parseGregorianMonthCode(greg.monthCode) ?? 1;
        ld = localDate(greg.year, m, greg.day);
      } else if (input.kind === "local-date-time") {
        ld = input.date;
      } else if (input.kind === "zoned-date-time") {
        const f = getZonedFields(input);
        ld = localDate(f.year, f.month, f.day);
        calendarId = input.calendar === "gregory" ? "iso8601" : input.calendar;
      } else if (input.kind === "instant") {
        const d = new Date(input.epochMilliseconds);
        ld = localDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
      } else {
        throw new ChroneraError(
          "CHRONERA_INVALID_DATE",
          "Unsupported domain input for toTemporalPlainDate.",
        );
      }
    } else if (
      "toLocalDate" in input &&
      typeof (input as { toLocalDate?: unknown }).toLocalDate === "function"
    ) {
      ld = (input as { toLocalDate(): LocalDate }).toLocalDate();
    } else if (input instanceof Date) {
      const inst = instantFromDate(input);
      const d = new Date(inst.epochMilliseconds);
      ld = localDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    } else {
      throw new ChroneraError(
        "CHRONERA_INVALID_DATE",
        "Unsupported object input for toTemporalPlainDate.",
      );
    }
  } else if (typeof input === "number") {
    const inst = instantFromEpochMilliseconds(input);
    const d = new Date(inst.epochMilliseconds);
    ld = localDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  } else if (typeof input === "string") {
    const trimmed = input.trim();
    if (isIXDTF(trimmed)) {
      const zdt = parseIXDTF(trimmed);
      const f = getZonedFields(zdt);
      ld = localDate(f.year, f.month, f.day);
      calendarId = zdt.calendar === "gregory" ? "iso8601" : zdt.calendar;
    } else if (
      trimmed.includes("T") ||
      trimmed.endsWith("Z") ||
      /[+-]\d{2}:?\d{2}$/.test(trimmed)
    ) {
      const inst = parseInstant(trimmed);
      const d = new Date(inst.epochMilliseconds);
      ld = localDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    } else {
      ld = parseLocalDate(trimmed);
    }
  } else {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      "Invalid input for toTemporalPlainDate.",
    );
  }

  const isoStr = `${pad4(ld.year)}-${pad2(ld.month)}-${pad2(ld.day)}${
    calendarId !== "iso8601" && calendarId !== "gregory"
      ? `[u-ca=${calendarId}]`
      : ""
  }`;

  const runtimeTemporal = getRuntimeTemporal(options);
  if (runtimeTemporal?.PlainDate?.from) {
    return runtimeTemporal.PlainDate.from(isoStr);
  }

  const monthCode = formatGregorianMonthCode(ld.month);
  return Object.freeze({
    [Symbol.toStringTag]: "Temporal.PlainDate",
    year: ld.year,
    month: ld.month,
    day: ld.day,
    monthCode,
    calendarId,
    isoYear: ld.year,
    isoMonth: ld.month,
    isoDay: ld.day,
    toString(): string {
      return isoStr;
    },
    toJSON(): string {
      return isoStr;
    },
    valueOf: throwTemporalValueOf,
  });
}

/**
 * Converts a Chronera `LocalTime`, `LocalDateTime`, `ZonedDateTime`, `Instant`, `Date`, or `"HH:mm:ss"` string
 * into a TC39 `Temporal.PlainTime` (or structural `TemporalPlainTimeLike`).
 */
export function toTemporalPlainTime(
  input: TemporalTimeInput,
  options?: ToTemporalOptions,
): TemporalPlainTimeLike {
  let lt: LocalTime;

  if (typeof input === "object" && input !== null) {
    if (isDomainPrimitive(input)) {
      if (input.kind === "local-time") {
        lt = input;
      } else if (input.kind === "local-date-time") {
        lt = input.time;
      } else if (input.kind === "zoned-date-time") {
        const f = getZonedFields(input);
        lt = localTime(f.hour, f.minute, f.second, f.millisecond);
      } else if (input.kind === "instant") {
        const d = new Date(input.epochMilliseconds);
        lt = localTime(
          d.getUTCHours(),
          d.getUTCMinutes(),
          d.getUTCSeconds(),
          d.getUTCMilliseconds(),
        );
      } else {
        throw new ChroneraError(
          "CHRONERA_INVALID_TIME",
          `Cannot extract PlainTime from ${(input as { kind?: string }).kind}.`,
        );
      }
    } else if (
      "toInstant" in input &&
      typeof (input as { toInstant?: unknown }).toInstant === "function"
    ) {
      const inst = (input as { toInstant(): Instant }).toInstant();
      const d = new Date(inst.epochMilliseconds);
      lt = localTime(
        d.getUTCHours(),
        d.getUTCMinutes(),
        d.getUTCSeconds(),
        d.getUTCMilliseconds(),
      );
    } else if (input instanceof Date) {
      const inst = instantFromDate(input);
      const d = new Date(inst.epochMilliseconds);
      lt = localTime(
        d.getUTCHours(),
        d.getUTCMinutes(),
        d.getUTCSeconds(),
        d.getUTCMilliseconds(),
      );
    } else {
      throw new ChroneraError(
        "CHRONERA_INVALID_TIME",
        "Unsupported object input for toTemporalPlainTime.",
      );
    }
  } else if (typeof input === "number") {
    const inst = instantFromEpochMilliseconds(input);
    const d = new Date(inst.epochMilliseconds);
    lt = localTime(
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds(),
      d.getUTCMilliseconds(),
    );
  } else if (typeof input === "string") {
    const trimmed = input.trim().replace(/^T/i, "");
    const match = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/.exec(
      trimmed,
    );
    if (match) {
      const h = Number.parseInt(match[1]!, 10);
      const m = Number.parseInt(match[2]!, 10);
      const s = match[3] ? Number.parseInt(match[3], 10) : 0;
      const ms = match[4]
        ? Number.parseInt((match[4] + "000").slice(0, 3), 10)
        : 0;
      lt = localTime(h, m, s, ms);
    } else if (isIXDTF(trimmed)) {
      const f = getZonedFields(parseIXDTF(trimmed));
      lt = localTime(f.hour, f.minute, f.second, f.millisecond);
    } else {
      const inst = parseInstant(trimmed);
      const d = new Date(inst.epochMilliseconds);
      lt = localTime(
        d.getUTCHours(),
        d.getUTCMinutes(),
        d.getUTCSeconds(),
        d.getUTCMilliseconds(),
      );
    }
  } else {
    throw new ChroneraError(
      "CHRONERA_INVALID_TIME",
      "Invalid input for toTemporalPlainTime.",
    );
  }

  const isoStr = formatTimeIso(lt.hour, lt.minute, lt.second, lt.millisecond);
  const runtimeTemporal = getRuntimeTemporal(options);
  if (runtimeTemporal?.PlainTime?.from) {
    return runtimeTemporal.PlainTime.from(isoStr);
  }

  return Object.freeze({
    [Symbol.toStringTag]: "Temporal.PlainTime",
    hour: lt.hour,
    minute: lt.minute,
    second: lt.second,
    millisecond: lt.millisecond,
    microsecond: 0,
    nanosecond: 0,
    toString(): string {
      return isoStr;
    },
    toJSON(): string {
      return isoStr;
    },
    valueOf: throwTemporalValueOf,
  });
}

/**
 * Converts a Chronera `LocalDateTime`, `ZonedDateTime`, `LocalDate`, `Instant`, `Chronera`, `Date`, or ISO string
 * into a TC39 `Temporal.PlainDateTime` (or structural `TemporalPlainDateTimeLike`).
 */
export function toTemporalPlainDateTime(
  input: TemporalDateInput,
  options?: ToTemporalOptions,
): TemporalPlainDateTimeLike {
  let ldt: LocalDateTime;
  let calendarId: CalendarId = "iso8601";

  if (typeof input === "object" && input !== null && isDomainPrimitive(input)) {
    if (input.kind === "local-date-time") {
      ldt = input;
    } else if (input.kind === "local-date") {
      ldt = localDateTime(input, localTime(0, 0, 0, 0));
    } else if (input.kind === "zoned-date-time") {
      const f = getZonedFields(input);
      ldt = localDateTime(
        localDate(f.year, f.month, f.day),
        localTime(f.hour, f.minute, f.second, f.millisecond),
      );
      calendarId = input.calendar === "gregory" ? "iso8601" : input.calendar;
    } else if (input.kind === "instant") {
      const d = new Date(input.epochMilliseconds);
      ldt = localDateTime(
        localDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()),
        localTime(
          d.getUTCHours(),
          d.getUTCMinutes(),
          d.getUTCSeconds(),
          d.getUTCMilliseconds(),
        ),
      );
    } else if (input.kind === "calendar-date") {
      calendarId = input.calendar;
      const greg = convertCalendarDate(input, "gregory").value;
      const m = greg.month ?? parseGregorianMonthCode(greg.monthCode) ?? 1;
      ldt = localDateTime(
        localDate(greg.year, m, greg.day),
        localTime(0, 0, 0, 0),
      );
    } else {
      throw new ChroneraError(
        "CHRONERA_INVALID_DATE",
        "Unsupported domain input for toTemporalPlainDateTime.",
      );
    }
  } else if (
    typeof input === "string" &&
    !input.endsWith("Z") &&
    !isIXDTF(input.trim()) &&
    !/[+-]\d{2}:?\d{2}$/.test(input.trim()) &&
    input.includes("T")
  ) {
    const [datePart, timePart] = input.trim().split("T");
    const d = parseLocalDate(datePart!);
    const t = toTemporalPlainTime(timePart!, { useNative: false });
    ldt = localDateTime(
      d,
      localTime(t.hour, t.minute, t.second, t.millisecond),
    );
  } else {
    const pd = toTemporalPlainDate(input, { useNative: false });
    let pt: TemporalPlainTimeLike;
    try {
      pt = toTemporalPlainTime(input as TemporalTimeInput, {
        useNative: false,
      });
    } catch {
      pt = toTemporalPlainTime("00:00:00", { useNative: false });
    }
    ldt = localDateTime(
      localDate(
        pd.isoYear ?? pd.year,
        pd.isoMonth ?? pd.month,
        pd.isoDay ?? pd.day,
      ),
      localTime(pt.hour, pt.minute, pt.second, pt.millisecond),
    );
    calendarId = pd.calendarId;
  }

  const isoStr = `${pad4(ldt.date.year)}-${pad2(ldt.date.month)}-${pad2(
    ldt.date.day,
  )}T${formatTimeIso(
    ldt.time.hour,
    ldt.time.minute,
    ldt.time.second,
    ldt.time.millisecond,
  )}${
    calendarId !== "iso8601" && calendarId !== "gregory"
      ? `[u-ca=${calendarId}]`
      : ""
  }`;

  const runtimeTemporal = getRuntimeTemporal(options);
  if (runtimeTemporal?.PlainDateTime?.from) {
    return runtimeTemporal.PlainDateTime.from(isoStr);
  }

  const monthCode = formatGregorianMonthCode(ldt.date.month);
  return Object.freeze({
    [Symbol.toStringTag]: "Temporal.PlainDateTime",
    year: ldt.date.year,
    month: ldt.date.month,
    day: ldt.date.day,
    monthCode,
    hour: ldt.time.hour,
    minute: ldt.time.minute,
    second: ldt.time.second,
    millisecond: ldt.time.millisecond,
    microsecond: 0,
    nanosecond: 0,
    calendarId,
    isoYear: ldt.date.year,
    isoMonth: ldt.date.month,
    isoDay: ldt.date.day,
    toString(): string {
      return isoStr;
    },
    toJSON(): string {
      return isoStr;
    },
    valueOf: throwTemporalValueOf,
  });
}

/**
 * Converts a Chronera `Instant`, `ZonedDateTime`, `Chronera`, `Date`, epoch ms, or ISO timestamp
 * into a TC39 `Temporal.Instant` (or structural `TemporalInstantLike`).
 */
export function toTemporalInstant(
  input: Instant | ZonedDateTime | Chronera | Date | string | number,
  options?: ToTemporalOptions,
): TemporalInstantLike {
  let inst: Instant;

  if (typeof input === "number") {
    inst = instantFromEpochMilliseconds(input);
  } else if (input instanceof Date) {
    inst = instantFromDate(input);
  } else if (typeof input === "string") {
    const trimmed = input.trim();
    if (isIXDTF(trimmed)) {
      inst = parseIXDTF(trimmed).instant;
    } else {
      inst = parseInstant(trimmed);
    }
  } else if (typeof input === "object" && input !== null) {
    if (isDomainPrimitive(input)) {
      if (input.kind === "instant") {
        inst = input;
      } else if (input.kind === "zoned-date-time") {
        inst = input.instant;
      } else {
        throw new ChroneraError(
          "CHRONERA_INVALID_INSTANT",
          `Cannot convert ${(input as { kind?: string }).kind} directly to Temporal.Instant without a time zone.`,
        );
      }
    } else if (
      "toInstant" in input &&
      typeof (input as { toInstant?: unknown }).toInstant === "function"
    ) {
      inst = (input as { toInstant(): Instant }).toInstant();
    } else {
      throw new ChroneraError(
        "CHRONERA_INVALID_INSTANT",
        "Unsupported object input for toTemporalInstant.",
      );
    }
  } else {
    throw new ChroneraError(
      "CHRONERA_INVALID_INSTANT",
      "Invalid input for toTemporalInstant.",
    );
  }

  const runtimeTemporal = getRuntimeTemporal(options);
  if (runtimeTemporal?.Instant?.fromEpochMilliseconds) {
    return runtimeTemporal.Instant.fromEpochMilliseconds(
      inst.epochMilliseconds,
    );
  }

  const isoStr = new Date(inst.epochMilliseconds).toISOString();
  const epochNanoseconds = BigInt(inst.epochMilliseconds) * 1_000_000n;

  return Object.freeze({
    [Symbol.toStringTag]: "Temporal.Instant",
    epochMilliseconds: inst.epochMilliseconds,
    epochNanoseconds,
    toString(): string {
      return isoStr;
    },
    toJSON(): string {
      return isoStr;
    },
    valueOf: throwTemporalValueOf,
  });
}

/**
 * Converts a Chronera `ZonedDateTime` (or `Instant` / `Chronera` / `Date` / IXDTF string + `timeZone`)
 * into a TC39 `Temporal.ZonedDateTime` (or structural `TemporalZonedDateTimeLike`).
 */
export function toTemporalZonedDateTime(
  input: ZonedDateTime | Instant | Chronera | Date | string | number,
  timeZone?: TimeZoneId,
  calendar?: CalendarId,
  options?: ToTemporalOptions,
): TemporalZonedDateTimeLike {
  let zdt: ZonedDateTime;

  if (
    typeof input === "object" &&
    input !== null &&
    isDomainPrimitive(input) &&
    input.kind === "zoned-date-time"
  ) {
    zdt = zonedDateTime(
      input.instant,
      timeZone ?? input.timeZone,
      calendar ?? input.calendar,
    );
  } else if (typeof input === "string" && isIXDTF(input.trim())) {
    const parsed = parseIXDTF(input.trim());
    zdt = zonedDateTime(
      parsed.instant,
      timeZone ?? parsed.timeZone,
      calendar ?? parsed.calendar,
    );
  } else if (
    typeof input === "object" &&
    input !== null &&
    "toZonedDateTime" in input &&
    typeof (input as { toZonedDateTime?: unknown }).toZonedDateTime ===
      "function"
  ) {
    zdt = (
      input as {
        toZonedDateTime(tz?: TimeZoneId, cal?: CalendarId): ZonedDateTime;
      }
    ).toZonedDateTime(timeZone, calendar);
  } else {
    const tz = timeZone ?? "UTC";
    const cal = calendar ?? "iso8601";
    const inst = toTemporalInstant(input, { useNative: false });
    zdt = zonedDateTime(
      instantFromEpochMilliseconds(inst.epochMilliseconds),
      tz,
      cal,
    );
  }

  const calendarId = zdt.calendar === "gregory" ? "iso8601" : zdt.calendar;
  const ixdtfStr = formatIXDTF(zdt, {
    includeCalendar: calendarId !== "iso8601",
  });

  const runtimeTemporal = getRuntimeTemporal(options);
  if (runtimeTemporal?.ZonedDateTime?.from) {
    return runtimeTemporal.ZonedDateTime.from(ixdtfStr);
  }

  const fields = getZonedFields(zdt);
  const epochNanoseconds = BigInt(zdt.instant.epochMilliseconds) * 1_000_000n;
  const monthCode = formatGregorianMonthCode(fields.month);

  return Object.freeze({
    [Symbol.toStringTag]: "Temporal.ZonedDateTime",
    epochMilliseconds: zdt.instant.epochMilliseconds,
    epochNanoseconds,
    timeZoneId: zdt.timeZone,
    calendarId,
    year: fields.year,
    month: fields.month,
    day: fields.day,
    monthCode,
    hour: fields.hour,
    minute: fields.minute,
    second: fields.second,
    millisecond: fields.millisecond,
    microsecond: 0,
    nanosecond: 0,
    offset: fields.offsetString,
    offsetNanoseconds: fields.offsetMilliseconds * 1_000_000,
    toString(): string {
      return ixdtfStr;
    },
    toJSON(): string {
      return ixdtfStr;
    },
    valueOf: throwTemporalValueOf,
  });
}

/**
 * Converts a Chronera `Duration` object or ISO 8601 duration string (`"P1Y2M3DT4H"`)
 * into a TC39 `Temporal.Duration` (or structural `TemporalDurationLike`).
 */
export function toTemporalDuration(
  input: Duration | string,
  options?: ToTemporalOptions,
): TemporalDurationLike {
  const dur = typeof input === "string" ? parseDuration(input) : input;
  if (!dur || typeof dur !== "object") {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      "Expected a Duration object or ISO 8601 duration string.",
    );
  }

  const years = dur.years ?? 0;
  const months = dur.months ?? 0;
  const weeks = dur.weeks ?? 0;
  const days = dur.days ?? 0;
  const hours = dur.hours ?? 0;
  const minutes = dur.minutes ?? 0;
  const seconds = dur.seconds ?? 0;
  const milliseconds = dur.milliseconds ?? 0;

  const values = [
    years,
    months,
    weeks,
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
  ];
  const hasPositive = values.some((v) => v > 0);
  const hasNegative = values.some((v) => v < 0);
  if (hasPositive && hasNegative) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      "Temporal.Duration cannot mix positive and negative components.",
    );
  }

  const sign: -1 | 0 | 1 = hasPositive ? 1 : hasNegative ? -1 : 0;
  const blank = sign === 0;
  const isoStr = durationToISO(dur);

  const runtimeTemporal = getRuntimeTemporal(options);
  if (runtimeTemporal?.Duration?.from) {
    return runtimeTemporal.Duration.from(isoStr);
  }

  return Object.freeze({
    [Symbol.toStringTag]: "Temporal.Duration",
    years,
    months,
    weeks,
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
    microseconds: 0,
    nanoseconds: 0,
    sign,
    blank,
    toString(): string {
      return isoStr;
    },
    toJSON(): string {
      return isoStr;
    },
    valueOf: throwTemporalValueOf,
  });
}

// ---------------------------------------------------------------------------
// Temporal -> Chronera (fromTemporal*)
// ---------------------------------------------------------------------------

/**
 * Converts a TC39 `Temporal.PlainDate` (or structural `TemporalPlainDateLike` / ISO string)
 * into a Chronera `LocalDate`.
 */
export function fromTemporalPlainDate(
  input:
    | TemporalPlainDateLike
    | {
        readonly year: number;
        readonly month: number;
        readonly day: number;
        readonly isoYear?: number;
        readonly isoMonth?: number;
        readonly isoDay?: number;
        readonly calendarId?: string;
      }
    | string,
): LocalDate {
  if (typeof input === "string") {
    const trimmed = input.trim();
    const bracketIdx = trimmed.indexOf("[");
    const datePart = bracketIdx !== -1 ? trimmed.slice(0, bracketIdx) : trimmed;
    return parseLocalDate(datePart.slice(0, 10));
  }
  if (typeof input === "object" && input !== null) {
    const year = typeof input.isoYear === "number" ? input.isoYear : input.year;
    const month =
      typeof input.isoMonth === "number" ? input.isoMonth : input.month;
    const day = typeof input.isoDay === "number" ? input.isoDay : input.day;

    if (
      typeof input.isoYear !== "number" &&
      typeof input.calendarId === "string" &&
      input.calendarId !== "iso8601" &&
      input.calendarId !== "gregory" &&
      "toString" in input &&
      typeof input.toString === "function"
    ) {
      const str = input.toString();
      const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
      if (match) {
        return localDate(
          Number.parseInt(match[1]!, 10),
          Number.parseInt(match[2]!, 10),
          Number.parseInt(match[3]!, 10),
        );
      }
    }
    return localDate(year, month, day);
  }
  throw new ChroneraError(
    "CHRONERA_INVALID_DATE",
    "Expected a Temporal.PlainDate object or ISO date string.",
  );
}

/**
 * Converts a TC39 `Temporal.PlainTime` (or structural `TemporalPlainTimeLike` / ISO time string)
 * into a Chronera `LocalTime`.
 */
export function fromTemporalPlainTime(
  input:
    | TemporalPlainTimeLike
    | {
        readonly hour: number;
        readonly minute: number;
        readonly second?: number;
        readonly millisecond?: number;
      }
    | string,
): LocalTime {
  if (typeof input === "string") {
    const pt = toTemporalPlainTime(input, { useNative: false });
    return localTime(pt.hour, pt.minute, pt.second, pt.millisecond);
  }
  if (typeof input === "object" && input !== null) {
    return localTime(
      input.hour,
      input.minute,
      input.second ?? 0,
      input.millisecond ?? 0,
    );
  }
  throw new ChroneraError(
    "CHRONERA_INVALID_TIME",
    "Expected a Temporal.PlainTime object or ISO time string.",
  );
}

/**
 * Converts a TC39 `Temporal.PlainDateTime` (or structural `TemporalPlainDateTimeLike` / ISO string)
 * into a Chronera `LocalDateTime`.
 */
export function fromTemporalPlainDateTime(
  input:
    | TemporalPlainDateTimeLike
    | {
        readonly year: number;
        readonly month: number;
        readonly day: number;
        readonly hour?: number;
        readonly minute?: number;
        readonly second?: number;
        readonly millisecond?: number;
        readonly isoYear?: number;
        readonly isoMonth?: number;
        readonly isoDay?: number;
        readonly calendarId?: string;
      }
    | string,
): LocalDateTime {
  if (typeof input === "string") {
    const pdt = toTemporalPlainDateTime(input, { useNative: false });
    return localDateTime(
      localDate(
        pdt.isoYear ?? pdt.year,
        pdt.isoMonth ?? pdt.month,
        pdt.isoDay ?? pdt.day,
      ),
      localTime(pdt.hour, pdt.minute, pdt.second, pdt.millisecond),
    );
  }
  if (typeof input === "object" && input !== null) {
    const d = fromTemporalPlainDate(input);
    const t = localTime(
      input.hour ?? 0,
      input.minute ?? 0,
      input.second ?? 0,
      input.millisecond ?? 0,
    );
    return localDateTime(d, t);
  }
  throw new ChroneraError(
    "CHRONERA_INVALID_DATE",
    "Expected a Temporal.PlainDateTime object or ISO date-time string.",
  );
}

/**
 * Converts a TC39 `Temporal.Instant` (or structural `{ epochMilliseconds }` / `{ epochNanoseconds }` / ISO string)
 * into a Chronera `Instant`.
 */
export function fromTemporalInstant(
  input:
    | TemporalInstantLike
    | {
        readonly epochMilliseconds?: number;
        readonly epochNanoseconds?: bigint;
      }
    | string,
): Instant {
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (isIXDTF(trimmed)) {
      return parseIXDTF(trimmed).instant;
    }
    return parseInstant(trimmed);
  }
  if (typeof input === "object" && input !== null) {
    if (
      typeof input.epochMilliseconds === "number" &&
      Number.isFinite(input.epochMilliseconds)
    ) {
      return instantFromEpochMilliseconds(Math.trunc(input.epochMilliseconds));
    }
    if (typeof input.epochNanoseconds === "bigint") {
      const ms = Number(input.epochNanoseconds / 1_000_000n);
      return instantFromEpochMilliseconds(ms);
    }
  }
  throw new ChroneraError(
    "CHRONERA_INVALID_INSTANT",
    "Expected a Temporal.Instant object with epochMilliseconds/epochNanoseconds or an ISO string.",
  );
}

/**
 * Converts a TC39 `Temporal.ZonedDateTime` (or structural `TemporalZonedDateTimeLike` / RFC 9557 IXDTF string)
 * into a Chronera `ZonedDateTime`.
 */
export function fromTemporalZonedDateTime(
  input:
    | TemporalZonedDateTimeLike
    | {
        readonly epochMilliseconds?: number;
        readonly epochNanoseconds?: bigint;
        readonly timeZoneId: string;
        readonly calendarId?: string;
      }
    | string,
): ZonedDateTime {
  if (typeof input === "string") {
    return parseIXDTF(input);
  }
  if (
    typeof input === "object" &&
    input !== null &&
    typeof input.timeZoneId === "string"
  ) {
    const inst = fromTemporalInstant(input);
    const rawCal = input.calendarId ?? "gregory";
    const cal: CalendarId = rawCal === "iso8601" ? "gregory" : rawCal;
    return zonedDateTime(inst, input.timeZoneId, cal);
  }
  throw new ChroneraError(
    "CHRONERA_INVALID_DATE",
    "Expected a Temporal.ZonedDateTime object or RFC 9557 IXDTF string.",
  );
}

/**
 * Converts a TC39 `Temporal.Duration` (or structural `TemporalDurationLike` / ISO 8601 duration string)
 * into a Chronera `Duration`.
 */
export function fromTemporalDuration(
  input:
    | TemporalDurationLike
    | {
        readonly years?: number;
        readonly months?: number;
        readonly weeks?: number;
        readonly days?: number;
        readonly hours?: number;
        readonly minutes?: number;
        readonly seconds?: number;
        readonly milliseconds?: number;
      }
    | string,
): Duration {
  if (typeof input === "string") {
    return parseDuration(input);
  }
  if (typeof input === "object" && input !== null) {
    const result: {
      years?: number;
      months?: number;
      weeks?: number;
      days?: number;
      hours?: number;
      minutes?: number;
      seconds?: number;
      milliseconds?: number;
    } = {};
    if (input.years) result.years = input.years;
    if (input.months) result.months = input.months;
    if (input.weeks) result.weeks = input.weeks;
    if (input.days) result.days = input.days;
    if (input.hours) result.hours = input.hours;
    if (input.minutes) result.minutes = input.minutes;
    if (input.seconds) result.seconds = input.seconds;
    if (input.milliseconds) result.milliseconds = input.milliseconds;
    return result;
  }
  throw new ChroneraError(
    "CHRONERA_INVALID_DATE",
    "Expected a Temporal.Duration object or ISO 8601 duration string.",
  );
}
