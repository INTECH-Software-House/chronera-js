import { gregorianFromAbsoluteDay } from "../calendar/gregory/absolute-day.js";
import { absoluteDayFromGregorianFields } from "../core/absolute-day.js";
import { getIsoDayOfWeek } from "../core/iso-week.js";
import { localDate } from "../core/local-date.js";
import { localDateTime } from "../core/local-date-time.js";
import { localTime } from "../core/local-time.js";
import { ChroneraError } from "../errors/errors.js";
import { getHolidayCalendar } from "../holidays/registry.js";
import {
  projectInstantToZonedFields,
  validateTimeZone,
} from "../runtime/timezone.js";
import { getAbsoluteDay } from "./convenience.js";
import { isPublicHoliday } from "./holidays.js";
import { getTimeZoneOffset } from "./timezone.js";

import type { CountryCode, HolidayCalendar } from "../holidays/types.js";
import type { BusinessDaysOptions } from "./business-days.js";
import type {
  Instant,
  LocalDate,
  LocalDateTime,
  LocalTime,
  TimeZoneId,
} from "../public-types.js";

/**
 * Defines an active working shift window within a day.
 */
export interface ShiftWindow {
  /**
   * Shift start time as "HH:mm", "HH:mm:ss", or a LocalTime object (e.g. "08:30").
   */
  readonly start: string | LocalTime;
  /**
   * Shift end time as "HH:mm", "HH:mm:ss", or a LocalTime object (e.g. "17:30").
   */
  readonly end: string | LocalTime;
}

/**
 * Business schedule configuration for working hours, shifts, weekends, and holidays.
 */
export interface BusinessSchedule {
  /**
   * Working days of the week as ISO weekday numbers (1 = Monday, 7 = Sunday).
   * Defaults to [1, 2, 3, 4, 5] (Monday to Friday), or country weekend defaults.
   */
  readonly workDays?: readonly number[];
  /**
   * Standard daily shifts. Defaults to a single shift 09:00 - 17:00.
   */
  readonly shifts?: readonly ShiftWindow[];
  /**
   * Day-of-week specific shift overrides (e.g. `{ 5: [{ start: "08:30", end: "12:00" }] }` for Friday half-day).
   */
  readonly dayShifts?: Partial<Record<number, readonly ShiftWindow[]>>;
  /**
   * Country code (e.g. "th", "jp", "us", "gb", "de") or custom HolidayCalendar for automatic holiday exclusion.
   */
  readonly country?: CountryCode | string | HolidayCalendar;
  /**
   * Custom holiday list, holiday predicate, or holiday calendar.
   */
  readonly holidays?: BusinessDaysOptions["holidays"];
  /**
   * Custom weekend days (e.g. [6, 7] for Sat-Sun, or [4, 5] for Iran).
   */
  readonly weekendDays?: readonly number[];
  /**
   * TimeZone identifier (e.g. "Asia/Bangkok", "America/New_York", "UTC").
   * Required when evaluating Instant or Date across specific local working hours.
   */
  readonly timeZone?: TimeZoneId;
}

/**
 * Normalized shift representation in milliseconds from midnight [0, 86_400_000].
 */
export interface NormalizedShift {
  readonly startMs: number;
  readonly endMs: number;
  readonly durationMs: number;
}

/**
 * Result representing an upcoming or active business shift window.
 */
export interface NextBusinessShiftResult<T> {
  readonly start: T;
  readonly end: T;
}

export type BusinessTimeInput = LocalDateTime | Instant | Date | LocalDate;

/**
 * Parses a shift time string ("HH:mm", "HH:mm:ss") or LocalTime into milliseconds from midnight.
 */
