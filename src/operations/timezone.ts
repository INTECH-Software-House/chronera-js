import {
  projectInstantToZonedFields,
  validateTimeZone,
} from "../runtime/timezone.js";
import { formatWithPatternWithRegistry } from "../format/format-pattern.js";
import { defaultCalendarRegistry } from "../calendar/registry.js";
import { instantFromDate } from "../core/instant.js";
import { ChroneraError } from "../errors/errors.js";

import type {
  FormatInTimeZoneOptions,
  Instant,
  SameTimeZoneOptions,
  TimeZoneId,
  TimeZoneOffsetFormat,
  TimeZoneOffsetInfo,
} from "../public-types.js";

function toInstant(input: unknown): Instant {
  if (input instanceof Date) {
    return instantFromDate(input);
  }
  if (
    typeof input === "object" &&
    input !== null &&
    "kind" in input &&
    "epochMilliseconds" in input &&
    (input as Record<string, unknown>).kind === "instant" &&
    typeof (input as Record<string, unknown>).epochMilliseconds === "number"
  ) {
    return input as Instant;
  }
  throw new ChroneraError(
    "CHRONERA_INVALID_DATE",
    "Expected a valid Instant or Date object.",
  );
}

/**
 * Formats an Instant or Date in the specified IANA target time zone using a pattern string.
 *
 * @param instant - The source Instant or JavaScript Date.
 * @param timeZone - The canonical or valid IANA time zone identifier (e.g. "Asia/Bangkok", "America/New_York").
 * @param pattern - An LDML pattern string (e.g. "yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd HH:mm:ss XXX", "hh:mm a zzz").
 * @param optionsOrLocale - Optional locale string or FormatInTimeZoneOptions object.
 * @returns The formatted date/time string.
 */
export function formatInTimeZone(
  instant: Instant | Date,
  timeZone: TimeZoneId,
  pattern: string,
  optionsOrLocale?: string | Readonly<FormatInTimeZoneOptions>,
): string {
  validateTimeZone(timeZone);
  const targetInstant = toInstant(instant);

  const options: FormatInTimeZoneOptions =
    typeof optionsOrLocale === "string"
      ? { locale: optionsOrLocale }
      : (optionsOrLocale ?? {});

  return formatWithPatternWithRegistry(
    defaultCalendarRegistry,
    targetInstant,
    pattern,
    {
      ...options,
      timeZone,
    },
  );
}

/**
 * Computes the time zone offset at the given instant (or current time if omitted).
 */
export function getTimeZoneOffset(
  timeZone: TimeZoneId,
  instant?: Instant | Date,
  format?: "string",
): string;
export function getTimeZoneOffset(
  timeZone: TimeZoneId,
  instant: Instant | Date | undefined,
  format: "minutes",
): number;
export function getTimeZoneOffset(
  timeZone: TimeZoneId,
  instant: Instant | Date | undefined,
  format: "totalSeconds",
): number;
export function getTimeZoneOffset(
  timeZone: TimeZoneId,
  instant: Instant | Date | undefined,
  format: "object",
): TimeZoneOffsetInfo;
export function getTimeZoneOffset(
  timeZone: TimeZoneId,
  instant?: Instant | Date,
  format?: TimeZoneOffsetFormat,
): string | number | TimeZoneOffsetInfo;
export function getTimeZoneOffset(
  timeZone: TimeZoneId,
  instant?: Instant | Date,
  format?: TimeZoneOffsetFormat,
): string | number | TimeZoneOffsetInfo {
  validateTimeZone(timeZone);

  const targetInstant: Instant =
    instant === undefined
      ? { kind: "instant", epochMilliseconds: Date.now() }
      : toInstant(instant);

  const fields = projectInstantToZonedFields(targetInstant, timeZone);
  const zonedUtcMs = Date.UTC(
    fields.year,
    fields.month - 1,
    fields.day,
    fields.hour,
    fields.minute,
    fields.second,
    fields.millisecond,
  );

  const offsetMs = zonedUtcMs - targetInstant.epochMilliseconds;
  const minutes = Math.round(offsetMs / 60000);
  const totalSeconds = Math.round(offsetMs / 1000);

  const sign = minutes >= 0 ? "+" : "-";
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  const formatted = `${sign}${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;

  const selectedFormat = format ?? "string";
  if (selectedFormat === "string") {
    return formatted;
  }
  if (selectedFormat === "minutes") {
    return minutes;
  }
  if (selectedFormat === "totalSeconds") {
    return totalSeconds;
  }

  // format === "object": determine DST
  const janInstant: Instant = {
    kind: "instant",
    epochMilliseconds: Date.UTC(fields.year, 0, 1, 12, 0, 0),
  };
  const julInstant: Instant = {
    kind: "instant",
    epochMilliseconds: Date.UTC(fields.year, 6, 1, 12, 0, 0),
  };

  const janFields = projectInstantToZonedFields(janInstant, timeZone);
  const julFields = projectInstantToZonedFields(julInstant, timeZone);

  const janOffsetMs =
    Date.UTC(
      janFields.year,
      janFields.month - 1,
      janFields.day,
      janFields.hour,
      janFields.minute,
      janFields.second,
    ) - janInstant.epochMilliseconds;

  const julOffsetMs =
    Date.UTC(
      julFields.year,
      julFields.month - 1,
      julFields.day,
      julFields.hour,
      julFields.minute,
      julFields.second,
    ) - julInstant.epochMilliseconds;

  const standardOffsetMs = Math.min(janOffsetMs, julOffsetMs);
  const isDst = offsetMs > standardOffsetMs && janOffsetMs !== julOffsetMs;

  return {
    formatted,
    minutes,
    totalSeconds,
    isDst,
  };
}

/**
 * Checks whether two IANA time zone identifiers are equivalent.
 *
 * @param tz1 - The first time zone identifier.
 * @param tz2 - The second time zone identifier.
 * @param options - Mode ("canonical" | "offset") and optional reference instant for offset comparison.
 * @returns true if equivalent according to the specified mode; otherwise false.
 */
export function isSameTimeZone(
  tz1: TimeZoneId,
  tz2: TimeZoneId,
  options?: "canonical" | "offset" | SameTimeZoneOptions,
): boolean {
  validateTimeZone(tz1);
  validateTimeZone(tz2);

  const mode =
    typeof options === "string" ? options : (options?.mode ?? "canonical");

  if (mode === "canonical") {
    const trimmed1 = tz1.trim();
    const trimmed2 = tz2.trim();
    if (trimmed1 === trimmed2) return true;

    const canonical1 = new Intl.DateTimeFormat(undefined, {
      timeZone: trimmed1,
    }).resolvedOptions().timeZone;
    const canonical2 = new Intl.DateTimeFormat(undefined, {
      timeZone: trimmed2,
    }).resolvedOptions().timeZone;

    return canonical1 === canonical2;
  }

  // mode === "offset"
  const refInstant =
    typeof options === "object" && options?.instant !== undefined
      ? options.instant
      : undefined;

  const offset1 = getTimeZoneOffset(tz1, refInstant, "minutes");
  const offset2 = getTimeZoneOffset(tz2, refInstant, "minutes");

  return offset1 === offset2;
}
