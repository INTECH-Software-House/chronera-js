import { ChroneraError } from "../errors/errors.js";
import { instantFromDate } from "../core/instant.js";
import { localDate } from "../core/local-date.js";
import { localTime } from "../core/local-time.js";
import {
  projectInstantToZonedFields,
  validateTimeZone,
} from "../runtime/timezone.js";
import { getTimeZoneOffset } from "./timezone.js";
import type {
  Instant,
  LocalDate,
  LocalTime,
  TimeZoneId,
} from "../public-types.js";

export interface WorldClockEntry {
  readonly timeZone: TimeZoneId;
  readonly date: LocalDate;
  readonly time: LocalTime;
  readonly formattedTime: string;
  readonly formattedDateTime: string;
  readonly offsetMinutes: number;
  readonly offsetString: string;
  readonly isDaylightSaving: boolean;
  readonly isBusinessHours: boolean;
}

export interface MeetingParticipant {
  readonly name?: string;
  readonly timeZone: TimeZoneId;
  readonly workingHours: readonly [startHour: number, endHour: number];
}

export interface MeetingWindow {
  readonly startHourUtc: number;
  readonly endHourUtc: number;
  readonly durationHours: number;
  readonly localTimes: Record<string, string>;
}

export interface DSTTransition {
  readonly timeZone: TimeZoneId;
  readonly type: "spring-forward" | "fall-back";
  readonly date: LocalDate;
  readonly previousOffsetMinutes: number;
  readonly newOffsetMinutes: number;
}

function toInstant(input?: unknown): Instant {
  if (!input) return instantFromDate(new Date());
  if (input instanceof Date) return instantFromDate(input);
  if (
    typeof input === "object" &&
    input !== null &&
    "kind" in input &&
    (input as { readonly kind: unknown }).kind === "instant" &&
    "epochMilliseconds" in input &&
    typeof (input as { readonly epochMilliseconds: unknown })
      .epochMilliseconds === "number"
  ) {
    return input as Instant;
  }
  throw new ChroneraError(
    "CHRONERA_INVALID_INSTANT",
    "Expected a valid Date or Instant",
  );
}

export function isDSTAtInstant(
  timeZone: TimeZoneId,
  instant: Instant,
): boolean {
  validateTimeZone(timeZone);
  const targetInstant = toInstant(instant);
  const info = getTimeZoneOffset(timeZone, targetInstant, "object");
  return info.isDst;
}