function parseShiftTimeToMs(input: string | LocalTime): number {
  if (
    typeof input === "object" &&
    input !== null &&
    input.kind === "local-time"
  ) {
    return (
      ((input.hour * 60 + input.minute) * 60 + input.second) * 1000 +
      input.millisecond
    );
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?$/.exec(
      trimmed,
    );
    if (!match) {
      throw new ChroneraError(
        "CHRONERA_INVALID_TIME",
        `Invalid shift time string: "${input}". Expected format "HH:mm" or "HH:mm:ss".`,
      );
    }
    const hour = Number.parseInt(match[1]!, 10);
    const minute = Number.parseInt(match[2]!, 10);
    const second = match[3] ? Number.parseInt(match[3], 10) : 0;
    const millisecond = match[4]
      ? Number.parseInt(match[4].padEnd(3, "0"), 10)
      : 0;

    if (
      hour < 0 ||
      hour > 24 ||
      minute < 0 ||
      minute > 59 ||
      second < 0 ||
      second > 59 ||
      millisecond < 0 ||
      millisecond > 999 ||
      (hour === 24 && (minute > 0 || second > 0 || millisecond > 0))
    ) {
      throw new ChroneraError(
        "CHRONERA_OUT_OF_RANGE",
        `Shift time out of range: "${input}".`,
      );
    }

    return ((hour * 60 + minute) * 60 + second) * 1000 + millisecond;
  }

  throw new ChroneraError(
    "CHRONERA_INVALID_TIME",
    'Shift time must be a string formatted as "HH:mm" or a LocalTime object.',
  );
}

/**
 * Normalizes and validates an array of shift windows for a single day.
 */
function normalizeShiftWindows(
  shifts?: readonly ShiftWindow[],
): readonly NormalizedShift[] {
  if (!shifts || shifts.length === 0) {
    // Default 09:00 - 17:00 (8 hours)
    return [
      {
        startMs: 9 * 3_600_000,
        endMs: 17 * 3_600_000,
        durationMs: 8 * 3_600_000,
      },
    ];
  }

  const normalized = shifts.map((w) => {
    const startMs = parseShiftTimeToMs(w.start);
    const endMs = parseShiftTimeToMs(w.end);
    if (startMs >= endMs) {
      throw new ChroneraError(
        "CHRONERA_OUT_OF_RANGE",
        `Shift start (${String(w.start)}) must be strictly earlier than shift end (${String(w.end)}).`,
      );
    }
    return {
      startMs,
      endMs,
      durationMs: endMs - startMs,
    };
  });

  normalized.sort((a, b) => a.startMs - b.startMs);

  for (let i = 1; i < normalized.length; i++) {
    const prev = normalized[i - 1]!;
    const curr = normalized[i]!;
    if (curr.startMs < prev.endMs) {
      throw new ChroneraError(
        "CHRONERA_OUT_OF_RANGE",
        `Overlapping shift windows detected: [${prev.startMs}ms - ${prev.endMs}ms] and [${curr.startMs}ms - ${curr.endMs}ms].`,
      );
    }
  }

  return normalized;
}

/**
 * Returns the normalized shift windows for a given absolute day.
 */
function getShiftsForDay(
  absDay: number,
  schedule: BusinessSchedule,
): readonly NormalizedShift[] {
  const dow = getIsoDayOfWeek(absDay);
  if (schedule.dayShifts && schedule.dayShifts[dow] !== undefined) {
    return normalizeShiftWindows(schedule.dayShifts[dow]);
  }
  return normalizeShiftWindows(schedule.shifts);
}

/**
 * Checks whether a given absolute day is a working day under the provided schedule.
 */
