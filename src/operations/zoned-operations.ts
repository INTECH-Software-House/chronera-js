import { ChroneraRangeError } from "../errors/errors.js";
import { instantFromEpochMilliseconds } from "../core/instant.js";
import { localDate } from "../core/local-date.js";
import { localTime } from "../core/local-time.js";
import { localDateTime } from "../core/local-date-time.js";
import { zonedDateTime } from "../core/zoned-date-time.js";
import {
  projectInstantToZonedFields,
  validateTimeZone,
} from "../runtime/timezone.js";
import { getTimeZoneOffset, formatInTimeZone } from "./timezone.js";
import { addDays, addMonths, addYears } from "./convenience.js";
import { isDSTAtInstant } from "./world-clock.js";
import type {
  CalendarId,
  Duration,
  FormatDateOptions,
  Instant,
  LocalDate,
  LocalDateTime,
  LocalTime,
  TimeZoneId,
  ZonedDateTime,
} from "../public-types.js";

export type DisambiguationOption =
  "compatible" | "earlier" | "later" | "reject";

export interface ZonedDateTimeFields {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour?: number;
  readonly minute?: number;
  readonly second?: number;
  readonly millisecond?: number;
}

export interface ZonedFields {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;
  readonly offsetString: string;
  readonly offsetMilliseconds: number;
  readonly isDST: boolean;
  readonly timeZone: TimeZoneId;
  readonly calendar: CalendarId;
}

export interface CreateZonedOptions {
  readonly disambiguation?: DisambiguationOption;
  readonly calendar?: CalendarId;
}

/**
 * Resolves a local wall-clock date/time into a UTC Instant in a given time zone,
 * handling DST gaps (spring-forward) and DST overlaps (fall-back) according to
 * the TC39 Temporal disambiguation rules.
 */
function resolveInstantFromLocalFields(
  fields: ZonedDateTimeFields,
  timeZone: TimeZoneId,
  disambiguation: DisambiguationOption = "compatible",
): Instant {
  const {
    year,
    month,
    day,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
  } = fields;

  validateTimeZone(timeZone);

  // 1. Initial approximation using UTC
  const utcBase = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    millisecond,
  );
  const approxInstant = instantFromEpochMilliseconds(utcBase);

  // Get offset in seconds at initial approximation
  const offsetSec1 = getTimeZoneOffset(timeZone, approxInstant, "totalSeconds");
  const candidateMs1 = utcBase - offsetSec1 * 1000;

  // Project candidate 1 back to local timezone fields
  const p1 = projectInstantToZonedFields(
    instantFromEpochMilliseconds(candidateMs1),
    timeZone,
  );

  // Check if candidate 1 matches exactly
  const matchesP1 =
    p1.year === year &&
    p1.month === month &&
    p1.day === day &&
    p1.hour === hour &&
    p1.minute === minute &&
    p1.second === second;

  // Also check candidate 2 using p1's offset in case of DST boundary difference
  const offsetSec2 = getTimeZoneOffset(
    timeZone,
    instantFromEpochMilliseconds(candidateMs1),
    "totalSeconds",
  );
  const candidateMs2 = utcBase - offsetSec2 * 1000;
  const p2 = projectInstantToZonedFields(
    instantFromEpochMilliseconds(candidateMs2),
    timeZone,
  );

  const matchesP2 =
    p2.year === year &&
    p2.month === month &&
    p2.day === day &&
    p2.hour === hour &&
    p2.minute === minute &&
    p2.second === second;

  // Overlap detection: when local time matches, check whether shifting 1 hour produces the same local time
  if (matchesP1) {
    const checkShift = (offsetMs: number) => {
      const testInstant = instantFromEpochMilliseconds(candidateMs1 + offsetMs);
      const pTest = projectInstantToZonedFields(testInstant, timeZone);
      return (
        pTest.year === year &&
        pTest.month === month &&
        pTest.day === day &&
        pTest.hour === hour &&
        pTest.minute === minute &&
        pTest.second === second
      );
    };

    const hasEarlierOverlap = checkShift(-3600000);
    const hasLaterOverlap = checkShift(3600000);

    if (hasEarlierOverlap || hasLaterOverlap) {
      const altCandidate = hasLaterOverlap
        ? candidateMs1 + 3600000
        : candidateMs1 - 3600000;
      const earlierMs = Math.min(candidateMs1, altCandidate);
      const laterMs = Math.max(candidateMs1, altCandidate);

      if (disambiguation === "reject") {
        throw new ChroneraRangeError(
          "CHRONERA_OUT_OF_RANGE",
          `Ambiguous local time ${year}-${month}-${day} ${hour}:${minute}:${second} in time zone ${timeZone} due to DST fall-back overlap.`,
        );
      }
      if (disambiguation === "later") {
        return instantFromEpochMilliseconds(laterMs);
      }
      return instantFromEpochMilliseconds(earlierMs);
    }

    return instantFromEpochMilliseconds(candidateMs1);
  }

  if (matchesP2) {
    return instantFromEpochMilliseconds(candidateMs2);
  }

  // Neither candidate matched exactly => we are in a DST gap (spring-forward)!
  if (disambiguation === "reject") {
    throw new ChroneraRangeError(
      "CHRONERA_OUT_OF_RANGE",
      `Non-existent local time ${year}-${month}-${day} ${hour}:${minute}:${second} in time zone ${timeZone} due to DST spring-forward gap.`,
    );
  }

  if (disambiguation === "later" || disambiguation === "compatible") {
    // In compatible or later, advance by the gap duration
    return instantFromEpochMilliseconds(Math.max(candidateMs1, candidateMs2));
  }

  // earlier: choose the earlier instant right before gap
  return instantFromEpochMilliseconds(Math.min(candidateMs1, candidateMs2));
}

