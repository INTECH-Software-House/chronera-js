import { ChroneraError } from "../errors/errors.js";

import type { Instant, TimeZoneId } from "../public-types.js";

const DISALLOWED_TIMEZONE_ABBREVIATIONS = new Set([
  "EST",
  "EDT",
  "CST",
  "CDT",
  "MST",
  "MDT",
  "PST",
  "PDT",
  "IST",
  "WET",
  "CET",
  "EET",
  "BST",
]);

export function validateTimeZone(
  timeZone: unknown,
): asserts timeZone is TimeZoneId {
  if (typeof timeZone !== "string" || timeZone.trim().length === 0) {
    throw new ChroneraError(
      "CHRONERA_INVALID_TIME_ZONE",
      `Invalid time zone identifier: ${String(timeZone)}.`,
    );
  }

  const trimmed = timeZone.trim();
  if (
    DISALLOWED_TIMEZONE_ABBREVIATIONS.has(trimmed) ||
    /^GMT[+-]\d+$/i.test(trimmed) ||
    /^[+-]\d{2}(:?\d{2})?$/.test(trimmed)
  ) {
    throw new ChroneraError(
      "CHRONERA_INVALID_TIME_ZONE",
      `Time zone identifier "${trimmed}" is not a valid canonical IANA time zone. Fixed offsets and abbreviations are not allowed.`,
    );
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: trimmed });
  } catch (err) {
    throw new ChroneraError(
      "CHRONERA_INVALID_TIME_ZONE",
      `Unsupported or invalid IANA time zone identifier: "${trimmed}".`,
      { cause: err },
    );
  }
}

export interface ProjectedZonedFields {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  era?: string;
  weekday?: number; // 1 = Mon, 7 = Sun
}

export function projectInstantToZonedFields(
  instant: Instant,
  timeZone: TimeZoneId,
): ProjectedZonedFields {
  validateTimeZone(timeZone);

  const date = new Date(instant.epochMilliseconds);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    calendar: "gregory",
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    era: "short",
    weekday: "narrow",
  });

  const parts = formatter.formatToParts(date);
  let year = 0;
  let month = 0;
  let day = 0;
  let hour = 0;
  let minute = 0;
  let second = 0;
  let era: string | undefined;

  for (const part of parts) {
    switch (part.type) {
      case "year":
        year = Number.parseInt(part.value, 10);
        break;
      case "month":
        month = Number.parseInt(part.value, 10);
        break;
      case "day":
        day = Number.parseInt(part.value, 10);
        break;
      case "hour":
        hour = Number.parseInt(part.value, 10);
        break;
      case "minute":
        minute = Number.parseInt(part.value, 10);
        break;
      case "second":
        second = Number.parseInt(part.value, 10);
        break;
      case "era":
        era = part.value;
        break;
    }
  }

  const ms = ((instant.epochMilliseconds % 1000) + 1000) % 1000;

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    millisecond: ms,
    ...(era !== undefined ? { era } : {}),
  };
}
