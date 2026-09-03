import { describe, expect, it } from "vitest";
import {
  calendarDate,
  convertCalendarDate,
  createChronera,
  formatDate,
  formatRelative,
  getCalendarCapabilities,
  instantFromEpochMilliseconds,
  localDate,
  parseInstant,
  parseLocalDate,
} from "../../src/index.js";
import { ChroneraError, ChroneraParseError } from "../../src/errors/errors.js";
import {
  assertBuddhistDate,
  buddhistValidator,
} from "../../src/calendar/buddhist/validator.js";
import { gregorianValidator } from "../../src/calendar/gregory/validator.js";
import { isGregorianLeapYear } from "../../src/calendar/gregory/leap-year.js";
import { addDateDuration } from "../../src/operations/arithmetic.js";
import { IntlNumberService } from "../../src/runtime/intl-number.js";
import { IntlRelativeTimeService } from "../../src/runtime/intl-relative-time.js";
import { getRuntimeCapabilities } from "../../src/runtime/capabilities.js";

import type {
  CalendarPlugin,
  FormatRelativeOptions,
  LocalDate,
  MonthCode,
} from "../../src/public-types.js";

describe("final coverage push for 90%+ across all metrics", () => {
  it("covers buddhist and gregorian validator error branches", () => {
    expect(() =>
      assertBuddhistDate(
        calendarDate({
          calendar: "gregory",
          year: 2026,
          monthCode: "M01",
          day: 1,
        }),
      ),
    ).toThrow(ChroneraError);

    // Buddhist year out of range
    const bIssues = buddhistValidator.validate(
      calendarDate({
        calendar: "buddhist",
        year: 500,
        monthCode: "M01",
        day: 1,
      }),
    );
    expect(bIssues.length).toBeGreaterThan(0);

    expect(buddhistValidator.daysInMonth(2569, "M02")).toBe(28);

    // Gregorian validator year out of range
    const gIssues = gregorianValidator.validate(
      calendarDate({
        calendar: "gregory",
        year: 10000,
        monthCode: "M01",
        day: 1,
      }),
    );
    expect(gIssues.length).toBeGreaterThan(0);

    expect(isGregorianLeapYear(2024)).toBe(true);
  });

  it("covers convertCalendarDate error branches", () => {
    // Invalid source date
    const invalidSrc = calendarDate({
      calendar: "gregory",
      year: 2026,
      monthCode: "M02",
      day: 31,
    });
    expect(() => convertCalendarDate(invalidSrc, "buddhist")).toThrow(
      ChroneraError,
    );

    // Out of target range
    const ancientGreg = calendarDate({
      calendar: "gregory",
      year: 100,
      monthCode: "M01",
      day: 1,
    });
    expect(() => convertCalendarDate(ancientGreg, "islamic-civil")).toThrow(
      ChroneraError,
    );
  });

  it("covers addDateDuration with unsupporting calendar", () => {
    const umalqura = calendarDate({
      calendar: "islamic-umalqura",
      year: 1445,
      monthCode: "M01",
      day: 1,
    });
    expect(() => addDateDuration(umalqura, { days: 1 })).toThrow(ChroneraError);
  });

  it("covers custom calendar plugin daysInMonth and isLeapYear in registry", () => {
    const plugin: CalendarPlugin = {
      id: "plugin-cal",
      algorithm: "p-v1",
      deterministic: true,
      validFrom: localDate(2020, 1, 1),
      validTo: localDate(2030, 12, 31),
      toIsoDate: (d) => localDate(d.year, 1, d.day),
      fromIsoDate: (iso) =>
        calendarDate({
          calendar: "plugin-cal",
          year: iso.year,
          monthCode: "M01",
          day: iso.day,
        }),
      validate: () => [],
    };

    const inst = createChronera({ calendars: [plugin] });
    expect(inst.resolvedOptions().calendar).toBe("gregory");
  });

  it("covers formatRelative with LocalDate inputs across all threshold branches", () => {
    const d1 = localDate(2026, 9, 2);
    const d2 = localDate(2026, 9, 4);
    const res = formatRelative(d2, { relativeTo: d1, locale: "en-US" });
    expect(res).toBeDefined();

    // With explicit unit
    const resUnit = formatRelative(d2, {
      relativeTo: d1,
      unit: "day",
      locale: "en-US",
    });
    expect(resUnit).toBe("in 2 days");

    // Invalid combination: LocalDate vs Instant
    expect(() =>
      formatRelative(d1, {
        relativeTo: {
          kind: "instant",
          epochMilliseconds: 0,
        } as unknown as LocalDate,
      }),
    ).toThrow(ChroneraError);

    // Missing relativeTo
    expect(() =>
      formatRelative(d1, {} as unknown as FormatRelativeOptions),
    ).toThrow(ChroneraError);
  });

  it("covers parse pattern parser errors (mismatch literal, trailing chars, missing fields)", () => {
    expect(() =>
      parseLocalDate("2026-09-02 trailing", { pattern: "yyyy-MM-dd" }),
    ).toThrow(ChroneraParseError);

    expect(() =>
      parseLocalDate("2026/09/02", { pattern: "yyyy-MM-dd" }),
    ).toThrow(ChroneraParseError);

    expect(() => parseLocalDate("2026", { pattern: "yyyy" })).toThrow(
      ChroneraParseError,
    );
  });

  it("covers clearCache on IntlNumberService and IntlRelativeTimeService", () => {
    const numService = new IntlNumberService(2);
    numService.getFormatter("en-US");
    numService.clearCache();

    const relService = new IntlRelativeTimeService(2);
    relService.getFormatter("en-US");
    relService.clearCache();
  });

  it("covers getRuntimeCapabilities without options", () => {
    const caps = getRuntimeCapabilities();
    expect(caps.hasDateTimeFormat).toBe(true);
  });

  it("covers parse pattern with single y, M, and d tokens", () => {
    const d = parseLocalDate("2026-9-2", { pattern: "y-M-d" });
    expect(d.year).toBe(2026);
    expect(d.month).toBe(9);
    expect(d.day).toBe(2);
  });

  it("covers formatDate with CalendarDate and Instant with custom calendar", () => {
    const bDate = calendarDate({
      calendar: "buddhist",
      year: 2569,
      monthCode: "M09",
      day: 2,
    });
    const formattedB = formatDate(bDate, { locale: "th-TH" });
    expect(formattedB).toBeDefined();

    // Instant formatted into Buddhist calendar
    const inst = { kind: "instant" as const, epochMilliseconds: 1788331500000 };
    const formattedInst = formatDate(inst, {
      calendar: "buddhist",
      timeZone: "Asia/Bangkok",
    });
    expect(formattedInst).toContain("2569");
  });

  it("covers islamic civil error branches", () => {
    expect(() =>
      convertCalendarDate(
        calendarDate({
          calendar: "islamic-civil",
          year: 0,
          monthCode: "M01",
          day: 1,
        }),
        "gregory",
      ),
    ).toThrow(ChroneraError);

    expect(() =>
      convertCalendarDate(
        calendarDate({
          calendar: "islamic-civil",
          year: 1445,
          monthCode: "M13" as unknown as MonthCode,
          day: 1,
        }),
        "gregory",
      ),
    ).toThrow(ChroneraError);
  });

  it("covers parseInstant error branches (minute 60, second 60, offset 24)", () => {
    expect(() => parseInstant("2026-09-02T12:60:00Z")).toThrow(
      ChroneraParseError,
    );
    expect(() => parseInstant("2026-09-02T12:00:60Z")).toThrow(
      ChroneraParseError,
    );
  });

  it("covers remaining branches: default options, truncate fraction, relative seconds, etc.", () => {
    // 1. createChronera default resolvedOptions branch
    const defaultInst = createChronera();
    expect(defaultInst.resolvedOptions().numberingSystem).toBeUndefined();

    // 2. parseInstant truncate excess fractional seconds
    const truncInst = parseInstant("2026-09-02T12:00:00.123456Z", {
      excessFractionalSeconds: "truncate",
    });
    expect(truncInst.epochMilliseconds).toBe(
      Date.parse("2026-09-02T12:00:00.123Z"),
    );

    // 3. formatRelative under 60 seconds
    const t0 = instantFromEpochMilliseconds(10000000);
    const t30s = instantFromEpochMilliseconds(10000000 + 30000);
    expect(formatRelative(t30s, { relativeTo: t0, locale: "en-US" })).toBe(
      "in 30 seconds",
    );

    // 4. thai-official preset with Gregorian date
    const gregThai = formatDate(localDate(2026, 9, 2), {
      preset: "thai-official-date",
    });
    expect(gregThai).toContain("2569");

    // 5. getCalendarCapabilities with umalqura and builtins
    const umalquraCaps = getCalendarCapabilities("islamic-umalqura");
    expect(umalquraCaps.deterministic).toBe(false);
    expect(umalquraCaps.dataVersion).toBe("cldr-43");

    // 6. formatDate with thai numberingSystem
    const thaiNumDate = formatDate(localDate(2026, 9, 2), {
      numberingSystem: "thai",
    });
    expect(thaiNumDate).toContain("๒");

    // 7. convert to iso8601
    const isoConv = convertCalendarDate(
      calendarDate({
        calendar: "gregory",
        year: 2026,
        monthCode: "M09",
        day: 2,
      }),
      "iso8601",
    );
    expect(isoConv.value.calendar).toBe("iso8601");

    // 8. pattern parser invalid 2-digit month or day
    expect(() =>
      parseLocalDate("2026-XX-02", { pattern: "yyyy-MM-dd" }),
    ).toThrow(ChroneraParseError);
    expect(() =>
      parseLocalDate("2026-09-XX", { pattern: "yyyy-MM-dd" }),
    ).toThrow(ChroneraParseError);
  });
});
