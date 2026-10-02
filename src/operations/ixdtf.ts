import { ChroneraError, ChroneraParseError } from "../errors/errors.js";
import { instantFromEpochMilliseconds } from "../core/instant.js";
import { zonedDateTime } from "../core/zoned-date-time.js";
import { createZonedDateTime, getZonedFields } from "./zoned-operations.js";
import { validateTimeZone } from "../runtime/timezone.js";

import type {
  CalendarId,
  DisambiguationOption,
  TimeZoneId,
  ZonedDateTime,
} from "../public-types.js";

export interface ParseIXDTFOptions {
  /**
   * Disambiguation option when resolving local wall-clock without offset during DST transitions.
   * Defaults to "compatible".
   */
  readonly disambiguation?: DisambiguationOption;
}

export interface FormatIXDTFOptions {
  /**
   * Whether to include the calendar annotation tag [u-ca=...].
   * Defaults to true if the calendar is not 'gregory' or 'iso8601'.
   */
  readonly includeCalendar?: boolean;

  /**
   * Whether to mark the timezone annotation as critical ([!TimeZone_Id]).
   * Defaults to false.
   */
  readonly criticalTimezone?: boolean;

  /**
   * Number of fractional second digits (0 to 3).
   * Defaults to 3 if milliseconds > 0, otherwise 0.
   */
  readonly fractionalDigits?: 0 | 1 | 2 | 3;
}

/**
 * Regex matching RFC 9557 IXDTF strings:
 * Group 1: Year (YYYY)
 * Group 2: Month (MM)
 * Group 3: Day (DD)
 * Group 4: Hour (HH)
 * Group 5: Minute (mm)
 * Group 6: Second (ss, optional)
 * Group 7: Fraction (.sss, optional)
 * Group 8: Offset (Z, or [+-]HH:mm, optional)
 * Group 9: Bracketed annotations ([...][...])
 */
const IXDTF_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}(?::?\d{2}(?::?\d{2})?)?)?((?:\[!?[^\]]+\])+)?$/i;

/**
 * Returns true if the string appears to be an RFC 9557 IXDTF string with bracketed annotations.
 */
export function isIXDTF(input: string): boolean {
  if (typeof input !== "string" || !input.includes("[")) {
    return false;
  }
  return IXDTF_REGEX.test(input.trim());
}

/**
 * Parses an RFC 9557 (IXDTF) extended ISO 8601 date-time string with time zone and calendar annotations.
 *
 * @example
 * ```ts
 * const zdt = parseIXDTF("2026-10-03T01:13:43+07:00[Asia/Bangkok][u-ca=buddhist]");
 * console.log(zdt.timeZone); // "Asia/Bangkok"
 * console.log(zdt.calendar); // "buddhist"
 * ```
 */