function isWorkingScheduleDay(
  absDay: number,
  schedule: BusinessSchedule,
): boolean {
  const dow = getIsoDayOfWeek(absDay);

  let isWorkDayOfWeek = false;
  if (schedule.workDays && schedule.workDays.length > 0) {
    isWorkDayOfWeek = schedule.workDays.includes(dow);
  } else if (schedule.weekendDays && schedule.weekendDays.length > 0) {
    isWorkDayOfWeek = !schedule.weekendDays.includes(dow);
  } else if (schedule.country) {
    try {
      const cal = getHolidayCalendar(schedule.country);
      if (cal.defaultWeekendDays) {
        isWorkDayOfWeek = !cal.defaultWeekendDays.includes(dow);
      } else {
        isWorkDayOfWeek = dow !== 6 && dow !== 7;
      }
    } catch {
      isWorkDayOfWeek = dow !== 6 && dow !== 7;
    }
  } else {
    isWorkDayOfWeek = dow !== 6 && dow !== 7;
  }

  if (!isWorkDayOfWeek) {
    return false;
  }

  const gFields = gregorianFromAbsoluteDay(absDay);
  const gDate = localDate(gFields.year, gFields.month, gFields.day);

  if (schedule.country && isPublicHoliday(gDate, schedule.country)) {
    return false;
  }

  if (schedule.holidays) {
    if (typeof schedule.holidays === "function") {
      if (schedule.holidays(gDate)) return false;
    } else if (
      typeof schedule.holidays === "string" ||
      "rules" in schedule.holidays
    ) {
      if (isPublicHoliday(gDate, schedule.holidays)) return false;
    } else if (Array.isArray(schedule.holidays)) {
      if (schedule.holidays.some((h) => getAbsoluteDay(h) === absDay)) {
        return false;
      }
    }
  }

  const shifts = getShiftsForDay(absDay, schedule);
  return shifts.length > 0;
}

interface ExtractedTimeInfo {
  readonly kind: "local-date-time" | "instant" | "date" | "local-date";
  readonly absDay: number;
  readonly timeMs: number;
  readonly timeZone?: TimeZoneId;
}

function extractTimeInfo(
  input: BusinessTimeInput,
  timeZone?: TimeZoneId,
): ExtractedTimeInfo {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      throw new ChroneraError("CHRONERA_INVALID_DATE", "Invalid Date object.");
    }
    if (timeZone) {
      validateTimeZone(timeZone);
      const inst: Instant = {
        kind: "instant",
        epochMilliseconds: input.getTime(),
      };
      const f = projectInstantToZonedFields(inst, timeZone);
      const absDay = absoluteDayFromGregorianFields(f.year, f.month, f.day);
      const timeMs =
        ((f.hour * 60 + f.minute) * 60 + f.second) * 1000 + f.millisecond;
      return { kind: "date", absDay, timeMs, timeZone };
    }
    const absDay = absoluteDayFromGregorianFields(
      input.getFullYear(),
      input.getMonth() + 1,
      input.getDate(),
    );
    const timeMs =
      ((input.getHours() * 60 + input.getMinutes()) * 60 + input.getSeconds()) *
        1000 +
      input.getMilliseconds();
    return { kind: "date", absDay, timeMs };
  }

  if (
    typeof input === "object" &&
    input !== null &&
    "kind" in input &&
    input.kind === "instant"
  ) {
    if (!Number.isFinite(input.epochMilliseconds)) {
      throw new ChroneraError(
        "CHRONERA_INVALID_INSTANT",
        "Invalid Instant epochMilliseconds.",
      );
    }
    if (timeZone) {
      validateTimeZone(timeZone);
      const f = projectInstantToZonedFields(input, timeZone);
      const absDay = absoluteDayFromGregorianFields(f.year, f.month, f.day);
      const timeMs =
        ((f.hour * 60 + f.minute) * 60 + f.second) * 1000 + f.millisecond;
      return { kind: "instant", absDay, timeMs, timeZone };
    }
    const d = new Date(input.epochMilliseconds);
    const absDay = absoluteDayFromGregorianFields(
      d.getUTCFullYear(),
      d.getUTCMonth() + 1,
      d.getUTCDate(),
    );
    const timeMs =
      ((d.getUTCHours() * 60 + d.getUTCMinutes()) * 60 + d.getUTCSeconds()) *
        1000 +
      d.getUTCMilliseconds();
    return { kind: "instant", absDay, timeMs };
  }

  if (
    typeof input === "object" &&
    input !== null &&
    "kind" in input &&
    input.kind === "local-date-time"
  ) {
    const absDay = getAbsoluteDay(input.date);
    const timeMs =
      ((input.time.hour * 60 + input.time.minute) * 60 + input.time.second) *
        1000 +
      input.time.millisecond;
    return { kind: "local-date-time", absDay, timeMs };
  }

  if (
    typeof input === "object" &&
    input !== null &&
    "kind" in input &&
    input.kind === "local-date"
  ) {
    const absDay = getAbsoluteDay(input);
    return { kind: "local-date", absDay, timeMs: 0 };
  }

  throw new ChroneraError(
    "CHRONERA_INVALID_DATE",
    "Unsupported time input type. Expected LocalDateTime, Instant, Date, or LocalDate.",
  );
}