/**
 * Creates a ZonedDateTime from individual calendar and clock fields with
 * configurable DST disambiguation.
 */
export function createZonedDateTime(
  fields: ZonedDateTimeFields,
  timeZone: TimeZoneId,
  options?: CreateZonedOptions,
): ZonedDateTime {
  const disambiguation = options?.disambiguation ?? "compatible";
  const calendar = options?.calendar ?? "gregory";

  const instant = resolveInstantFromLocalFields(
    fields,
    timeZone,
    disambiguation,
  );
  return zonedDateTime(instant, timeZone, calendar);
}

/**
 * Projects a ZonedDateTime to its localized fields in its time zone.
 */
export function getZonedFields(zdt: ZonedDateTime): ZonedFields {
  validateTimeZone(zdt.timeZone);

  const projected = projectInstantToZonedFields(zdt.instant, zdt.timeZone);
  const offsetString = getTimeZoneOffset(zdt.timeZone, zdt.instant, "string");
  const offsetMilliseconds =
    getTimeZoneOffset(zdt.timeZone, zdt.instant, "totalSeconds") * 1000;
  const isDST = isDSTAtInstant(zdt.timeZone, zdt.instant);

  return {
    year: projected.year,
    month: projected.month,
    day: projected.day,
    hour: projected.hour,
    minute: projected.minute,
    second: projected.second,
    millisecond: projected.millisecond,
    offsetString,
    offsetMilliseconds,
    isDST,
    timeZone: zdt.timeZone,
    calendar: zdt.calendar,
  };
}

/**
 * Returns a new ZonedDateTime representing the same instant in a different time zone.
 */
export function withTimeZone(
  zdt: ZonedDateTime,
  targetTimeZone: TimeZoneId,
): ZonedDateTime {
  validateTimeZone(targetTimeZone);
  return zonedDateTime(zdt.instant, targetTimeZone, zdt.calendar);
}

/**
 * Returns a new ZonedDateTime representing the same instant with a different calendar system.
 */
export function withCalendar(
  zdt: ZonedDateTime,
  targetCalendar: CalendarId,
): ZonedDateTime {
  return zonedDateTime(zdt.instant, zdt.timeZone, targetCalendar);
}

/**
 * Adds a duration to a ZonedDateTime following TC39 Temporal rules:
 * - Date units (years, months, weeks, days) preserve wall-clock time across DST transitions.
 * - Time units (hours, minutes, seconds, milliseconds) add exact elapsed duration.
 */
