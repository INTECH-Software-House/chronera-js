import { getNowDate } from "../runtime/clock.js";
import { validateAndResolveLocale } from "../locale/resolve-locale.js";
import { parseInstant } from "../parse/parse-instant.js";
import { parseLocalDate } from "../parse/parse-local-date.js";
import { isIXDTF, parseIXDTF } from "./ixdtf.js";
import { ChroneraError } from "../errors/errors.js";

import type { ChroneraInput } from "../chronera.js";

export type RelativeTimeUnit =
  "second" | "minute" | "hour" | "day" | "week" | "month" | "year";

export interface TimeAgoOptions {
  /**
   * Reference target date to compare against.
   * Defaults to current clock time (supports clock mocking via `@intech-software/chronera/testing`).
   */
  readonly relativeTo?: ChroneraInput;
  /**
   * Locale identifier (e.g. "th", "th-TH", "en", "en-US", "ja").
   * Defaults to "en-US" or current configured locale.
   */
  readonly locale?: string;
  /**
   * Whether to append time direction affixes ("ago", "in", "ที่แล้ว", "อีก").
   * Defaults to true. If false, returns distance magnitude (e.g. "3 minutes", "3 นาที").
   */
  readonly addSuffix?: boolean;
  /**
   * Whether to format with natural humanized words like "yesterday", "เมื่อสักครู่", "มะรืนนี้".
   * Defaults to "auto".
   */
  readonly numeric?: "always" | "auto";
  /**
   * Concise badge / mobile notation (e.g. "now", "15s", "5m", "2h", "3d", "2mo", "1y").
   * Defaults to false.
   */
  readonly compact?: boolean;
  /**
   * Fixed unit override (if specified, disables auto unit progression).
   */
  readonly unit?: RelativeTimeUnit;
}

export type FormatDistanceOptions = TimeAgoOptions;

function toEpochMilliseconds(input: ChroneraInput): number {
  if (input === null || input === undefined) {
    return getNowDate().getTime();
  }
  if (input instanceof Date) {
    return input.getTime();
  }
  if (typeof input === "number") {
    return input;
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (isIXDTF(trimmed)) {
      return parseIXDTF(trimmed).instant.epochMilliseconds;
    }
    if (
      trimmed.includes("T") ||
      trimmed.endsWith("Z") ||
      /[+-]\d{2}:?\d{2}$/.test(trimmed)
    ) {
      return parseInstant(trimmed).epochMilliseconds;
    }
    const ld = parseLocalDate(trimmed);
    return Date.UTC(ld.year, ld.month - 1, ld.day);
  }
  if (typeof input === "object") {
    if (
      "toInstant" in input &&
      typeof (input as { toInstant?: unknown }).toInstant === "function"
    ) {
      return (
        input as { toInstant(): { epochMilliseconds: number } }
      ).toInstant().epochMilliseconds;
    }
    if ("kind" in input) {
      const domain = input as
        | { readonly kind: "instant"; readonly epochMilliseconds: number }
        | {
            readonly kind: "zoned-date-time";
            readonly instant: { readonly epochMilliseconds: number };
          }
        | {
            readonly kind: "local-date";
            readonly year: number;
            readonly month: number;
            readonly day: number;
          }
        | {
            readonly kind: "local-date-time";
            readonly date: {
              readonly year: number;
              readonly month: number;
              readonly day: number;
            };
            readonly time: {
              readonly hour: number;
              readonly minute: number;
              readonly second: number;
              readonly millisecond: number;
            };
          };
      if (domain.kind === "instant") {
        return domain.epochMilliseconds;
      }
      if (domain.kind === "zoned-date-time") {
        return domain.instant.epochMilliseconds;
      }
      if (domain.kind === "local-date") {
        return Date.UTC(domain.year, domain.month - 1, domain.day);
      }
      if (domain.kind === "local-date-time") {
        return Date.UTC(
          domain.date.year,
          domain.date.month - 1,
          domain.date.day,
          domain.time.hour,
          domain.time.minute,
          domain.time.second,
          domain.time.millisecond,
        );
      }
    }
    if (
      "toDate" in input &&
      typeof (input as { toDate?: unknown }).toDate === "function"
    ) {
      const d = (input as { toDate(): unknown }).toDate();
      if (d instanceof Date && !Number.isNaN(d.getTime())) {
        return d.getTime();
      }
    }
    if (
      "valueOf" in input &&
      typeof (input as { valueOf?: unknown }).valueOf === "function"
    ) {
      const v = (input as { valueOf(): unknown }).valueOf();
      if (typeof v === "number" && Number.isFinite(v)) {
        return v;
      }
    }
  }
  throw new ChroneraError(
    "CHRONERA_INVALID_DATE",
    "Invalid date input for relative time calculation.",
  );
}

