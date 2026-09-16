import { ChroneraError } from "../errors/errors.js";
import { instantFromEpochMilliseconds } from "../core/instant.js";
import type { Instant, LocalDate } from "../public-types.js";

const MONTH_NAMES: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

const DOW_NAMES: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

export interface CronFields {
  readonly minutes: readonly number[];
  readonly hours: readonly number[];
  readonly daysOfMonth: readonly number[];
  readonly months: readonly number[];
  readonly daysOfWeek: readonly number[];
  readonly domRestricted: boolean;
  readonly dowRestricted: boolean;
}

export interface CronJob {
  readonly expression: string;
  readonly fields: CronFields;
  next(from?: Date | Instant | LocalDate): Instant;
  nextN(from: Date | Instant | LocalDate, n: number): Instant[];
  prev(from?: Date | Instant | LocalDate): Instant;
  matches(date: Date | Instant | LocalDate): boolean;
  toHuman(locale?: string): string;
}

function parseCronSubfield(
  part: string,
  min: number,
  max: number,
  nameMap?: Record<string, number>,
): number[] {
  const values = new Set<number>();

  for (const item of part.split(",")) {
    const trimmed = item.trim().toUpperCase();
    if (!trimmed) {
      throw new ChroneraError(
        "CHRONERA_INVALID_DATE",
        `Empty cron subfield in "${part}"`,
      );
    }

    if (trimmed === "*") {
      for (let i = min; i <= max; i++) values.add(i);
      continue;
    }

    const stepMatch = trimmed.match(
      /^(\*|[0-9A-Z]+-[0-9A-Z]+|[0-9A-Z]+)\/(\d+)$/,
    );
    if (stepMatch) {
      const base = stepMatch[1]!;
      const step = parseInt(stepMatch[2]!, 10);
      if (step <= 0) {
        throw new ChroneraError(
          "CHRONERA_INVALID_DATE",
          `Invalid cron step: ${step}`,
        );
      }

      let start = min;
      let end = max;
      if (base !== "*") {
        if (base.includes("-")) {
          const [rStart, rEnd] = parseRange(base, min, max, nameMap);
          start = rStart;
          end = rEnd;
        } else {
          start = resolveValue(base, min, max, nameMap);
        }
      }
      for (let i = start; i <= end; i += step) {
        values.add(i);
      }
      continue;
    }

    if (trimmed.includes("-")) {
      const [start, end] = parseRange(trimmed, min, max, nameMap);
      for (let i = start; i <= end; i++) {
        values.add(i);
      }
      continue;
    }

    const val = resolveValue(trimmed, min, max, nameMap);
    values.add(val);
  }

  const sorted = Array.from(values).sort((a, b) => a - b);
  if (sorted.length === 0) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `No valid values for field "${part}"`,
    );
  }
  return sorted;
}

function resolveValue(
  valStr: string,
  min: number,
  max: number,
  nameMap?: Record<string, number>,
): number {
  if (nameMap && valStr in nameMap) {
    return nameMap[valStr]!;
  }
  const n = parseInt(valStr, 10);
  if (Number.isNaN(n)) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Invalid cron token: "${valStr}"`,
    );
  }
  if (n === 7 && max === 6 && min === 0) {
    return 0; // 7 represents Sunday in standard cron
  }
  if (n < min || n > max) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Cron value ${n} out of range [${min}, ${max}]`,
    );
  }
  return n;
}

function parseRange(
  rangeStr: string,
  min: number,
  max: number,
  nameMap?: Record<string, number>,
): [number, number] {
  const parts = rangeStr.split("-");
  if (parts.length !== 2) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Invalid range: "${rangeStr}"`,
    );
  }
  const start = resolveValue(parts[0]!.trim(), min, max, nameMap);
  const end = resolveValue(parts[1]!.trim(), min, max, nameMap);
  if (start > end) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Range start ${start} greater than end ${end}`,
    );
  }
  return [start, end];
}

function toJsDate(date?: Date | Instant | LocalDate): Date {
  if (!date) return new Date();
  if (date instanceof Date) return new Date(date.getTime());
  if ("epochMilliseconds" in date) return new Date(date.epochMilliseconds);
  if ("year" in date && "month" in date && "day" in date) {
    return new Date(Date.UTC(date.year, date.month - 1, date.day, 0, 0, 0, 0));
  }
  return new Date();
}