export function addZonedDuration(
  zdt: ZonedDateTime,
  dur: Duration,
  options?: CreateZonedOptions,
): ZonedDateTime {
  const disambiguation = options?.disambiguation ?? "compatible";
  let currentFields = getZonedFields(zdt);

  // 1. Calendar arithmetic in local timezone
  const hasDateUnits =
    (dur.years ?? 0) !== 0 ||
    (dur.months ?? 0) !== 0 ||
    (dur.weeks ?? 0) !== 0 ||
    (dur.days ?? 0) !== 0;

  let baseInstant = zdt.instant;

  if (hasDateUnits) {
    let date = localDate(
      currentFields.year,
      currentFields.month,
      currentFields.day,
    );
    if (dur.years) date = addYears(date, dur.years);
    if (dur.months) date = addMonths(date, dur.months);
    if (dur.weeks) date = addDays(date, dur.weeks * 7);
    if (dur.days) date = addDays(date, dur.days);

    baseInstant = resolveInstantFromLocalFields(
      {
        year: date.year,
        month: date.month,
        day: date.day,
        hour: currentFields.hour,
        minute: currentFields.minute,
        second: currentFields.second,
        millisecond: currentFields.millisecond,
      },
      zdt.timeZone,
      disambiguation,
    );
  }

  // 2. Exact elapsed duration for time units
  const exactMsToAdd =
    (dur.hours ?? 0) * 3600000 +
    (dur.minutes ?? 0) * 60000 +
    (dur.seconds ?? 0) * 1000 +
    (dur.milliseconds ?? 0);

  const finalEpochMs = baseInstant.epochMilliseconds + exactMsToAdd;
  return zonedDateTime(
    instantFromEpochMilliseconds(finalEpochMs),
    zdt.timeZone,
    zdt.calendar,
  );
}

/**
 * Subtracts a duration from a ZonedDateTime.
 */
export function subtractZonedDuration(
  zdt: ZonedDateTime,
  dur: Duration,
  options?: CreateZonedOptions,
): ZonedDateTime {
  const negated: Duration = {
    ...(dur.years !== undefined ? { years: -dur.years } : {}),
    ...(dur.months !== undefined ? { months: -dur.months } : {}),
    ...(dur.weeks !== undefined ? { weeks: -dur.weeks } : {}),
    ...(dur.days !== undefined ? { days: -dur.days } : {}),
    ...(dur.hours !== undefined ? { hours: -dur.hours } : {}),
    ...(dur.minutes !== undefined ? { minutes: -dur.minutes } : {}),
    ...(dur.seconds !== undefined ? { seconds: -dur.seconds } : {}),
    ...(dur.milliseconds !== undefined
      ? { milliseconds: -dur.milliseconds }
      : {}),
  };
  return addZonedDuration(zdt, negated, options);
}

/**
 * Calculates the difference between two ZonedDateTimes in specified units.
 */
export function diffZoned(
  a: ZonedDateTime,
  b: ZonedDateTime,
  unit: "days" | "hours" | "minutes" | "seconds" = "hours",
): number {
  const diffMs = a.instant.epochMilliseconds - b.instant.epochMilliseconds;
  switch (unit) {
    case "days":
      return Math.trunc(diffMs / 86400000);
    case "hours":
      return Math.trunc(diffMs / 3600000);
    case "minutes":
      return Math.trunc(diffMs / 60000);
    case "seconds":
      return Math.trunc(diffMs / 1000);
  }
}

/**
 * Formats a ZonedDateTime with timezone and offset details.
 */
export function formatZonedDateTime(
  zdt: ZonedDateTime,
  patternOrOptions?: string | Readonly<FormatDateOptions>,
): string {
  const defaultPattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX '['VV']'";
  if (typeof patternOrOptions === "string") {
    return formatInTimeZone(zdt.instant, zdt.timeZone, patternOrOptions);
  }
  return formatInTimeZone(
    zdt.instant,
    zdt.timeZone,
    defaultPattern,
    patternOrOptions,
  );
}

/**
 * Converts a ZonedDateTime to a LocalDate representing its date in that timezone.
 */
export function zonedDateTimeToLocalDate(zdt: ZonedDateTime): LocalDate {
  const fields = getZonedFields(zdt);
  return localDate(fields.year, fields.month, fields.day);
}

/**
 * Converts a ZonedDateTime to a LocalTime representing its time in that timezone.
 */
export function zonedDateTimeToLocalTime(zdt: ZonedDateTime): LocalTime {
  const fields = getZonedFields(zdt);
  return localTime(
    fields.hour,
    fields.minute,
    fields.second,
    fields.millisecond,
  );
}

/**
 * Converts a ZonedDateTime to a LocalDateTime in that timezone.
 */
export function zonedDateTimeToLocalDateTime(
  zdt: ZonedDateTime,
): LocalDateTime {
  return localDateTime(
    zonedDateTimeToLocalDate(zdt),
    zonedDateTimeToLocalTime(zdt),
  );
}

/**
 * Extracts the underlying UTC Instant from a ZonedDateTime.
 */
export function zonedDateTimeToInstant(zdt: ZonedDateTime): Instant {
  return zdt.instant;
}
