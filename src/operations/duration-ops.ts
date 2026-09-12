import { ChroneraError } from "../errors/errors.js";
import { addDays, addMonths, addYears, getAbsoluteDay } from "./convenience.js";

import type { DateOrCalendarDate, Duration } from "../public-types.js";

// ---------------------------------------------------------------------------
// ISO 8601 Duration Parsing
// ---------------------------------------------------------------------------

/**
 * Parses an ISO 8601 duration string into a `Duration` object.
 * Examples: `'P1Y2M3DT4H5M6.789S'`, `'P1Y'`, `'-P1Y'`, `'P-1Y'`
 */
export function parseDuration(iso: string): Duration {
  if (!iso || typeof iso !== "string") {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Invalid ISO 8601 duration string: ${JSON.stringify(iso)}`,
    );
  }

  let str = iso.trim();
  let sign = 1;

  if (str.startsWith("-")) {
    sign = -1;
    str = str.slice(1);
  } else if (str.startsWith("+")) {
    str = str.slice(1);
  }

  if (!str.startsWith("P")) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Invalid ISO 8601 duration string (must start with 'P'): ${JSON.stringify(iso)}`,
    );
  }

  str = str.slice(1); // remove 'P'

  // Split on 'T' to separate date and time parts
  const tIdx = str.indexOf("T");
  const datePart = tIdx === -1 ? str : str.slice(0, tIdx);
  const timePart = tIdx === -1 ? "" : str.slice(tIdx + 1);

  const result: {
    years?: number;
    months?: number;
    weeks?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
  } = {};

  // Parse date part: [nY][nM][nW][nD]
  // Each segment allows optional leading minus
  const dateRegex = /(-?\d+(?:\.\d+)?)([YMWD])/g;
  let match: RegExpExecArray | null;
  while ((match = dateRegex.exec(datePart)) !== null) {
    const value = parseFloat(match[1]!) * sign;
    const unit = match[2]!;
    switch (unit) {
      case "Y":
        result.years = Math.trunc(value);
        break;
      case "M":
        result.months = Math.trunc(value);
        break;
      case "W":
        result.weeks = Math.trunc(value);
        break;
      case "D":
        result.days = Math.trunc(value);
        break;
    }
  }

  // Parse time part: [nH][nM][n.nS]
  const timeRegex = /(-?\d+(?:\.\d+)?)([HMS])/g;
  while ((match = timeRegex.exec(timePart)) !== null) {
    const value = parseFloat(match[1]!) * sign;
    const unit = match[2]!;
    switch (unit) {
      case "H":
        result.hours = Math.trunc(value);
        break;
      case "M":
        result.minutes = Math.trunc(value);
        break;
      case "S": {
        const seconds = Math.trunc(value);
        const ms =
          Math.round((Math.abs(value) - Math.abs(seconds)) * 1000) *
          (value < 0 ? -1 : 1);
        result.seconds = seconds;
        if (ms !== 0) result.milliseconds = ms;
        break;
      }
    }
  }

  // Validate: if nothing was parsed and string isn't just "P", error
  if (datePart === "" && timePart === "" && Object.keys(result).length === 0) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Invalid ISO 8601 duration string (no components): ${JSON.stringify(iso)}`,
    );
  }

  return result;
}

// ---------------------------------------------------------------------------
// ISO 8601 Duration Serialization
// ---------------------------------------------------------------------------

/**
 * Converts a `Duration` object to an ISO 8601 duration string.
 * Example: `{ years: 1, months: 2, days: 3 }` → `'P1Y2M3D'`
 */
export function durationToISO(dur: Duration): string {
  const years = dur.years ?? 0;
  const months = dur.months ?? 0;
  const weeks = dur.weeks ?? 0;
  const days = dur.days ?? 0;
  const hours = dur.hours ?? 0;
  const minutes = dur.minutes ?? 0;
  const seconds = dur.seconds ?? 0;
  const ms = dur.milliseconds ?? 0;

  let datePart = "P";
  if (years !== 0) datePart += `${years}Y`;
  if (months !== 0) datePart += `${months}M`;
  if (weeks !== 0) datePart += `${weeks}W`;
  if (days !== 0) datePart += `${days}D`;

  let timePart = "";
  if (hours !== 0) timePart += `${hours}H`;
  if (minutes !== 0) timePart += `${minutes}M`;
  if (seconds !== 0 || ms !== 0) {
    if (ms !== 0) {
      const totalSeconds = seconds + ms / 1000;
      // Format fractional seconds: trim trailing zeros
      const formatted = totalSeconds.toFixed(3).replace(/\.?0+$/, "");
      timePart += `${formatted}S`;
    } else {
      timePart += `${seconds}S`;
    }
  }

  const result = timePart ? `${datePart}T${timePart}` : datePart;
  // "P" with nothing is valid for zero duration
  return result;
}

// ---------------------------------------------------------------------------
// Human-readable Duration
// ---------------------------------------------------------------------------

type DurationUnit =
  | "years"
  | "months"
  | "weeks"
  | "days"
  | "hours"
  | "minutes"
  | "seconds"
  | "milliseconds";

const LOCALE_LABELS: Record<string, Record<DurationUnit, [string, string]>> = {
  en: {
    years: ["year", "years"],
    months: ["month", "months"],
    weeks: ["week", "weeks"],
    days: ["day", "days"],
    hours: ["hour", "hours"],
    minutes: ["minute", "minutes"],
    seconds: ["second", "seconds"],
    milliseconds: ["millisecond", "milliseconds"],
  },
  th: {
    years: ["ปี", "ปี"],
    months: ["เดือน", "เดือน"],
    weeks: ["สัปดาห์", "สัปดาห์"],
    days: ["วัน", "วัน"],
    hours: ["ชั่วโมง", "ชั่วโมง"],
    minutes: ["นาที", "นาที"],
    seconds: ["วินาที", "วินาที"],
    milliseconds: ["มิลลิวินาที", "มิลลิวินาที"],
  },
  ja: {
    years: ["年", "年"],
    months: ["ヶ月", "ヶ月"],
    weeks: ["週間", "週間"],
    days: ["日", "日"],
    hours: ["時間", "時間"],
    minutes: ["分", "分"],
    seconds: ["秒", "秒"],
    milliseconds: ["ミリ秒", "ミリ秒"],
  },
  zh: {
    years: ["年", "年"],
    months: ["个月", "个月"],
    weeks: ["周", "周"],
    days: ["天", "天"],
    hours: ["小时", "小时"],
    minutes: ["分钟", "分钟"],
    seconds: ["秒", "秒"],
    milliseconds: ["毫秒", "毫秒"],
  },
  ko: {
    years: ["년", "년"],
    months: ["개월", "개월"],
    weeks: ["주", "주"],
    days: ["일", "일"],
    hours: ["시간", "시간"],
    minutes: ["분", "분"],
    seconds: ["초", "초"],
    milliseconds: ["밀리초", "밀리초"],
  },
  fr: {
    years: ["an", "ans"],
    months: ["mois", "mois"],
    weeks: ["semaine", "semaines"],
    days: ["jour", "jours"],
    hours: ["heure", "heures"],
    minutes: ["minute", "minutes"],
    seconds: ["seconde", "secondes"],
    milliseconds: ["milliseconde", "millisecondes"],
  },
  de: {
    years: ["Jahr", "Jahre"],
    months: ["Monat", "Monate"],
    weeks: ["Woche", "Wochen"],
    days: ["Tag", "Tage"],
    hours: ["Stunde", "Stunden"],
    minutes: ["Minute", "Minuten"],
    seconds: ["Sekunde", "Sekunden"],
    milliseconds: ["Millisekunde", "Millisekunden"],
  },
  ar: {
    years: ["سنة", "سنوات"],
    months: ["شهر", "أشهر"],
    weeks: ["أسبوع", "أسابيع"],
    days: ["يوم", "أيام"],
    hours: ["ساعة", "ساعات"],
    minutes: ["دقيقة", "دقائق"],
    seconds: ["ثانية", "ثوانٍ"],
    milliseconds: ["ميلي ثانية", "ميلي ثانية"],
  },
};

const DURATION_UNITS_ORDER: DurationUnit[] = [
  "years",
  "months",
  "weeks",
  "days",
  "hours",
  "minutes",
  "seconds",
  "milliseconds",
];

const RTF_UNIT_MAP: Record<DurationUnit, Intl.RelativeTimeFormatUnit> = {
  years: "year",
  months: "month",
  weeks: "week",
  days: "day",
  hours: "hour",
  minutes: "minute",
  seconds: "second",
  milliseconds: "second", // fallback
};

/**
 * Returns a human-readable string for the duration in the given locale.
 * Example (en): `{ days: 5, hours: 3, minutes: 30 }` → `'5 days, 3 hours, 30 minutes'`
 */
export function durationToHuman(dur: Duration, locale: string = "en"): string {
  const langKey = (locale.split(/[-_]/)[0] ?? "en").toLowerCase();
  const labels = LOCALE_LABELS[langKey];

  const parts: string[] = [];

  for (const unit of DURATION_UNITS_ORDER) {
    const val = dur[unit];
    if (val === undefined || val === 0) continue;

    const absVal = Math.abs(val);

    if (labels) {
      const [singular, plural] = labels[unit];
      const label = absVal === 1 ? singular : plural;
      // For Japanese / Chinese / Korean / Thai — no space between number and label
      const noSpace = ["ja", "zh", "ko", "th"].includes(langKey);
      parts.push(noSpace ? `${absVal}${label}` : `${absVal} ${label}`);
    } else {
      // Fallback: use Intl.RelativeTimeFormat to get unit labels
      try {
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "always" });
        const rtfUnit = RTF_UNIT_MAP[unit];
        const formatted = rtf.formatToParts(absVal, rtfUnit);
        // Extract just the unit label part
        const unitPart = formatted.find((p) => p.type === "unit");
        const label = unitPart ? unitPart.value : unit;
        parts.push(`${absVal} ${label}`);
      } catch {
        parts.push(`${absVal} ${unit}`);
      }
    }
  }

  return (
    parts.join(", ") ||
    "0 " + (LOCALE_LABELS["en"]?.["seconds"][1] ?? "seconds")
  );
}

// ---------------------------------------------------------------------------
// Duration Arithmetic on Dates
// ---------------------------------------------------------------------------

/**
 * Adds a duration to a date (applies years, months, weeks, days in order).
 * Time fields (hours, minutes, seconds, milliseconds) are ignored for date-only types.
 */
export function addDuration<T extends DateOrCalendarDate>(
  date: T,
  dur: Duration,
): T {
  let result = date;
  if (dur.years) result = addYears(result, dur.years, "constrain");
  if (dur.months) result = addMonths(result, dur.months, "constrain");
  const totalDays = (dur.weeks ?? 0) * 7 + (dur.days ?? 0);
  if (totalDays) result = addDays(result, totalDays);
  return result;
}

/**
 * Subtracts a duration from a date.
 */
export function subtractDuration<T extends DateOrCalendarDate>(
  date: T,
  dur: Duration,
): T {
  return addDuration(date, scaleDuration(dur, -1));
}

// ---------------------------------------------------------------------------
// Diff as Duration
// ---------------------------------------------------------------------------

/**
 * Computes the duration between two dates. Always returns positive field values.
 * Returns `{ years, months, days }` representing the full decomposed diff.
 */
export function diffAsDuration(
  start: DateOrCalendarDate,
  end: DateOrCalendarDate,
): Duration {
  const startAbs = getAbsoluteDay(start);
  const endAbs = getAbsoluteDay(end);

  // Ensure start <= end for computation
  let s = startAbs <= endAbs ? start : end;
  let e = startAbs <= endAbs ? end : start;

  // Count years
  let years = 0;
  let cursor = s;
  while (true) {
    const next = addYears(cursor, 1, "constrain");
    if (getAbsoluteDay(next) > getAbsoluteDay(e)) break;
    cursor = next;
    years++;
  }

  // Count months
  let months = 0;
  while (true) {
    const next = addMonths(cursor, 1, "constrain");
    if (getAbsoluteDay(next) > getAbsoluteDay(e)) break;
    cursor = next;
    months++;
  }

  // Remaining days
  const days = getAbsoluteDay(e) - getAbsoluteDay(cursor);

  return {
    ...(years !== 0 ? { years } : {}),
    ...(months !== 0 ? { months } : {}),
    ...(days !== 0 ? { days } : {}),
  };
}

// ---------------------------------------------------------------------------
// Duration Utilities
// ---------------------------------------------------------------------------

/**
 * Sums two durations by adding corresponding fields.
 */
export function addDurations(a: Duration, b: Duration): Duration {
  const result: Record<string, number> = {};
  const fields: (keyof Duration)[] = [
    "years",
    "months",
    "weeks",
    "days",
    "hours",
    "minutes",
    "seconds",
    "milliseconds",
  ];
  for (const f of fields) {
    const sum = (a[f] ?? 0) + (b[f] ?? 0);
    if (sum !== 0) result[f] = sum;
  }
  return result as Duration;
}

/**
 * Scales a duration by a numeric factor. Non-integer results are truncated.
 */
export function scaleDuration(dur: Duration, factor: number): Duration {
  const result: Record<string, number> = {};
  const fields: (keyof Duration)[] = [
    "years",
    "months",
    "weeks",
    "days",
    "hours",
    "minutes",
    "seconds",
    "milliseconds",
  ];
  for (const f of fields) {
    const val = dur[f];
    if (val !== undefined) {
      const scaled = Math.trunc(val * factor);
      if (scaled !== 0) result[f] = scaled;
    }
  }
  return result as Duration;
}

/**
 * Returns the approximate total number of days for a duration.
 * Uses approximations: 1 year = 365 days, 1 month = 30 days.
 */
export function durationTotalDays(dur: Duration): number {
  return (
    (dur.years ?? 0) * 365 +
    (dur.months ?? 0) * 30 +
    (dur.weeks ?? 0) * 7 +
    (dur.days ?? 0)
  );
}
