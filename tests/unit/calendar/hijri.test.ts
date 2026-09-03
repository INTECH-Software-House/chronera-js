import { describe, expect, it } from "vitest";
import {
  islamicCivilAdapter,
  islamicTblaAdapter,
} from "../../../src/calendar/hijri/index.js";
import { convertCalendarDate } from "../../../src/operations/convert-calendar-date.js";

import type { CalendarDate } from "../../../src/public-types.js";

describe("Hijri calendars", () => {
  it("civil and tabular variants have distinct algorithms and epochs", () => {
    expect(islamicCivilAdapter.identity.algorithm).not.toBe(
      islamicTblaAdapter.identity.algorithm,
    );
    expect(islamicCivilAdapter.identity.validRange.first).not.toBe(
      islamicTblaAdapter.identity.validRange.first,
    );
  });

  it("converts Gregorian to Islamic Civil and back", () => {
    const greg: CalendarDate = {
      kind: "calendar-date",
      calendar: "gregory",
      year: 2026,
      monthCode: "M09",
      month: 9,
      day: 2,
    };

    const civil = convertCalendarDate(greg, "islamic-civil");
    expect(civil.value.calendar).toBe("islamic-civil");
    expect(civil.value.era).toBe("AH");

    const back = convertCalendarDate(civil.value, "gregory");
    expect(back.value.year).toBe(2026);
    expect(back.value.month).toBe(9);
    expect(back.value.day).toBe(2);
  });
});