export function worldClock(
  timezones: readonly TimeZoneId[],
  instant?: Date | Instant,
): WorldClockEntry[] {
  if (!Array.isArray(timezones) || timezones.length === 0) {
    throw new ChroneraError(
      "CHRONERA_INCOMPATIBLE_OPTION",
      "worldClock expects a non-empty array of TimeZoneId",
    );
  }

  const targetInstant = toInstant(instant);

  return timezones.map((tz) => {
    validateTimeZone(tz);
    const zoned = projectInstantToZonedFields(targetInstant, tz);
    const offsetInfo = getTimeZoneOffset(tz, targetInstant, "object");
    const date = localDate(zoned.year, zoned.month, zoned.day);
    const time = localTime(
      zoned.hour,
      zoned.minute,
      zoned.second,
      zoned.millisecond,
    );

    const hh = String(zoned.hour).padStart(2, "0");
    const mm = String(zoned.minute).padStart(2, "0");
    const ss = String(zoned.second).padStart(2, "0");
    const yyyy = String(zoned.year).padStart(4, "0");
    const MM = String(zoned.month).padStart(2, "0");
    const dd = String(zoned.day).padStart(2, "0");

    const formattedTime = `${hh}:${mm}:${ss}`;
    const formattedDateTime = `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;

    // Business hours check: Monday-Friday (day of week 1..5) between 09:00 and 18:00
    const jsDate = new Date(Date.UTC(zoned.year, zoned.month - 1, zoned.day));
    const dayOfWeek = jsDate.getUTCDay(); // 0=Sun..6=Sat
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isBusinessHours = isWeekday && zoned.hour >= 9 && zoned.hour < 18;

    return {
      timeZone: tz,
      date,
      time,
      formattedTime,
      formattedDateTime,
      offsetMinutes: offsetInfo.minutes,
      offsetString: offsetInfo.formatted,
      isDaylightSaving: offsetInfo.isDst,
      isBusinessHours,
    };
  });
}

export function findOverlapHours(
  participants: readonly MeetingParticipant[],
  referenceInstant?: Date | Instant,
): MeetingWindow[] {
  if (!Array.isArray(participants) || participants.length === 0) {
    throw new ChroneraError(
      "CHRONERA_INCOMPATIBLE_OPTION",
      "findOverlapHours expects an array of at least 1 participant",
    );
  }

  const baseInstant = toInstant(referenceInstant);

  // Get offsets for all participants at this reference instant
  const participantData = participants.map((p, idx) => {
    validateTimeZone(p.timeZone);
    const [startH, endH] = p.workingHours;
    if (startH < 0 || startH > 24 || endH < 0 || endH > 24 || startH >= endH) {
      throw new ChroneraError(
        "CHRONERA_OUT_OF_RANGE",
        `Invalid workingHours [${startH}, ${endH}] for participant ${p.name ?? p.timeZone}`,
      );
    }
    const offsetMinutes = getTimeZoneOffset(p.timeZone, baseInstant, "minutes");
    return {
      id: p.name ?? `${p.timeZone}-${idx}`,
      timeZone: p.timeZone,
      startHour: startH,
      endHour: endH,
      offsetHours: offsetMinutes / 60,
    };
  });

  // Evaluate each UTC hour 0..23
  const overlappingUtcHours: number[] = [];
  for (let utcHour = 0; utcHour < 24; utcHour++) {
    const allAvailable = participantData.every((p) => {
      let localH = (utcHour + p.offsetHours) % 24;
      if (localH < 0) localH += 24;
      return localH >= p.startHour && localH < p.endHour;
    });
    if (allAvailable) {
      overlappingUtcHours.push(utcHour);
    }
  }

  if (overlappingUtcHours.length === 0) {
    return [];
  }

  // Group into contiguous windows
  const windows: MeetingWindow[] = [];
  let currentStart = overlappingUtcHours[0]!;
  let currentEnd = currentStart + 1;

  for (let i = 1; i < overlappingUtcHours.length; i++) {
    const hour = overlappingUtcHours[i]!;
    if (hour === currentEnd) {
      currentEnd = hour + 1;
    } else {
      windows.push(
        buildMeetingWindow(currentStart, currentEnd, participantData),
      );
      currentStart = hour;
      currentEnd = hour + 1;
    }
  }
  windows.push(buildMeetingWindow(currentStart, currentEnd, participantData));

  return windows;
}

function buildMeetingWindow(
  startHourUtc: number,
  endHourUtc: number,
  participants: readonly {
    id: string;
    timeZone: TimeZoneId;
    offsetHours: number;
  }[],
): MeetingWindow {
  const localTimes: Record<string, string> = {};
  for (const p of participants) {
    let startL = (startHourUtc + p.offsetHours) % 24;
    let endL = (endHourUtc + p.offsetHours) % 24;
    if (startL < 0) startL += 24;
    if (endL < 0) endL += 24;
    const sStr = `${String(Math.floor(startL)).padStart(2, "0")}:00`;
    const eStr = `${String(Math.floor(endL)).padStart(2, "0")}:00`;
    localTimes[p.id] = `${sStr} - ${eStr} (${p.timeZone})`;
  }

  return {
    startHourUtc,
    endHourUtc,
    durationHours: endHourUtc - startHourUtc,
    localTimes,
  };
}

export function getNextDSTTransition(
  timeZone: TimeZoneId,
  fromYear?: number,
): DSTTransition | null {
  validateTimeZone(timeZone);
  const year = fromYear ?? new Date().getFullYear();

  const getOffsetAtDay = (dayOfYear: number) => {
    const ms = Date.UTC(year, 0, 1 + dayOfYear, 12, 0, 0);
    return getTimeZoneOffset(
      timeZone,
      { kind: "instant", epochMilliseconds: ms },
      "minutes",
    );
  };

  const janOffset = getOffsetAtDay(0);
  const julOffset = getOffsetAtDay(181);

  let searchStart = 0;
  let searchEnd = 181;
  let baseOffset = janOffset;

  if (janOffset !== julOffset) {
    searchStart = 0;
    searchEnd = 181;
    baseOffset = janOffset;
  } else {
    // Check second half of the year
    const decOffset = getOffsetAtDay(355);
    if (julOffset !== decOffset) {
      searchStart = 181;
      searchEnd = 355;
      baseOffset = julOffset;
    } else {
      return null; // No transition in this year
    }
  }

  let low = searchStart;
  let high = searchEnd;
  while (low + 1 < high) {
    const mid = Math.floor((low + high) / 2);
    if (getOffsetAtDay(mid) === baseOffset) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const prevOffset = getOffsetAtDay(low);
  const newOffset = getOffsetAtDay(high);

  if (prevOffset === newOffset) {
    return null;
  }

  const transitionJsDate = new Date(Date.UTC(year, 0, 1 + high));
  const transitionDate = localDate(
    transitionJsDate.getUTCFullYear(),
    transitionJsDate.getUTCMonth() + 1,
    transitionJsDate.getUTCDate(),
  );

  const type: "spring-forward" | "fall-back" =
    newOffset > prevOffset ? "spring-forward" : "fall-back";

  return {
    timeZone,
    type,
    date: transitionDate,
    previousOffsetMinutes: prevOffset,
    newOffsetMinutes: newOffset,
  };
}
