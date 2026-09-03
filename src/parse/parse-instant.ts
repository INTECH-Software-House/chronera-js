import { ChroneraError, ChroneraParseError } from "../errors/errors.js";
import { daysInGregorianMonth } from "../core/gregorian-math.js";
import {
  instantFromEpochMilliseconds,
  MAX_EPOCH_MILLISECONDS,
  MIN_EPOCH_MILLISECONDS,
} from "../core/instant.js";

import type { Instant, ParseInstantOptions } from "../public-types.js";

const RFC3339_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|([+-])(\d{2}):(\d{2}))$/;

export function parseInstant(
  input: string,
  options?: Readonly<ParseInstantOptions>,
): Instant {
  if (typeof input !== "string") {
    throw new ChroneraParseError(
      "CHRONERA_PARSE_FAILED",
      `Expected string input; received ${typeof input}.`,
    );
  }

  if (input.length > 4096) {
    throw new ChroneraError(
      "CHRONERA_INPUT_TOO_LONG",
      `Input length ${input.length} exceeds maximum allowed limit of 4096 characters.`,
    );
  }

  // Reject -00:00 specifically
  if (input.endsWith("-00:00")) {
    throw new ChroneraParseError(
      "CHRONERA_PARSE_FAILED",
      "Offset '-00:00' is not accepted in this RFC 3339 profile.",
    );
  }

  const match = RFC3339_REGEX.exec(input);
  if (!match) {
    throw new ChroneraParseError(
      "CHRONERA_PARSE_FAILED",
      `Invalid RFC 3339 timestamp format: "${input}". An explicit offset (Z or ±HH:mm) is required.`,
    );
  }

  const year = Number.parseInt(match[1]!, 10);
  const month = Number.parseInt(match[2]!, 10);
  const day = Number.parseInt(match[3]!, 10);
  const hour = Number.parseInt(match[4]!, 10);
  const minute = Number.parseInt(match[5]!, 10);
  const second = Number.parseInt(match[6]!, 10);
  const fractionStr = match[7]; // e.g. ".1234"
  const tzOffset = match[8]!; // "Z" or "+HH:mm"

  if (year < 1 || year > 9999) {
    throw new ChroneraParseError(
      "CHRONERA_OUT_OF_RANGE",
      `Year ${year} is outside supported range [0001, 9999].`,
    );
  }

  if (month < 1 || month > 12) {
    throw new ChroneraParseError(
      "CHRONERA_INVALID_DATE",
      `Month must be between 1 and 12; received ${month}.`,
    );
  }

  const maxDay = daysInGregorianMonth(year, month);
  if (day < 1 || day > maxDay) {
    throw new ChroneraParseError(
      "CHRONERA_INVALID_DATE",
      `Day ${day} is invalid for month ${month} in year ${year}.`,
    );
  }

  if (hour < 0 || hour > 23) {
    throw new ChroneraParseError(
      "CHRONERA_PARSE_FAILED",
      `Hour must be between 0 and 23; received ${hour}. Hour 24 is rejected.`,
    );
  }

  if (minute < 0 || minute > 59) {
    throw new ChroneraParseError(
      "CHRONERA_PARSE_FAILED",
      `Minute must be between 0 and 59; received ${minute}.`,
    );
  }

  if (second < 0 || second > 59) {
    throw new ChroneraParseError(
      "CHRONERA_PARSE_FAILED",
      `Second must be between 0 and 59; received ${second}. Leap seconds are not supported.`,
    );
  }

  // Parse fraction of second
  let millisecond = 0;
  let carrySeconds = 0;
  if (fractionStr) {
    const rawDigits = fractionStr.slice(1); // strip leading dot
    const mode = options?.excessFractionalSeconds ?? "reject";

    if (rawDigits.length <= 3) {
      millisecond = Number.parseInt(rawDigits.padEnd(3, "0"), 10);
    } else {
      const excess = rawDigits.slice(3);
      const hasExcessPrecision = /[1-9]/.test(excess);

      if (mode === "reject" && hasExcessPrecision) {
        throw new ChroneraParseError(
          "CHRONERA_PARSE_FAILED",
          `Excess fractional second precision beyond milliseconds encountered in "${input}".`,
        );
      }

      if (mode === "truncate" || !hasExcessPrecision) {
        millisecond = Number.parseInt(rawDigits.slice(0, 3), 10);
      } else if (mode === "round") {
        const floatVal = Number.parseFloat(`0.${rawDigits}`) * 1000;
        const rounded = Math.round(floatVal);
        if (rounded >= 1000) {
          carrySeconds = Math.floor(rounded / 1000);
          millisecond = rounded % 1000;
        } else {
          millisecond = rounded;
        }
      }
    }
  }

  // Parse offset
  let offsetMs = 0;
  if (tzOffset !== "Z") {
    const sign = match[9] === "-" ? -1 : 1;
    const offHour = Number.parseInt(match[10]!, 10);
    const offMin = Number.parseInt(match[11]!, 10);

    if (offHour > 23 || offMin > 59) {
      throw new ChroneraParseError(
        "CHRONERA_PARSE_FAILED",
        `Invalid offset in timestamp: "${tzOffset}".`,
      );
    }
    offsetMs = sign * (offHour * 60 + offMin) * 60000;
  }

  // Calculate UTC epoch ms
  const baseUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const totalMs = baseUtcMs + carrySeconds * 1000 + millisecond - offsetMs;

  if (totalMs < MIN_EPOCH_MILLISECONDS || totalMs > MAX_EPOCH_MILLISECONDS) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `Timestamp "${input}" resolves to epoch milliseconds ${totalMs}, outside supported range.`,
    );
  }

  return instantFromEpochMilliseconds(totalMs);
}