interface UnitDiff {
  readonly unit: Intl.RelativeTimeFormatUnit;
  readonly value: number;
  readonly absValue: number;
}

function calculateBestUnit(
  diffMs: number,
  overrideUnit?: RelativeTimeUnit,
): UnitDiff {
  if (overrideUnit !== undefined) {
    switch (overrideUnit) {
      case "second": {
        const v = Math.round(diffMs / 1000);
        return { unit: "second", value: v, absValue: Math.abs(v) };
      }
      case "minute": {
        const v = Math.round(diffMs / 60000);
        return { unit: "minute", value: v, absValue: Math.abs(v) };
      }
      case "hour": {
        const v = Math.round(diffMs / 3600000);
        return { unit: "hour", value: v, absValue: Math.abs(v) };
      }
      case "day": {
        const v = Math.round(diffMs / 86400000);
        return { unit: "day", value: v, absValue: Math.abs(v) };
      }
      case "week": {
        const v = Math.round(diffMs / (86400000 * 7));
        return { unit: "week", value: v, absValue: Math.abs(v) };
      }
      case "month": {
        const v = Math.round(diffMs / (86400000 * 30.4375));
        return { unit: "month", value: v, absValue: Math.abs(v) };
      }
      case "year": {
        const v = Math.round(diffMs / (86400000 * 365.25));
        return { unit: "year", value: v, absValue: Math.abs(v) };
      }
    }
  }

  const absSec = Math.round(Math.abs(diffMs) / 1000);

  if (absSec < 45) {
    const v = Math.round(diffMs / 1000);
    return { unit: "second", value: v, absValue: Math.abs(v) };
  }
  if (absSec < 2700) {
    // < 45 mins
    const v = Math.round(diffMs / 60000);
    return { unit: "minute", value: v, absValue: Math.abs(v) };
  }
  if (absSec < 79200) {
    // < 22 hours
    const v = Math.round(diffMs / 3600000);
    return { unit: "hour", value: v, absValue: Math.abs(v) };
  }
  if (absSec < 2246400) {
    // < 26 days
    const v = Math.round(diffMs / 86400000);
    return { unit: "day", value: v, absValue: Math.abs(v) };
  }
  if (absSec < 27648000) {
    // < 320 days
    const v = Math.round(diffMs / (86400000 * 30.4375));
    return { unit: "month", value: v, absValue: Math.abs(v) };
  }

  const v = Math.round(diffMs / (86400000 * 365.25));
  return { unit: "year", value: v, absValue: Math.abs(v) };
}

function formatCompact(unitDiff: UnitDiff, isThai: boolean): string {
  const { unit, absValue } = unitDiff;

  if (unit === "second" && absValue < 45) {
    return isThai ? "เมื่อสักครู่" : "now";
  }

  if (isThai) {
    switch (unit) {
      case "second":
        return `${absValue} วิ`;
      case "minute":
        return `${absValue} นาที`;
      case "hour":
        return `${absValue} ชม.`;
      case "day":
        return `${absValue} วัน`;
      case "week":
        return `${absValue} สัปดาห์`;
      case "month":
        return `${absValue} ด.`;
      case "year":
        return `${absValue} ปี`;
    }
  }

  switch (unit) {
    case "second":
      return `${absValue}s`;
    case "minute":
      return `${absValue}m`;
    case "hour":
      return `${absValue}h`;
    case "day":
      return `${absValue}d`;
    case "week":
      return `${absValue}w`;
    case "month":
      return `${absValue}mo`;
    case "year":
      return `${absValue}y`;
    default:
      return `${absValue}`;
  }
}