function zonedFieldsToInstant(
  year: number,
  month: number,
  day: number,
  timeMs: number,
  timeZone: TimeZoneId,
): Instant {
  const hour = Math.floor(timeMs / 3_600_000);
  const minute = Math.floor((timeMs % 3_600_000) / 60_000);
  const second = Math.floor((timeMs % 60_000) / 1000);
  const millisecond = timeMs % 1000;

  const utcGuess = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    millisecond,
  );
  const offsetMin = getTimeZoneOffset(
    timeZone,
    { kind: "instant", epochMilliseconds: utcGuess },
    "minutes",
  );
  let epochMs = utcGuess - offsetMin * 60_000;

  const checkOffsetMin = getTimeZoneOffset(
    timeZone,
    { kind: "instant", epochMilliseconds: epochMs },
    "minutes",
  );
  if (checkOffsetMin !== offsetMin) {
    epochMs = utcGuess - checkOffsetMin * 60_000;
  }
  return { kind: "instant", epochMilliseconds: epochMs };
}

function reconstructResult(
  info: ExtractedTimeInfo,
  absDay: number,
  timeMs: number,
): LocalDateTime | Instant | Date {
  const g = gregorianFromAbsoluteDay(absDay);
  const hour = Math.floor(timeMs / 3_600_000);
  const minute = Math.floor((timeMs % 3_600_000) / 60_000);
  const second = Math.floor((timeMs % 60_000) / 1000);
  const millisecond = timeMs % 1000;

  if (info.kind === "local-date-time" || info.kind === "local-date") {
    return localDateTime(
      localDate(g.year, g.month, g.day),
      localTime(hour, minute, second, millisecond),
    );
  }

  if (info.kind === "instant") {
    if (info.timeZone) {
      return zonedFieldsToInstant(
        g.year,
        g.month,
        g.day,
        timeMs,
        info.timeZone,
      );
    }
    return {
      kind: "instant",
      epochMilliseconds: Date.UTC(
        g.year,
        g.month - 1,
        g.day,
        hour,
        minute,
        second,
        millisecond,
      ),
    };
  }

  if (info.kind === "date") {
    if (info.timeZone) {
      const inst = zonedFieldsToInstant(
        g.year,
        g.month,
        g.day,
        timeMs,
        info.timeZone,
      );
      return new Date(inst.epochMilliseconds);
    }
    return new Date(
      g.year,
      g.month - 1,
      g.day,
      hour,
      minute,
      second,
      millisecond,
    );
  }

  throw new ChroneraError(
    "CHRONERA_INVALID_DATE",
    "Cannot reconstruct time result.",
  );
}

/**
 * Checks whether the given timestamp falls inside an active working shift on a working day.
 * Returns false during non-working days, holidays, weekends, lunch breaks, or outside shift hours.
 *
 * @param input - LocalDateTime, Instant, Date, or LocalDate to check.
 * @param schedule - Working schedule, shift windows, and holiday configuration.
 */
export function isBusinessHour(
  input: BusinessTimeInput,
  schedule: BusinessSchedule = {},
): boolean {
  const info = extractTimeInfo(input, schedule.timeZone);
  if (!isWorkingScheduleDay(info.absDay, schedule)) {
    return false;
  }

  const shifts = getShiftsForDay(info.absDay, schedule);
  return shifts.some(
    (shift) => info.timeMs >= shift.startMs && info.timeMs < shift.endMs,
  );
}

