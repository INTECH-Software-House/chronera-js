import { describe, expect, it, afterEach } from "vitest";
import {
  setSystemTime,
  restoreSystemTime,
  getSystemTime,
  advanceSystemTimeBy,
  withMockTime,
  isSystemTimeMocked,
  mockBusinessDay,
  mockHoliday,
  mockDateRange,
} from "../../../src/testing/index.js";
import { chronera, Chronera } from "../../../src/chronera.js";

describe("Testing & Time Mock Engine (@intech-software/chronera/testing)", () => {
  afterEach(() => {
    restoreSystemTime();
  });

  it("freezes and restores system clock via setSystemTime and restoreSystemTime", () => {
    expect(isSystemTimeMocked()).toBe(false);

    setSystemTime("2026-05-15T12:00:00Z");
    expect(isSystemTimeMocked()).toBe(true);
    expect(chronera().toISOString()).toBe("2026-05-15T12:00:00.000Z");
    expect(getSystemTime().toISOString()).toBe("2026-05-15T12:00:00.000Z");

    restoreSystemTime();
    expect(isSystemTimeMocked()).toBe(false);
  });

  it("advances mock time with advanceSystemTimeBy", () => {
    setSystemTime("2026-05-15T12:00:00Z");
    advanceSystemTimeBy(3600 * 1000); // +1 hour
    expect(chronera().toISOString()).toBe("2026-05-15T13:00:00.000Z");
  });

  it("scopes mock time cleanly within withMockTime", () => {
    withMockTime("2026-01-01T00:00:00Z", () => {
      expect(chronera().format("yyyy-MM-dd")).toBe("2026-01-01");
      expect(isSystemTimeMocked()).toBe(true);
    });
    expect(isSystemTimeMocked()).toBe(false);
  });

  it("generates verified mock business days", () => {
    const bDay = mockBusinessDay({ country: "TH", year: 2026 });
    expect(bDay instanceof Chronera).toBe(true);
    expect(bDay.isBusinessDay("TH")).toBe(true);
  });

  it("retrieves real statutory mock holidays", () => {
    const h = mockHoliday({ country: "TH", year: 2026 });
    expect(h.date instanceof Chronera).toBe(true);
    expect(h.date.isPublicHoliday("TH")).toBe(true);
    expect(typeof h.name).toBe("string");
  });

  it("generates a sequence of test dates with mockDateRange", () => {
    const range = mockDateRange({
      start: "2026-10-01",
      count: 5,
      stepDays: 2,
    });
    expect(range).toHaveLength(5);
    expect(range[0]?.format("yyyy-MM-dd")).toBe("2026-10-01");
    expect(range[1]?.format("yyyy-MM-dd")).toBe("2026-10-03");
    expect(range[4]?.format("yyyy-MM-dd")).toBe("2026-10-09");
  });
});