function formatThaiNatural(
  unitDiff: UnitDiff,
  addSuffix: boolean,
  numeric: "always" | "auto",
): string {
  const { unit, value, absValue } = unitDiff;

  if (!addSuffix) {
    switch (unit) {
      case "second":
        return `${absValue} วินาที`;
      case "minute":
        return `${absValue} นาที`;
      case "hour":
        return `${absValue} ชั่วโมง`;
      case "day":
        return `${absValue} วัน`;
      case "week":
        return `${absValue} สัปดาห์`;
      case "month":
        return `${absValue} เดือน`;
      case "year":
        return `${absValue} ปี`;
      default:
        return `${absValue}`;
    }
  }

  // Automatic natural idiom
  if (numeric === "auto") {
    if (unit === "second" && absValue < 45) {
      return "เมื่อสักครู่";
    }
    if (unit === "day") {
      if (value === -1) return "เมื่อวานนี้";
      if (value === 1) return "พรุ่งนี้";
      if (value === 2) return "มะรืนนี้";
    }
  }

  if (value < 0) {
    // Past: "3 นาทีที่แล้ว"
    switch (unit) {
      case "second":
        return `${absValue} วินาทีที่แล้ว`;
      case "minute":
        return `${absValue} นาทีที่แล้ว`;
      case "hour":
        return `${absValue} ชั่วโมงที่แล้ว`;
      case "day":
        return `${absValue} วันที่แล้ว`;
      case "week":
        return `${absValue} สัปดาห์ที่แล้ว`;
      case "month":
        return `${absValue} เดือนที่แล้ว`;
      case "year":
        return `${absValue} ปีที่แล้ว`;
      default:
        return `${absValue} ที่แล้ว`;
    }
  }

  // Future: "อีก 3 นาที"
  switch (unit) {
    case "second":
      return `อีก ${absValue} วินาที`;
    case "minute":
      return `อีก ${absValue} นาที`;
    case "hour":
      return `อีก ${absValue} ชั่วโมง`;
    case "day":
      return `อีก ${absValue} วัน`;
    case "week":
      return `อีก ${absValue} สัปดาห์`;
    case "month":
      return `อีก ${absValue} เดือน`;
    case "year":
      return `อีก ${absValue} ปี`;
    default:
      return `อีก ${absValue}`;
  }
}

function formatEnglishNoSuffix(unitDiff: UnitDiff): string {
  const { unit, absValue } = unitDiff;
  const s = absValue === 1 ? "" : "s";
  switch (unit) {
    case "second":
      return `${absValue} second${s}`;
    case "minute":
      return `${absValue} minute${s}`;
    case "hour":
      return `${absValue} hour${s}`;
    case "day":
      return `${absValue} day${s}`;
    case "week":
      return `${absValue} week${s}`;
    case "month":
      return `${absValue} month${s}`;
    case "year":
      return `${absValue} year${s}`;
    default:
      return `${absValue}`;
  }
}

/**
 * Calculates and formats the distance from a target date to the current time or a reference date.
 *
 * Automatically scales unit thresholds (seconds -> minutes -> hours -> days -> months -> years)
 * without throwing errors on intervals beyond 28 days.
 *
 * @example
 * ```ts
 * timeAgo("2026-09-27T10:00:00Z"); // e.g. "3 minutes ago" or "3 นาทีที่แล้ว"
 * timeAgo(d, { locale: "th" });     // "เมื่อสักครู่", "3 นาทีที่แล้ว", "อีก 2 วัน"
 * timeAgo(d, { compact: true });    // "5m", "2h", "3d"
 * ```
 */
export function timeAgo(
  target: ChroneraInput,
  options?: TimeAgoOptions,
): string {
  const targetMs = toEpochMilliseconds(target);
  const relativeToMs =
    options?.relativeTo !== undefined
      ? toEpochMilliseconds(options.relativeTo)
      : getNowDate().getTime();

  const diffMs = targetMs - relativeToMs;
  const resolvedLocale = validateAndResolveLocale(options?.locale);
  const locale = resolvedLocale.baseLocale;
  const isThai = locale.toLowerCase().startsWith("th");

  const compact = options?.compact ?? false;
  const addSuffix = options?.addSuffix ?? true;
  const numeric = options?.numeric ?? "auto";

  const unitDiff = calculateBestUnit(diffMs, options?.unit);

  if (compact) {
    return formatCompact(unitDiff, isThai);
  }

  if (isThai) {
    return formatThaiNatural(unitDiff, addSuffix, numeric);
  }

  if (!addSuffix) {
    return formatEnglishNoSuffix(unitDiff);
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric });
  return rtf.format(unitDiff.value, unitDiff.unit);
}

/**
 * Formats the relative distance between two dates.
 *
 * @example
 * ```ts
 * formatDistance(dateA, dateB); // "3 days ago" or "in 3 days"
 * ```
 */
export function formatDistance(
  start: ChroneraInput,
  end: ChroneraInput,
  options?: FormatDistanceOptions,
): string {
  return timeAgo(start, {
    ...options,
    relativeTo: end,
  });
}

/**
 * Formats the relative distance from a given date to now (synonym for `timeAgo`).
 */
export function formatDistanceToNow(
  date: ChroneraInput,
  options?: FormatDistanceOptions,
): string {
  return timeAgo(date, options);
}