/**
 * Adds business hours to a timestamp, skipping non-working hours, breaks, weekends, and statutory holidays.
 * If the starting timestamp falls outside business hours (e.g. at night or during lunch),
 * the SLA calculation automatically starts ticking from the start of the next active shift.
 *
 * @param input - The starting LocalDateTime, Instant, Date, or LocalDate.
 * @param hours - Number of business hours to add (supports fractional hours like 2.5).
 * @param schedule - Business schedule defining shift windows, weekends, holidays, and timezone.
 * @returns The resulting deadline in the same type as the input.
 */
export function addBusinessHours(
  input: LocalDate,
  hours: number,
  schedule?: BusinessSchedule,
): LocalDateTime;
export function addBusinessHours<T extends LocalDateTime | Instant | Date>(
  input: T,
  hours: number,
  schedule?: BusinessSchedule,
): T;
export function addBusinessHours(
  input: BusinessTimeInput,
  hours: number,
  schedule?: BusinessSchedule,
): LocalDateTime | Instant | Date;
export function addBusinessHours(
  input: BusinessTimeInput,
  hours: number,
  schedule: BusinessSchedule = {},
): BusinessTimeInput {
  if (!Number.isFinite(hours)) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      "Hours must be a finite number.",
    );
  }

  if (hours < 0) {
    return subtractBusinessHours(input, -hours, schedule);
  }

  const info = extractTimeInfo(input, schedule.timeZone);
  let currentAbs = info.absDay;
  let currentMs = info.timeMs;
  let remainingMs = Math.round(hours * 3_600_000);

  let loopCount = 0;
  const maxDays = 10_000;

  while (loopCount++ < maxDays) {
    if (!isWorkingScheduleDay(currentAbs, schedule)) {
      currentAbs += 1;
      currentMs = 0;
      continue;
    }

    const shifts = getShiftsForDay(currentAbs, schedule);

    for (const shift of shifts) {
      if (currentMs >= shift.endMs) {
        continue;
      }

      if (currentMs < shift.startMs) {
        currentMs = shift.startMs;
      }

      if (remainingMs === 0) {
        return reconstructResult(info, currentAbs, currentMs);
      }

      const availableInShift = shift.endMs - currentMs;
      if (remainingMs <= availableInShift) {
        currentMs += remainingMs;
        remainingMs = 0;
        return reconstructResult(info, currentAbs, currentMs);
      }

      remainingMs -= availableInShift;
      currentMs = shift.endMs;
    }

    currentAbs += 1;
    currentMs = 0;
  }

  throw new ChroneraError(
    "CHRONERA_OUT_OF_RANGE",
    "Could not satisfy business hours within 10,000 calendar days.",
  );
}

/**
 * Subtracts business hours from a timestamp backwards, skipping non-working hours, breaks, weekends, and holidays.
 *
 * @param input - The starting LocalDateTime, Instant, Date, or LocalDate.
 * @param hours - Number of business hours to subtract (supports fractional hours).
 * @param schedule - Business schedule configuration.
 * @returns The resulting earlier timestamp in the same type as the input.
 */
