import { describe, expect, it } from "vitest";
import { instantFromEpochMilliseconds } from "../../../src/core/instant.js";
import { localDate } from "../../../src/core/local-date.js";
import { localDateTime } from "../../../src/core/local-date-time.js";
import { localTime } from "../../../src/core/local-time.js";
import {
  addHours,
  addMinutes,
  addSeconds,
  endOfDay,
  isFuture,
  isPast,
  startOfDay,
  subtractHours,
  subtractMinutes,
  subtractSeconds,
} from "../../../src/operations/time-convenience.js";

describe("Time & Instant Convenience Helpers (v0.1.2)", () => {
  const d = localDate(2026, 9, 4);
  const t = localTime(14, 30, 45, 120);
  const dt = localDateTime(d, t);

  it("computes startOfDay and endOfDay correctly", () => {
    // From LocalDate
    const sod = startOfDay(d);
    expect(sod.date).toEqual(d);
    expect(sod.time).toEqual(localTime(0, 0, 0, 0));

    const eod = endOfDay(d);
    expect(eod.date).toEqual(d);
    expect(eod.time).toEqual(localTime(23, 59, 59, 999));

    // From existing LocalDateTime
    const sodFromDt = startOfDay(dt);
    expect(sodFromDt.date).toEqual(d);
    expect(sodFromDt.time).toEqual(localTime(0, 0, 0, 0));

    const eodFromDt = endOfDay(dt);
    expect(eodFromDt.date).toEqual(d);
    expect(eodFromDt.time).toEqual(localTime(23, 59, 59, 999));
  });

  it("evaluates isPast and isFuture for Instant, Date, and numbers", () => {
    const now = Date.now();
    const pastInstant = instantFromEpochMilliseconds(now - 10_000);
    const futureInstant = instantFromEpochMilliseconds(now + 10_000);

    expect(isPast(pastInstant)).toBe(true);
    expect(isFuture(pastInstant)).toBe(false);

    expect(isFuture(futureInstant)).toBe(true);
    expect(isPast(futureInstant)).toBe(false);

    // Support native JS Date and numeric timestamps
    expect(isPast(new Date(now - 5_000))).toBe(true);
    expect(isFuture(new Date(now + 5_000))).toBe(true);
    expect(isPast(now - 5_000)).toBe(true);
    expect(isFuture(now + 5_000)).toBe(true);
  });

  it("adds and subtracts hours on LocalTime, LocalDateTime, and Instant", () => {
    // LocalTime
    expect(addHours(t, 2)).toEqual(localTime(16, 30, 45, 120));
    expect(subtractHours(t, 2)).toEqual(localTime(12, 30, 45, 120));
    // LocalTime wraps within 24h
    expect(addHours(localTime(23, 0), 2)).toEqual(localTime(1, 0));
    expect(subtractHours(localTime(1, 0), 2)).toEqual(localTime(23, 0));

    // LocalDateTime (rolls calendar date forward/backward)
    const lateNight = localDateTime(d, localTime(22, 30));
    const rolledForward = addHours(lateNight, 3);
    expect(rolledForward.date).toEqual(localDate(2026, 9, 5));
    expect(rolledForward.time).toEqual(localTime(1, 30));

    const earlyMorning = localDateTime(d, localTime(1, 30));
    const rolledBackward = subtractHours(earlyMorning, 3);
    expect(rolledBackward.date).toEqual(localDate(2026, 9, 3));
    expect(rolledBackward.time).toEqual(localTime(22, 30));

    // Instant
    const inst = instantFromEpochMilliseconds(1_000_000_000);
    expect(addHours(inst, 1).epochMilliseconds).toBe(1_000_000_000 + 3_600_000);
    expect(subtractHours(inst, 1).epochMilliseconds).toBe(
      1_000_000_000 - 3_600_000,
    );
  });

  it("adds and subtracts minutes on LocalTime, LocalDateTime, and Instant", () => {
    // LocalTime
    expect(addMinutes(t, 15)).toEqual(localTime(14, 45, 45, 120));
    expect(subtractMinutes(t, 40)).toEqual(localTime(13, 50, 45, 120));

    // LocalDateTime rollover
    const nearMidnight = localDateTime(d, localTime(23, 50));
    const nextDay = addMinutes(nearMidnight, 20);
    expect(nextDay.date).toEqual(localDate(2026, 9, 5));
    expect(nextDay.time).toEqual(localTime(0, 10));

    // Instant
    const inst = instantFromEpochMilliseconds(500_000);
    expect(addMinutes(inst, 5).epochMilliseconds).toBe(500_000 + 300_000);
    expect(subtractMinutes(inst, 5).epochMilliseconds).toBe(500_000 - 300_000);
  });

  it("adds and subtracts seconds on LocalTime, LocalDateTime, and Instant", () => {
    // LocalTime
    expect(addSeconds(t, 10)).toEqual(localTime(14, 30, 55, 120));
    expect(subtractSeconds(t, 50)).toEqual(localTime(14, 29, 55, 120));

    // LocalDateTime rollover
    const rightBeforeMidnight = localDateTime(d, localTime(23, 59, 50));
    const nextDay = addSeconds(rightBeforeMidnight, 20);
    expect(nextDay.date).toEqual(localDate(2026, 9, 5));
    expect(nextDay.time).toEqual(localTime(0, 0, 10));

    // Instant
    const inst = instantFromEpochMilliseconds(10_000);
    expect(addSeconds(inst, 15).epochMilliseconds).toBe(25_000);
    expect(subtractSeconds(inst, 5).epochMilliseconds).toBe(5_000);
  });
});
