import { describe, expect, it } from "vitest";
import {
  calendarDate,
  compareLocalDates,
  createChronera,
  dateRange,
  formatDateRange,
  formatRelative,
  formatWithPattern,
  localDate,
  localDateTime,
  localTime,
  sameAbsoluteDate,
} from "../../src/index.js";
import { ChroneraError } from "../../src/errors/errors.js";
import { instantFromEpochMilliseconds } from "../../src/core/instant.js";
import { CalendarRegistry } from "../../src/calendar/registry.js";
import { BoundedLRU } from "../../src/runtime/bounded-lru.js";
import { validateAndResolveLocale } from "../../src/locale/resolve-locale.js";
import { formatNumberWithSystem } from "../../src/locale/numbering-system.js";

import type { CalendarPlugin } from "../../src/public-types.js";

describe("comprehensive branch & API coverage boost", () => {
  it("covers custom calendar plugins in registry end-to-end", () => {
    const mockPlugin: CalendarPlugin = {
      id: "fiscal-test",
      algorithm: "fiscal-test-v1",
      deterministic: true,
      validFrom: localDate(2020, 1, 1),
      validTo: localDate(2030, 12, 31),
      toIsoDate(d) {
        return localDate(d.year, 1, d.day);
      },
      fromIsoDate(iso) {
        return calendarDate({
          calendar: "fiscal-test",
          year: iso.year,
          monthCode: "M01",
          month: 1,
          day: iso.day,
        });
      },
      validate(d) {
        return d.day > 30
          ? [{ code: "CHRONERA_INVALID_DATE", message: "Day > 30" }]
          : [];
      },
    };

    const instance = createChronera({
      calendars: [mockPlugin],
    });

    const greg = calendarDate({
      calendar: "gregory",
      year: 2026,
      monthCode: "M05",
      day: 10,
    });

    const converted = instance.convertCalendarDate(greg, "fiscal-test");
    expect(converted.value.calendar).toBe("fiscal-test");
    expect(converted.metadata.engine).toBe("custom");

    const back = instance.convertCalendarDate(converted.value, "gregory");
    expect(back.value.year).toBe(2026);
  });

  it("covers registry error handling (limit 64 plugins, forbidden override)", () => {
    expect(() => {
      new CalendarRegistry([
        {
          id: "gregory",
          algorithm: "fake",
          deterministic: true,
          validFrom: localDate(2020, 1, 1),
          validTo: localDate(2030, 12, 31),
          toIsoDate: () => localDate(2020, 1, 1),
          fromIsoDate: () =>
            calendarDate({
              calendar: "gregory",
              year: 2020,
              monthCode: "M01",
              day: 1,
            }),
          validate: () => [],
        },
      ]);
    }).toThrow(ChroneraError);

    expect(() => {
      const plugins: CalendarPlugin[] = Array.from({ length: 65 }, (_, i) => ({
        id: `cal-${i}`,
        algorithm: "fake",
        deterministic: true,
        validFrom: localDate(2020, 1, 1),
        validTo: localDate(2030, 12, 31),
        toIsoDate: () => localDate(2020, 1, 1),
        fromIsoDate: () =>
          calendarDate({
            calendar: `cal-${i}`,
            year: 2020,
            monthCode: "M01",
            day: 1,
          }),
        validate: () => [],
      }));
      new CalendarRegistry(plugins);
    }).toThrow(ChroneraError);
  });

  it("covers formatDateRange branches (CalendarDate, Instant, collapse: none, errors)", () => {
    const c1 = calendarDate({
      calendar: "gregory",
      year: 2026,
      monthCode: "M01",
      day: 1,
    });
    const c2 = calendarDate({
      calendar: "gregory",
      year: 2026,
      monthCode: "M01",
      day: 10,
    });
    const outCal = formatDateRange(dateRange(c1, c2), {
      locale: "en-US",
      collapse: "none",
    });
    expect(outCal).toContain("–");

    const i1 = instantFromEpochMilliseconds(100000);
    const i2 = instantFromEpochMilliseconds(200000);
    const outInst = formatDateRange(dateRange(i1, i2), {
      locale: "en-US",
      timeZone: "UTC",
    });
    expect(outInst).toBeDefined();

    // Mixed calendars
    const cBuddhist = calendarDate({
      calendar: "buddhist",
      year: 2569,
      monthCode: "M01",
      day: 1,
    });
    expect(() => formatDateRange(dateRange(c1, cBuddhist))).toThrow(
      ChroneraError,
    );

    // Start > End for CalendarDate
    expect(() => formatDateRange(dateRange(c2, c1))).toThrow(ChroneraError);

    // Start > End for Instant
    expect(() =>
      formatDateRange(dateRange(i2, i1), { timeZone: "UTC" }),
    ).toThrow(ChroneraError);

    // Mixed kinds
    expect(() =>
      formatDateRange(
        dateRange(
          localDate(2026, 1, 1),
          i1 as unknown as ReturnType<typeof localDate>,
        ),
      ),
    ).toThrow(ChroneraError);
  });

  it("covers all pattern tokens in formatWithPattern", () => {
    const ldt = localDateTime(
      localDate(2026, 9, 2),
      localTime(15, 30, 45, 678),
    );

    const fullPattern =
      "y yy yyyy M MM MMM MMMM d dd E EEEE G GGGG H HH h hh a m mm s ss S SSS";
    const res = formatWithPattern(ldt, fullPattern, {
      locale: "en-US",
      numberingSystem: "latn",
    });

    expect(res).toContain("2026");
    expect(res).toContain("26");
    expect(res).toContain("Sep");
    expect(res).toContain("September");
    expect(res).toContain("02");
    expect(res).toContain("15");
    expect(res).toContain("03");
    expect(res).toContain("PM");
    expect(res).toContain("30");
    expect(res).toContain("45");
    expect(res).toContain("678");
  });

  it("covers formatRelative units and threshold branches", () => {
    const now = instantFromEpochMilliseconds(1000000000);

    // Minute threshold
    const tMinute = instantFromEpochMilliseconds(1000000000 + 120000);
    expect(formatRelative(tMinute, { relativeTo: now, locale: "en-US" })).toBe(
      "in 2 minutes",
    );

    // Hour threshold
    const tHour = instantFromEpochMilliseconds(1000000000 + 7200000);
    expect(formatRelative(tHour, { relativeTo: now, locale: "en-US" })).toBe(
      "in 2 hours",
    );

    // Week threshold
    const tWeek = instantFromEpochMilliseconds(1000000000 + 86400000 * 14);
    expect(formatRelative(tWeek, { relativeTo: now, locale: "en-US" })).toBe(
      "in 2 weeks",
    );

    // Explicit unit month and year
    expect(
      formatRelative(tWeek, {
        relativeTo: now,
        unit: "month",
        locale: "en-US",
      }),
    ).toBeDefined();

    expect(
      formatRelative(tWeek, {
        relativeTo: now,
        unit: "year",
        locale: "en-US",
      }),
    ).toBeDefined();

    // Greater than 28 days without unit throws
    const tBig = instantFromEpochMilliseconds(1000000000 + 86400000 * 35);
    expect(() =>
      formatRelative(tBig, { relativeTo: now, locale: "en-US" }),
    ).toThrow(ChroneraError);
  });

  it("covers compareLocalDates year & month branches and compare errors", () => {
    expect(
      compareLocalDates(localDate(2025, 9, 2), localDate(2026, 9, 2)),
    ).toBe(-1);
    expect(
      compareLocalDates(localDate(2027, 9, 2), localDate(2026, 9, 2)),
    ).toBe(1);
    expect(
      compareLocalDates(localDate(2026, 8, 2), localDate(2026, 9, 2)),
    ).toBe(-1);
    expect(
      compareLocalDates(localDate(2026, 10, 2), localDate(2026, 9, 2)),
    ).toBe(1);

    const umalqura = calendarDate({
      calendar: "islamic-umalqura",
      year: 1445,
      monthCode: "M01",
      day: 1,
    });
    const greg = calendarDate({
      calendar: "gregory",
      year: 2026,
      monthCode: "M01",
      day: 1,
    });
    expect(() => sameAbsoluteDate(umalqura, greg)).toThrow(ChroneraError);
  });

  it("covers BoundedLRU size, capacity, clear, and overwrite", () => {
    const lru = new BoundedLRU<number>(3);
    lru.set("a", 1);
    lru.set("b", 2);
    expect(lru.size).toBe(2);
    expect(lru.capacity).toBe(3);
    expect(lru.has("a")).toBe(true);
    expect(lru.has("nonexistent")).toBe(false);
    // Overwrite existing key
    lru.set("a", 10);
    expect(lru.get("a")).toBe(10);
    lru.clear();
    expect(lru.size).toBe(0);
  });

  it("covers locale resolver limit of 16 candidate tags", () => {
    const manyTags = Array.from({ length: 17 }, (_, i) => `en-US-${i}`).join(
      ",",
    );
    expect(() => validateAndResolveLocale(manyTags)).toThrow(ChroneraError);
  });

  it("covers arabext numbering system", () => {
    expect(formatNumberWithSystem(123, "arabext")).toBe("۱۲۳");
  });
});
