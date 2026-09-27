import { ChroneraError } from "../errors/errors.js";
import type {
  CalendarId,
  Instant,
  TimeZoneId,
  ZonedDateTime,
} from "../public-types.js";

/**
 * Creates an immutable ZonedDateTime domain value representing an Instant
 * bound to an IANA time zone and calendar system.
 *
 * Conforms to TC39 Temporal.ZonedDateTime concept.
 *
 * @param instant - The underlying UTC Instant
 * @param timeZone - The canonical IANA time zone identifier (e.g. "Asia/Bangkok", "America/New_York")
 * @param calendar - The calendar system identifier (defaults to "gregory")
 * @returns Frozen ZonedDateTime instance
 */
export function zonedDateTime(
  instant: Instant,
  timeZone: TimeZoneId,
  calendar: CalendarId = "gregory",
): ZonedDateTime {
  if (
    !instant ||
    typeof instant !== "object" ||
    instant.kind !== "instant" ||
    typeof instant.epochMilliseconds !== "number" ||
    !Number.isFinite(instant.epochMilliseconds)
  ) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      "Expected a valid Instant object with finite epochMilliseconds.",
    );
  }

  if (typeof timeZone !== "string" || timeZone.trim().length === 0) {
    throw new ChroneraError(
      "CHRONERA_INVALID_TIME_ZONE",
      "Expected a non-empty string for timeZone.",
    );
  }

  return Object.freeze({
    kind: "zoned-date-time",
    instant,
    timeZone,
    calendar,
  });
}
