import { describe, expect, it } from "vitest";
import {
  compareInstants,
  compareLocalDates,
  sameAbsoluteDate,
  sameCalendarDate,
} from "../../../src/operations/compare.js";
import { localDate } from "../../../src/core/local-date.js";
import { instantFromEpochMilliseconds } from "../../../src/core/instant.js";

import type { CalendarDate } from "../../../src/public-types.js";

describe("compare operations", () => {
  it("compares local dates", () => {
    const d1 = localDate(2026, 9, 2);
    const d2 = localDate(2026, 9, 3);
    const d3 = localDate(2026, 9, 2);

    expect(compareLocalDates(d1, d2)).toBe(-1);
    expect(compareLocalDates(d2, d1)).toBe(1);
    expect(compareLocalDates(d1, d3)).toBe(0);
  });

  it("compares instants", () => {
    const i1 = instantFromEpochMilliseconds(1000);
    const i2 = instantFromEpochMilliseconds(2000);
    expect(compareInstants(i1, i2)).toBe(-1);
    expect(compareInstants(i2, i1)).toBe(1);
    expect(compareInstants(i1, i1)).toBe(0);
  });

  it("checks sameCalendarDate", () => {
    const c1: CalendarDate = {
      kind: "calendar-date",
      calendar: "gregory",
      year: 2026,
      monthCode: "M09",
      day: 2,
    };
    const c2: CalendarDate = {
      kind: "calendar-date",
      calendar: "gregory",
      year: 2026,
      monthCode: "M09",
      day: 2,
    };
    const c3: CalendarDate = {
      kind: "calendar-date",
      calendar: "buddhist",
      year: 2569,
      monthCode: "M09",
      day: 2,
    };

    expect(sameCalendarDate(c1, c2)).toBe(true);
    expect(sameCalendarDate(c1, c3)).toBe(false);
  });

  it("checks sameAbsoluteDate across different calendars", () => {
    const greg: CalendarDate = {
      kind: "calendar-date",
      calendar: "gregory",
      year: 2026,
      monthCode: "M09",
      day: 2,
    };
    const buddhist: CalendarDate = {
      kind: "calendar-date",
      calendar: "buddhist",
      year: 2569,
      monthCode: "M09",
      day: 2,
    };

    expect(sameAbsoluteDate(greg, buddhist)).toBe(true);
  });
});