export function parseIXDTF(
  input: string,
  options?: ParseIXDTFOptions,
): ZonedDateTime {
  if (typeof input !== "string") {
    throw new ChroneraParseError(
      "CHRONERA_PARSE_FAILED",
      `Expected string input; received ${typeof input}.`,
    );
  }

  const trimmed = input.trim();
  const match = IXDTF_REGEX.exec(trimmed);

  if (!match) {
    throw new ChroneraParseError(
      "CHRONERA_PARSE_FAILED",
      `Invalid RFC 9557 (IXDTF) format: "${input}". Expected format YYYY-MM-DDTHH:mm:ss[±HH:mm][TimeZone][u-ca=calendar].`,
    );
  }

  const year = Number.parseInt(match[1]!, 10);
  const month = Number.parseInt(match[2]!, 10);
  const day = Number.parseInt(match[3]!, 10);
  const hour = Number.parseInt(match[4]!, 10);
  const minute = Number.parseInt(match[5]!, 10);
  const second = match[6] ? Number.parseInt(match[6], 10) : 0;

  // Fraction up to millisecond precision
  let millisecond = 0;
  if (match[7]) {
    const fracStr = (match[7] + "000").slice(0, 3);
    millisecond = Number.parseInt(fracStr, 10);
  }

  const offsetRaw = match[8];
  const annotationsRaw = match[9];

  if (!annotationsRaw) {
    throw new ChroneraParseError(
      "CHRONERA_PARSE_FAILED",
      `Invalid RFC 9557 format: "${input}". Must contain at least one bracketed annotation (e.g. [Asia/Bangkok]).`,
    );
  }

  let timeZoneId: TimeZoneId | undefined;
  let calendarId: CalendarId = "gregory";

  // Parse bracketed annotations: e.g. [Asia/Bangkok][u-ca=buddhist][!key=val]
  const tagMatches = annotationsRaw.matchAll(/\[(!?)([^\]]+)\]/g);
  for (const tagMatch of tagMatches) {
    const isCritical = tagMatch[1] === "!";
    const content = tagMatch[2]!;

    if (content.startsWith("u-ca=")) {
      const cal = content.slice(5).toLowerCase();
      calendarId = cal as CalendarId;
    } else if (content.includes("=")) {
      // Key-value annotations: if marked critical and unrecognized, RFC 9557 requires rejection
      if (isCritical) {
        throw new ChroneraParseError(
          "CHRONERA_PARSE_FAILED",
          `Unsupported critical annotation: "[!${content}]".`,
        );
      }
    } else {
      // Time Zone Identifier annotation (e.g. "Asia/Bangkok" or "UTC" or "+07:00")
      timeZoneId = content;
    }
  }

  // Validate or resolve timezone
  let resolvedTz: TimeZoneId;
  if (timeZoneId) {
    validateTimeZone(timeZoneId);
    resolvedTz = timeZoneId;
  } else if (offsetRaw) {
    if (offsetRaw.toUpperCase() === "Z") {
      resolvedTz = "UTC";
    } else {
      resolvedTz = offsetRaw;
    }
  } else {
    throw new ChroneraError(
      "CHRONERA_INCOMPATIBLE_OPTION",
      `RFC 9557 string "${input}" must contain either an offset or a bracketed time zone annotation.`,
    );
  }

  // Compute Instant
  if (offsetRaw) {
    let offsetMs = 0;
    if (offsetRaw.toUpperCase() !== "Z") {
      const sign = offsetRaw[0] === "-" ? -1 : 1;
      const cleanOffset = offsetRaw.slice(1).replace(":", "");
      const offH = Number.parseInt(cleanOffset.slice(0, 2), 10);
      const offM =
        cleanOffset.length >= 4
          ? Number.parseInt(cleanOffset.slice(2, 4), 10)
          : 0;
      const offS =
        cleanOffset.length >= 6
          ? Number.parseInt(cleanOffset.slice(4, 6), 10)
          : 0;
      offsetMs = sign * ((offH * 60 + offM) * 60 + offS) * 1000;
    }

    const utcEpoch =
      Date.UTC(year, month - 1, day, hour, minute, second, millisecond) -
      offsetMs;
    const inst = instantFromEpochMilliseconds(utcEpoch);
    return zonedDateTime(inst, resolvedTz, calendarId);
  }

  // Local wall-clock without explicit offset -> resolve via createZonedDateTime
  return createZonedDateTime(
    {
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
    },
    resolvedTz,
    {
      disambiguation: options?.disambiguation ?? "compatible",
      calendar: calendarId,
    },
  );
}

/**
 * Formats a ZonedDateTime into an RFC 9557 (IXDTF) compliant string.
 *
 * @example
 * ```ts
 * const str = formatIXDTF(zdt);
 * // "2026-10-03T01:13:43+07:00[Asia/Bangkok][u-ca=buddhist]"
 * ```
 */
export function formatIXDTF(
  zdt: ZonedDateTime,
  options?: FormatIXDTFOptions,
): string {
  if (!zdt || zdt.kind !== "zoned-date-time") {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      "Expected a valid ZonedDateTime object.",
    );
  }

  const fields = getZonedFields(zdt);
  const y = String(fields.year).padStart(4, "0");
  const m = String(fields.month).padStart(2, "0");
  const d = String(fields.day).padStart(2, "0");
  const h = String(fields.hour).padStart(2, "0");
  const min = String(fields.minute).padStart(2, "0");
  const s = String(fields.second).padStart(2, "0");

  let frac = "";
  const fracDigits =
    options?.fractionalDigits !== undefined
      ? options.fractionalDigits
      : fields.millisecond > 0
        ? 3
        : 0;

  if (fracDigits > 0) {
    const msStr = String(fields.millisecond).padStart(3, "0");
    frac = `.${msStr.slice(0, fracDigits)}`;
  }

  const offset = fields.offsetString;
  const critical = options?.criticalTimezone ? "!" : "";
  const tzAnnotation = `[${critical}${zdt.timeZone}]`;

  const includeCal =
    options?.includeCalendar !== undefined
      ? options.includeCalendar
      : zdt.calendar !== "gregory" && zdt.calendar !== "iso8601";

  const calAnnotation = includeCal ? `[u-ca=${zdt.calendar}]` : "";

  return `${y}-${m}-${d}T${h}:${min}:${s}${frac}${offset}${tzAnnotation}${calAnnotation}`;
}
