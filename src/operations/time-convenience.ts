import type { Instant, LocalDate, LocalDateTime } from "../public-types.js";

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
