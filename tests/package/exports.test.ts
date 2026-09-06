import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import * as Root from "../../dist/index.js";
import * as Calendar from "../../dist/calendar/index.js";
import * as Format from "../../dist/format/index.js";
import * as Parse from "../../dist/parse/index.js";
import * as Holidays from "../../dist/holidays/index.js";

describe("package exports", () => {
  it("package.json defines expected subpaths", async () => {
    const pkg = JSON.parse(await readFile("package.json", "utf-8"));
    expect(pkg.exports["."]).toBeDefined();
    expect(pkg.exports["./calendar"]).toBeDefined();
    expect(pkg.exports["./format"]).toBeDefined();
    expect(pkg.exports["./parse"]).toBeDefined();
    expect(pkg.exports["./holidays"]).toBeDefined();
  });

  it("exports all expected symbols from root", () => {
    expect(typeof Root.formatDate).toBe("function");
    expect(typeof Root.parseLocalDate).toBe("function");
    expect(typeof Root.createChronera).toBe("function");
    expect(typeof Root.convertCalendarDate).toBe("function");
    expect(typeof Root.localDate).toBe("function");
    expect(typeof Root.instantFromDate).toBe("function");
    expect(typeof Root.formatInTimeZone).toBe("function");
    expect(typeof Root.getTimeZoneOffset).toBe("function");
    expect(typeof Root.isSameTimeZone).toBe("function");
    expect(typeof Root.isPublicHoliday).toBe("function");
    expect(typeof Root.getPublicHolidays).toBe("function");
    expect(typeof Root.getHolidayDetails).toBe("function");
    expect(typeof Root.isBusinessDay).toBe("function");
    expect(typeof Root.addBusinessDays).toBe("function");
    expect(typeof Root.addBusinessHours).toBe("function");
    expect(typeof Root.diffInBusinessHours).toBe("function");
  });

  it("exports calendar symbols from ./calendar", () => {
    expect(typeof Calendar.convertCalendarDate).toBe("function");
    expect(typeof Calendar.isLeapYear).toBe("function");
    expect(typeof Calendar.daysInMonth).toBe("function");
  });

  it("exports format symbols from ./format", () => {
    expect(typeof Format.formatDate).toBe("function");
    expect(typeof Format.formatTime).toBe("function");
    expect(typeof Format.formatDateTime).toBe("function");
    expect(typeof Format.formatWithPattern).toBe("function");
  });

  it("exports parse symbols from ./parse", () => {
    expect(typeof Parse.parseLocalDate).toBe("function");
    expect(typeof Parse.parseInstant).toBe("function");
    expect(typeof Parse.safeParseLocalDate).toBe("function");
    expect(typeof Parse.safeParseInstant).toBe("function");
  });

  it("exports holidays symbols from ./holidays", () => {
    expect(typeof Holidays.getHolidayCalendar).toBe("function");
    expect(typeof Holidays.resolveAnnualHolidays).toBe("function");
    expect(typeof Holidays.calculateEasterSunday).toBe("function");
    expect(typeof Holidays.thailandHolidays).toBe("object");
    expect(typeof Holidays.japanHolidays).toBe("object");
  });
});