export function subtractBusinessHours(
  input: LocalDate,
  hours: number,
  schedule?: BusinessSchedule,
): LocalDateTime;
export function subtractBusinessHours<T extends LocalDateTime | Instant | Date>(
  input: T,
  hours: number,
  schedule?: BusinessSchedule,
): T;
export function subtractBusinessHours(
  input: BusinessTimeInput,
  hours: number,
  schedule?: BusinessSchedule,
): LocalDateTime | Instant | Date;
export function subtractBusinessHours(
  input: BusinessTimeInput,
  hours: number,
  schedule: BusinessSchedule = {},
): BusinessTimeInput {
  if (!Number.isFinite(hours)) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      "Hours must be a finite number.",
    );
  }

  if (hours < 0) {
    return addBusinessHours(input, -hours, schedule);
  }

  const info = extractTimeInfo(input, schedule.timeZone);
  let currentAbs = info.absDay;
  let currentMs = info.timeMs;
  let remainingMs = Math.round(hours * 3_600_000);

  let loopCount = 0;
  const maxDays = 10_000;

  while (loopCount++ < maxDays) {
    if (!isWorkingScheduleDay(currentAbs, schedule)) {
      currentAbs -= 1;
      currentMs = 86_400_000;
      continue;
    }

    const shifts = getShiftsForDay(currentAbs, schedule);

    for (let i = shifts.length - 1; i >= 0; i--) {
      const shift = shifts[i]!;
      if (currentMs <= shift.startMs) {
        continue;
      }

      if (currentMs > shift.endMs) {
        currentMs = shift.endMs;
      }

      if (remainingMs === 0) {
        return reconstructResult(info, currentAbs, currentMs);
      }

      const availableInShift = currentMs - shift.startMs;
      if (remainingMs <= availableInShift) {
        currentMs -= remainingMs;
        remainingMs = 0;
        return reconstructResult(info, currentAbs, currentMs);
      }

      remainingMs -= availableInShift;
      currentMs = shift.startMs;
    }

    currentAbs -= 1;
    currentMs = 86_400_000;
  }

  throw new ChroneraError(
    "CHRONERA_OUT_OF_RANGE",
    "Could not satisfy business hours within 10,000 calendar days.",
  );
}

/**
 * Computes the exact signed number of business hours elapsed between two timestamps (left - right).
 * Non-working hours, lunch breaks, weekends, and statutory holidays are excluded.
 *
 * @param left - The later or earlier timestamp.
 * @param right - The reference timestamp.
 * @param schedule - Business schedule configuration.
 * @returns Fractional business hours elapsed (positive if left > right, negative if left < right, 0 if equal).
 */
export function diffInBusinessHours(
  left: BusinessTimeInput,
  right: BusinessTimeInput,
  schedule: BusinessSchedule = {},
): number {
  const leftInfo = extractTimeInfo(left, schedule.timeZone);
  const rightInfo = extractTimeInfo(right, schedule.timeZone);

  let cmp = 0;
  if (leftInfo.absDay !== rightInfo.absDay) {
    cmp = leftInfo.absDay - rightInfo.absDay;
  } else {
    cmp = leftInfo.timeMs - rightInfo.timeMs;
  }

  if (cmp === 0) {
    return 0;
  }

  if (cmp < 0) {
    return -diffInBusinessHours(right, left, schedule);
  }

  const startDay = rightInfo.absDay;
  const startMs = rightInfo.timeMs;
  const endDay = leftInfo.absDay;
  const endMs = leftInfo.timeMs;

  let totalMs = 0;

  for (let day = startDay; day <= endDay; day++) {
    if (!isWorkingScheduleDay(day, schedule)) {
      continue;
    }

    const shifts = getShiftsForDay(day, schedule);
    for (const shift of shifts) {
      const activeStart =
        day === startDay ? Math.max(shift.startMs, startMs) : shift.startMs;
      const activeEnd =
        day === endDay ? Math.min(shift.endMs, endMs) : shift.endMs;

      if (activeStart < activeEnd) {
        totalMs += activeEnd - activeStart;
      }
    }
  }

  return totalMs / 3_600_000;
}

/**
 * Options for resolving the next business shift window.
 */
export interface NextBusinessShiftOptions {
  /**
   * If true (default), returns the currently ongoing shift if the timestamp falls inside it.
   * If false, strictly returns the next upcoming shift after the timestamp.
   */
  readonly includeCurrent?: boolean;
}

/**
 * Resolves the next upcoming (or currently active) business shift window.
 *
 * @param input - The reference timestamp.
 * @param schedule - Business schedule configuration.
 * @param options - Options for including the currently active shift.
 */
