import { describe, expect, it } from "vitest";
import { instantFromEpochMilliseconds } from "../../../src/core/instant.js";
import { localDate } from "../../../src/core/local-date.js";
import { localDateTime } from "../../../src/core/local-date-time.js";
import { localTime } from "../../../src/core/local-time.js";
import {
  endOfDay,
  isFuture,
  isPast,
  startOfDay,
} from "../../../src/operations/time-convenience.js";

describe("Time & Instant Convenience Boundaries & Expiration (v0.1.2)", () => {
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
});
