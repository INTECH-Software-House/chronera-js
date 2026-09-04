import {
  absoluteDayFromGregorianFields,
  gregorianFieldsFromAbsoluteDay,
} from "../core/absolute-day.js";
import { ChroneraError } from "../errors/errors.js";

import type {
  Instant,
  LocalDate,
  LocalDateTime,
  TimeOrDateTimeOrInstant,
} from "../public-types.js";

/**
 * Returns the start of the day (00:00:00.000) as a LocalDateTime.
 * Accepts either a LocalDate or an existing LocalDateTime.
 */
export function startOfDay(input: LocalDate | LocalDateTime): LocalDateTime {
  const date = input.kind === "local-date-time" ? input.date : input;
  return {
    kind: "local-date-time",
    date,
    time: {
      kind: "local-time",
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    },
  };
}

/**
 * Returns the end of the day (23:59:59.999) as a LocalDateTime.
 * Accepts either a LocalDate or an existing LocalDateTime.
 */
export function endOfDay(input: LocalDate | LocalDateTime): LocalDateTime {
  const date = input.kind === "local-date-time" ? input.date : input;
  return {
    kind: "local-date-time",
    date,
    time: {
      kind: "local-time",
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    },
  };
}

/**
 * Returns true if the specified Instant, Date, or epoch millisecond timestamp is in the past.
 */
export function isPast(target: Instant | Date | number): boolean {
  const epochMs =
    typeof target === "number"
      ? target
      : target instanceof Date
        ? target.getTime()
        : target.epochMilliseconds;
  return epochMs < Date.now();
}

/**
 * Returns true if the specified Instant, Date, or epoch millisecond timestamp is in the future.
 */
export function isFuture(target: Instant | Date | number): boolean {
  const epochMs =
    typeof target === "number"
      ? target
      : target instanceof Date
        ? target.getTime()
        : target.epochMilliseconds;
  return epochMs > Date.now();
}

/**
 * Helper to add millisecond offset to LocalTime, LocalDateTime, or Instant.
 */
function addMillisecondsInternal<T extends TimeOrDateTimeOrInstant>(
  target: T,
  deltaMs: number,
): T {
  if (target.kind === "instant") {
    return {
      kind: "instant",
      epochMilliseconds: target.epochMilliseconds + deltaMs,
    } as T;
  }

  if (target.kind === "local-time") {
    const totalMs =
      target.hour * 3_600_000 +
      target.minute * 60_000 +
      target.second * 1_000 +
      target.millisecond +
      deltaMs;
    const dayMs = 86_400_000;
    const normalizedMs = ((totalMs % dayMs) + dayMs) % dayMs;

    const hour = Math.floor(normalizedMs / 3_600_000);
    const minute = Math.floor((normalizedMs % 3_600_000) / 60_000);
    const second = Math.floor((normalizedMs % 60_000) / 1_000);
    const millisecond = normalizedMs % 1_000;

    return {
      kind: "local-time",
      hour,
      minute,
      second,
      millisecond,
    } as T;
  }

  if (target.kind === "local-date-time") {
    const currentAbsDay = absoluteDayFromGregorianFields(
      target.date.year,
      target.date.month,
      target.date.day,
    );
    const currentDayMs =
      target.time.hour * 3_600_000 +
      target.time.minute * 60_000 +
      target.time.second * 1_000 +
      target.time.millisecond;

    const totalMs = currentDayMs + deltaMs;
    const dayShift = Math.floor(totalMs / 86_400_000);
    const timeMs = ((totalMs % 86_400_000) + 86_400_000) % 86_400_000;

    const newAbsDay = currentAbsDay + dayShift;
    const newDateFields = gregorianFieldsFromAbsoluteDay(newAbsDay);

    const hour = Math.floor(timeMs / 3_600_000);
    const minute = Math.floor((timeMs % 3_600_000) / 60_000);
    const second = Math.floor((timeMs % 60_000) / 1_000);
    const millisecond = timeMs % 1_000;

    return {
      kind: "local-date-time",
      date: {
        kind: "local-date",
        year: newDateFields.year,
        month: newDateFields.month,
        day: newDateFields.day,
      },
      time: {
        kind: "local-time",
        hour,
        minute,
        second,
        millisecond,
      },
    } as T;
  }

  throw new ChroneraError(
    "CHRONERA_INVALID_TIME",
    "Invalid input for time arithmetic.",
  );
}

/**
 * Adds hours to a LocalTime, LocalDateTime, or Instant.
 * Accurately shifts calendar date when LocalDateTime rolls past midnight.
 */
export function addHours<T extends TimeOrDateTimeOrInstant>(
  target: T,
  amount: number,
): T {
  return addMillisecondsInternal(target, amount * 3_600_000);
}

/**
 * Subtracts hours from a LocalTime, LocalDateTime, or Instant.
 */
export function subtractHours<T extends TimeOrDateTimeOrInstant>(
  target: T,
  amount: number,
): T {
  return addHours(target, -amount);
}

/**
 * Adds minutes to a LocalTime, LocalDateTime, or Instant.
 */
export function addMinutes<T extends TimeOrDateTimeOrInstant>(
  target: T,
  amount: number,
): T {
  return addMillisecondsInternal(target, amount * 60_000);
}

/**
 * Subtracts minutes from a LocalTime, LocalDateTime, or Instant.
 */
export function subtractMinutes<T extends TimeOrDateTimeOrInstant>(
  target: T,
  amount: number,
): T {
  return addMinutes(target, -amount);
}

/**
 * Adds seconds to a LocalTime, LocalDateTime, or Instant.
 */
export function addSeconds<T extends TimeOrDateTimeOrInstant>(
  target: T,
  amount: number,
): T {
  return addMillisecondsInternal(target, amount * 1_000);
}

/**
 * Subtracts seconds from a LocalTime, LocalDateTime, or Instant.
 */
export function subtractSeconds<T extends TimeOrDateTimeOrInstant>(
  target: T,
  amount: number,
): T {
  return addSeconds(target, -amount);
}
