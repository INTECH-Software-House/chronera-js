import { describe, expect, it } from "vitest";
import {
  calendarDate,
  formatIsoWeek,
  getIsoWeek,
  localDate,
} from "../../../src/index.js";
import { getIsoDayOfWeek } from "../../../src/core/iso-week.js";

describe("ISO 8601 Week Date System", () => {
  it("calculates ISO day of week correctly (Mon = 1, Sun = 7)", () => {
    // 1970-01-01 was Thursday (4)
    expect(getIsoDayOfWeek(0)).toBe(4);
    // 1970-01-02 was Friday (5)
    expect(getIsoDayOfWeek(1)).toBe(5);
    // 1970-01-04 was Sunday (7)
    expect(getIsoDayOfWeek(3)).toBe(7);
    // 1970-01-05 was Monday (1)
    expect(getIsoDayOfWeek(4)).toBe(1);
  });

  it("calculates ISO week for 2026-09-02 (Wednesday of Week 36)", () => {
    const d = localDate(2026, 9, 2);
    const isoWeek = getIsoWeek(d);
    expect(isoWeek.weekYear).toBe(2026);
    expect(isoWeek.weekNumber).toBe(36);
    expect(isoWeek.dayOfWeek).toBe(3); // Wednesday

    const formatted = formatIsoWeek(d);
    expect(formatted).toBe("2026-W36-3");

    const formattedShort = formatIsoWeek(d, { includeDayOfWeek: false });
    expect(formattedShort).toBe("2026-W36");
  });

  it("handles year boundary crossover (e.g. 2024-12-30 is 2025-W01-1)", () => {
    // 2024-12-30 was Monday belonging to Week 1 of 2025!
    const dBoundary = localDate(2024, 12, 30);
    const isoWeek = getIsoWeek(dBoundary);
    expect(isoWeek.weekYear).toBe(2025);
    expect(isoWeek.weekNumber).toBe(1);
    expect(isoWeek.dayOfWeek).toBe(1);

    expect(formatIsoWeek(dBoundary)).toBe("2025-W01-1");
  });

  it("supports CalendarDate inputs", () => {
    const cal = calendarDate({
      calendar: "gregory",
      year: 2026,
      monthCode: "M09",
      day: 2,
    });
    const isoWeek = getIsoWeek(cal);
    expect(isoWeek.weekNumber).toBe(36);
    expect(isoWeek.dayOfWeek).toBe(3);
  });
});