export function parseCron(expression: string): CronJob {
  if (typeof expression !== "string") {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      "Cron expression must be a string",
    );
  }

  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Expected 5 fields in cron expression (minute hour day-of-month month day-of-week), got ${parts.length}: "${expression}"`,
    );
  }

  const [minStr, hourStr, domStr, monthStr, dowStr] = parts as [
    string,
    string,
    string,
    string,
    string,
  ];

  const minutes = parseCronSubfield(minStr, 0, 59);
  const hours = parseCronSubfield(hourStr, 0, 23);
  const daysOfMonth = parseCronSubfield(domStr, 1, 31);
  const months = parseCronSubfield(monthStr, 1, 12, MONTH_NAMES);
  const daysOfWeek = parseCronSubfield(dowStr, 0, 6, DOW_NAMES);

  const domRestricted = domStr !== "*";
  const dowRestricted = dowStr !== "*";

  const fields: CronFields = {
    minutes,
    hours,
    daysOfMonth,
    months,
    daysOfWeek,
    domRestricted,
    dowRestricted,
  };

  const minSet = new Set(minutes);
  const hourSet = new Set(hours);
  const domSet = new Set(daysOfMonth);
  const monthSet = new Set(months);
  const dowSet = new Set(daysOfWeek);

  function matchesComponents(
    min: number,
    hour: number,
    day: number,
    month: number,
    dow: number,
  ): boolean {
    if (!minSet.has(min)) return false;
    if (!hourSet.has(hour)) return false;
    if (!monthSet.has(month)) return false;

    if (domRestricted && dowRestricted) {
      return domSet.has(day) || dowSet.has(dow);
    }
    if (domRestricted) {
      return domSet.has(day);
    }
    if (dowRestricted) {
      return dowSet.has(dow);
    }
    return true;
  }

  function matches(date: Date | Instant | LocalDate): boolean {
    const d = toJsDate(date);
    return matchesComponents(
      d.getUTCMinutes(),
      d.getUTCHours(),
      d.getUTCDate(),
      d.getUTCMonth() + 1,
      d.getUTCDay(),
    );
  }

  function next(from?: Date | Instant | LocalDate): Instant {
    const d = toJsDate(from);
    // Start at next whole minute
    d.setUTCSeconds(0, 0);
    d.setUTCMinutes(d.getUTCMinutes() + 1);

    const maxMinutes = 5 * 365 * 24 * 60; // 5 years cap
    for (let count = 0; count < maxMinutes; count++) {
      const month = d.getUTCMonth() + 1;
      if (!monthSet.has(month)) {
        // Skip to start of next month
        d.setUTCMonth(d.getUTCMonth() + 1, 1);
        d.setUTCHours(0, 0, 0, 0);
        continue;
      }

      const day = d.getUTCDate();
      const dow = d.getUTCDay();
      const dayMatches =
        domRestricted && dowRestricted
          ? domSet.has(day) || dowSet.has(dow)
          : domRestricted
            ? domSet.has(day)
            : dowRestricted
              ? dowSet.has(dow)
              : true;

      if (!dayMatches) {
        // Advance to next day at 00:00
        d.setUTCDate(d.getUTCDate() + 1);
        d.setUTCHours(0, 0, 0, 0);
        continue;
      }

      const hour = d.getUTCHours();
      if (!hourSet.has(hour)) {
        // Advance to next hour at :00
        d.setUTCHours(d.getUTCHours() + 1, 0, 0, 0);
        continue;
      }

      const min = d.getUTCMinutes();
      if (minSet.has(min)) {
        return instantFromEpochMilliseconds(d.getTime());
      }
      d.setUTCMinutes(d.getUTCMinutes() + 1);
    }

    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `No matching cron run found within 5 years for expression: "${expression}"`,
    );
  }

  function nextN(from: Date | Instant | LocalDate, n: number): Instant[] {
    if (n <= 0) return [];
    const results: Instant[] = [];
    let current = from;
    for (let i = 0; i < n; i++) {
      const run = next(current);
      results.push(run);
      current = run;
    }
    return results;
  }

  function prev(from?: Date | Instant | LocalDate): Instant {
    const d = toJsDate(from);
    d.setUTCSeconds(0, 0);
    d.setUTCMinutes(d.getUTCMinutes() - 1);

    const maxMinutes = 5 * 365 * 24 * 60;
    for (let count = 0; count < maxMinutes; count++) {
      const month = d.getUTCMonth() + 1;
      const day = d.getUTCDate();
      const dow = d.getUTCDay();
      const hour = d.getUTCHours();
      const min = d.getUTCMinutes();

      if (matchesComponents(min, hour, day, month, dow)) {
        return instantFromEpochMilliseconds(d.getTime());
      }
      d.setUTCMinutes(d.getUTCMinutes() - 1);
    }

    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `No previous cron run found within 5 years for expression: "${expression}"`,
    );
  }

  function toHuman(locale = "en"): string {
    return cronToHuman(expression, locale);
  }

  return {
    expression,
    fields,
    next,
    nextN,
    prev,
    matches,
    toHuman,
  };
}

export function isCronMatch(
  expression: string | CronJob,
  date?: Date | Instant | LocalDate,
): boolean {
  const job =
    typeof expression === "string" ? parseCron(expression) : expression;
  return job.matches(date ?? new Date());
}

export function cronNextRun(
  expression: string | CronJob,
  from?: Date | Instant | LocalDate,
): Instant {
  const job =
    typeof expression === "string" ? parseCron(expression) : expression;
  return job.next(from);
}

export function cronNextN(
  expression: string | CronJob,
  from: Date | Instant | LocalDate,
  n: number,
): Instant[] {
  const job =
    typeof expression === "string" ? parseCron(expression) : expression;
  return job.nextN(from, n);
}

export function cronPrevRun(
  expression: string | CronJob,
  from?: Date | Instant | LocalDate,
): Instant {
  const job =
    typeof expression === "string" ? parseCron(expression) : expression;
  return job.prev(from);
}

const THAI_DAYS = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];
const ENGLISH_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function cronToHuman(
  expression: string | CronJob,
  locale = "en",
): string {
  const expr =
    typeof expression === "string" ? expression.trim() : expression.expression;
  const isThai = locale.toLowerCase().startsWith("th");
  const parts = expr.split(/\s+/);
  if (parts.length !== 5) return expr;

  const [min, hour, dom, month, dow] = parts as [
    string,
    string,
    string,
    string,
    string,
  ];

  // Pattern: * * * * *
  if (
    min === "*" &&
    hour === "*" &&
    dom === "*" &&
    month === "*" &&
    dow === "*"
  ) {
    return isThai ? "ทุกนาที" : "Every minute";
  }

  // Pattern: */N * * * *
  if (
    min.startsWith("*/") &&
    hour === "*" &&
    dom === "*" &&
    month === "*" &&
    dow === "*"
  ) {
    const step = min.slice(2);
    return isThai ? `ทุกๆ ${step} นาที` : `Every ${step} minutes`;
  }

  // Pattern: 0 * * * *
  if (
    min === "0" &&
    hour === "*" &&
    dom === "*" &&
    month === "*" &&
    dow === "*"
  ) {
    return isThai ? "ทุกชั่วโมง" : "Every hour";
  }

  // Pattern: 0 */N * * *
  if (
    min === "0" &&
    hour.startsWith("*/") &&
    dom === "*" &&
    month === "*" &&
    dow === "*"
  ) {
    const step = hour.slice(2);
    return isThai ? `ทุกๆ ${step} ชั่วโมง` : `Every ${step} hours`;
  }

  // Time formatting helper
  const formatTime = (h: string, m: string): string => {
    const hh = h.padStart(2, "0");
    const mm = m.padStart(2, "0");
    return isThai ? `${hh}:${mm} น.` : `${hh}:${mm}`;
  };

  // Pattern: M H * * 1-5 (Weekdays)
  if (
    !min.includes("*") &&
    !min.includes("/") &&
    !hour.includes("*") &&
    !hour.includes("/") &&
    dom === "*" &&
    month === "*" &&
    (dow === "1-5" || dow === "MON-FRI")
  ) {
    const time = formatTime(hour, min);
    return isThai
      ? `ทุกวันจันทร์ถึงศุกร์ เวลา ${time}`
      : `At ${time}, Monday through Friday`;
  }

  // Pattern: M H * * 0,6 or 6,0 (Weekends)
  if (
    !min.includes("*") &&
    !hour.includes("*") &&
    dom === "*" &&
    month === "*" &&
    (dow === "0,6" || dow === "6,0" || dow === "SAT,SUN" || dow === "SUN,SAT")
  ) {
    const time = formatTime(hour, min);
    return isThai
      ? `ทุกวันเสาร์และอาทิตย์ เวลา ${time}`
      : `At ${time}, only on Saturday and Sunday`;
  }

  // Pattern: M H * * DOW (Single day of week)
  if (
    !min.includes("*") &&
    !hour.includes("*") &&
    dom === "*" &&
    month === "*" &&
    /^[0-7]$/.test(dow)
  ) {
    const dayIdx = parseInt(dow, 10) % 7;
    const time = formatTime(hour, min);
    return isThai
      ? `ทุกวัน${THAI_DAYS[dayIdx]} เวลา ${time}`
      : `At ${time}, only on ${ENGLISH_DAYS[dayIdx]}`;
  }

  // Pattern: M H * * * (Daily)
  if (
    !min.includes("*") &&
    !hour.includes("*") &&
    dom === "*" &&
    month === "*" &&
    dow === "*"
  ) {
    const time = formatTime(hour, min);
    return isThai ? `ทุกวัน เวลา ${time}` : `At ${time} every day`;
  }

  // Pattern: M H D * * (Monthly on day D)
  if (
    !min.includes("*") &&
    !hour.includes("*") &&
    !dom.includes("*") &&
    month === "*" &&
    dow === "*"
  ) {
    const time = formatTime(hour, min);
    return isThai
      ? `วันที่ ${dom} ของทุกเดือน เวลา ${time}`
      : `At ${time}, on day ${dom} of the month`;
  }

  // Fallback description
  return isThai ? `กำหนดการ Cron: "${expr}"` : `Cron schedule: "${expr}"`;
}
