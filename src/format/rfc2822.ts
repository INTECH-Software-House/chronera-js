import { gregorianFieldsFromAbsoluteDay } from "../core/absolute-day.js";
import { getIsoDayOfWeek } from "../core/iso-week.js";

import type { Instant } from "../public-types.js";

const RFC2822_WEEKDAYS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

const RFC2822_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export interface Rfc2822Options {
  /**
   * If true and offset is 0, renders 'GMT' instead of '+0000' (RFC 7231 / RFC 9110 HTTP-date compliance).
   * Defaults to true.
   */
  readonly useGmt?: boolean;

  /**
   * Whether to include seconds. Defaults to true.
   */
  readonly includeSeconds?: boolean;
}

/**
 * Formats an Instant into an RFC 2822 / RFC 5322 / RFC 7231 compliant date-time string.
 * Example: 'Wed, 02 Sep 2026 14:30:00 GMT' or 'Wed, 02 Sep 2026 14:30:00 +0000'
 */
export function formatRfc2822(
  instant: Instant,
  options: Rfc2822Options = {},
): string {
  const useGmt = options.useGmt ?? true;
  const includeSeconds = options.includeSeconds ?? true;

  const ms = instant.epochMilliseconds;
  const totalSeconds = Math.floor(ms / 1000);
  const absoluteDay = Math.floor(totalSeconds / 86400);

  // Time within day
  let secondOfDay = totalSeconds % 86400;
  if (secondOfDay < 0) {
    secondOfDay += 86400;
  }

  const hour = Math.floor(secondOfDay / 3600);
  const minute = Math.floor((secondOfDay % 3600) / 60);
  const second = secondOfDay % 60;

  const dateFields = gregorianFieldsFromAbsoluteDay(absoluteDay);
  const isoDow = getIsoDayOfWeek(absoluteDay); // 1 = Mon .. 7 = Sun
  const weekdayName = RFC2822_WEEKDAYS[isoDow - 1]!;
  const monthName = RFC2822_MONTHS[dateFields.month - 1]!;

  const dayStr = String(dateFields.day).padStart(2, "0");
  const yearStr = String(dateFields.year).padStart(4, "0");
  const hourStr = String(hour).padStart(2, "0");
  const minStr = String(minute).padStart(2, "0");
  const secStr = String(second).padStart(2, "0");

  const timePart = includeSeconds
    ? `${hourStr}:${minStr}:${secStr}`
    : `${hourStr}:${minStr}`;

  const zonePart = useGmt ? "GMT" : "+0000";

  return `${weekdayName}, ${dayStr} ${monthName} ${yearStr} ${timePart} ${zonePart}`;
}
