import { describe, expect, it } from "vitest";
import {
  islamicTblaAdapter,
  islamicUmalquraAdapter,
} from "../../../src/calendar/hijri/index.js";
import { convertCalendarDate } from "../../../src/operations/convert-calendar-date.js";
import { calendarDate } from "../../../src/core/calendar-date.js";

describe("Islamic tabular and Umm al-Qura adapters", () => {
  it("converts between Gregorian and Islamic Tabular", () => {
    const greg = calendarDate({
      calendar: "gregory",
      year: 2026,
      monthCode: "M09",
      day: 2,
    });

    const tbla = convertCalendarDate(greg, "islamic-tbla");
    expect(tbla.value.calendar).toBe("islamic-tbla");
    expect(tbla.value.year).toBeGreaterThan(1440);

    const back = convertCalendarDate(tbla.value, "gregory");
    expect(back.value.year).toBe(2026);
    expect(back.value.month).toBe(9);
    expect(back.value.day).toBe(2);
  });

  it("checks Islamic Tabular validator daysInMonth and leapYear", () => {
    expect(islamicTblaAdapter.validator.daysInMonth(1445, "M01")).toBe(30);
    expect(islamicTblaAdapter.validator.daysInMonth(1445, "M02")).toBe(29);
    expect(typeof islamicTblaAdapter.validator.isLeapYear(1445)).toBe(
      "boolean",
    );
  });

  it("checks Umm al-Qura adapter metadata", () => {
    expect(islamicUmalquraAdapter.identity.deterministic).toBe(false);
    expect(islamicUmalquraAdapter.identity.dataVersion).toBe("cldr-43");
    expect(
      islamicUmalquraAdapter.validator.validate(
        calendarDate({
          calendar: "islamic-umalqura",
          year: 1448,
          monthCode: "M01",
          day: 1,
        }),
      ),
    ).toEqual([]);
  });
});