export function nextBusinessShift(
  input: LocalDate,
  schedule?: BusinessSchedule,
  options?: NextBusinessShiftOptions,
): NextBusinessShiftResult<LocalDateTime>;
export function nextBusinessShift<T extends LocalDateTime | Instant | Date>(
  input: T,
  schedule?: BusinessSchedule,
  options?: NextBusinessShiftOptions,
): NextBusinessShiftResult<T>;
export function nextBusinessShift(
  input: BusinessTimeInput,
  schedule?: BusinessSchedule,
  options?: NextBusinessShiftOptions,
): NextBusinessShiftResult<LocalDateTime | Instant | Date>;
export function nextBusinessShift(
  input: BusinessTimeInput,
  schedule: BusinessSchedule = {},
  options: NextBusinessShiftOptions = {},
): NextBusinessShiftResult<LocalDateTime | Instant | Date> {
  const info = extractTimeInfo(input, schedule.timeZone);
  const includeCurrent = options.includeCurrent ?? true;

  let currentAbs = info.absDay;
  let currentMs = info.timeMs;
  let loopCount = 0;
  const maxDays = 10_000;

  while (loopCount++ < maxDays) {
    if (isWorkingScheduleDay(currentAbs, schedule)) {
      const shifts = getShiftsForDay(currentAbs, schedule);
      for (const shift of shifts) {
        if (currentAbs === info.absDay) {
          if (includeCurrent) {
            if (currentMs < shift.endMs) {
              return {
                start: reconstructResult(info, currentAbs, shift.startMs),
                end: reconstructResult(info, currentAbs, shift.endMs),
              };
            }
          } else {
            if (currentMs < shift.startMs) {
              return {
                start: reconstructResult(info, currentAbs, shift.startMs),
                end: reconstructResult(info, currentAbs, shift.endMs),
              };
            }
          }
        } else {
          return {
            start: reconstructResult(info, currentAbs, shift.startMs),
            end: reconstructResult(info, currentAbs, shift.endMs),
          };
        }
      }
    }

    currentAbs += 1;
    currentMs = 0;
  }

  throw new ChroneraError(
    "CHRONERA_OUT_OF_RANGE",
    "No upcoming business shift found within 10,000 calendar days.",
  );
}

/**
 * Returns the earliest shift start time for a given date as a LocalDateTime.
 */
export function startOfBusinessDay(
  date: LocalDate | LocalDateTime | Date,
  schedule: BusinessSchedule = {},
): LocalDateTime {
  const absDay = getAbsoluteDay(
    date instanceof Date
      ? localDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
      : date.kind === "local-date-time"
        ? date.date
        : date,
  );
  const shifts = getShiftsForDay(absDay, schedule);
  if (shifts.length === 0) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      "No business shifts defined for the given date.",
    );
  }
  const firstShift = shifts[0]!;
  const g = gregorianFromAbsoluteDay(absDay);
  const hour = Math.floor(firstShift.startMs / 3_600_000);
  const minute = Math.floor((firstShift.startMs % 3_600_000) / 60_000);
  const second = Math.floor((firstShift.startMs % 60_000) / 1000);
  const millisecond = firstShift.startMs % 1000;
  return localDateTime(
    localDate(g.year, g.month, g.day),
    localTime(hour, minute, second, millisecond),
  );
}

/**
 * Returns the latest shift end time for a given date as a LocalDateTime.
 */
export function endOfBusinessDay(
  date: LocalDate | LocalDateTime | Date,
  schedule: BusinessSchedule = {},
): LocalDateTime {
  const absDay = getAbsoluteDay(
    date instanceof Date
      ? localDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
      : date.kind === "local-date-time"
        ? date.date
        : date,
  );
  const shifts = getShiftsForDay(absDay, schedule);
  if (shifts.length === 0) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      "No business shifts defined for the given date.",
    );
  }
  const lastShift = shifts[shifts.length - 1]!;
  const g = gregorianFromAbsoluteDay(absDay);
  const hour = Math.floor(lastShift.endMs / 3_600_000);
  const minute = Math.floor((lastShift.endMs % 3_600_000) / 60_000);
  const second = Math.floor((lastShift.endMs % 60_000) / 1000);
  const millisecond = lastShift.endMs % 1000;
  return localDateTime(
    localDate(g.year, g.month, g.day),
    localTime(hour, minute, second, millisecond),
  );
}
