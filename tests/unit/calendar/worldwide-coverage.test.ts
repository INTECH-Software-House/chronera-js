import { describe, expect, it } from "vitest";
import { calendarDate, formatDate, getIsoWeek } from "../../../src/index.js";
import {
  japaneseAdapter,
  japaneseValidator,
} from "../../../src/calendar/japanese/index.js";
import { rocAdapter, rocValidator } from "../../../src/calendar/roc/index.js";
import {
  daysInPersianMonth,
  persianAdapter,
  persianValidator,
} from "../../../src/calendar/persian/index.js";
import {
  daysInIndianMonth,
  indianAdapter,
  indianValidator,
} from "../../../src/calendar/indian/index.js";
import { formatJapaneseOfficialWithWeekdayPreset } from "../../../src/format/presets/japanese-official.js";
import { formatTaiwanOfficialPreset } from "../../../src/format/presets/taiwan-official.js";
import { ChroneraError } from "../../../src/errors/errors.js";

import type { LocalDate, MonthCode } from "../../../src/public-types.js";

describe("Worldwide Calendars and Presets - Coverage Boost", () => {
  it("covers Japanese error and boundary branches", () => {
    // Year > 9999
    expect(() =>
      japaneseAdapter.converter!.toAbsoluteDay(
        calendarDate({
          calendar: "japanese",
          year: 10000,
          monthCode: "M01",
          day: 1,
        }),
      ),
    ).toThrow(ChroneraError);

    // Invalid monthCode
    expect(() =>
      japaneseAdapter.converter!.toAbsoluteDay(
        calendarDate({
          calendar: "japanese",
          year: 2026,
          monthCode: "XYZ" as unknown as MonthCode,
          day: 1,
        }),
      ),
    ).toThrow(ChroneraError);

    expect(() =>
      japaneseValidator.daysInMonth(2026, "XYZ" as unknown as MonthCode),
    ).toThrow(ChroneraError);

    // fromAbsoluteDay out of range
    expect(() => japaneseAdapter.converter!.fromAbsoluteDay(-100000)).toThrow(
      ChroneraError,
    );

    // Japanese full weekday preset
    const jDate = calendarDate({
      calendar: "japanese",
      year: 2026,
      monthCode: "M09",
      day: 2,
    });
    const fullWd = formatJapaneseOfficialWithWeekdayPreset(jDate, 20698, {
      fullWeekday: true,
    });
    expect(fullWd).toContain("水曜日");

    // Gannen false option
    const reiwaCal = calendarDate({
      calendar: "japanese",
      era: "reiwa",
      eraYear: 1,
      year: 2019,
      monthCode: "M05",
      day: 1,
    });
    expect(formatDate(reiwaCal, { preset: "japanese-official" })).toBe(
      "令和元年5月1日",
    );
  });

  it("covers Taiwan ROC error and preset branches", () => {
    // Year > 9999
    expect(() =>
      rocAdapter.converter!.toAbsoluteDay(
        calendarDate({
          calendar: "roc",
          year: 9000,
          monthCode: "M01",
          day: 1,
        }),
      ),
    ).toThrow(ChroneraError);

    // Year < 1
    expect(() =>
      rocAdapter.converter!.toAbsoluteDay(
        calendarDate({
          calendar: "roc",
          year: 0,
          monthCode: "M01",
          day: 1,
        }),
      ),
    ).toThrow(ChroneraError);

    // Invalid monthCode
    expect(() =>
      rocAdapter.converter!.toAbsoluteDay(
        calendarDate({
          calendar: "roc",
          year: 115,
          monthCode: "XYZ" as unknown as MonthCode,
          day: 1,
        }),
      ),
    ).toThrow(ChroneraError);

    expect(() =>
      rocValidator.daysInMonth(115, "XYZ" as unknown as MonthCode),
    ).toThrow(ChroneraError);

    // fromAbsoluteDay before 1912
    expect(() => rocAdapter.converter!.fromAbsoluteDay(-30000)).toThrow(
      ChroneraError,
    );

    // Taiwan weekday options
    const rocDate = calendarDate({
      calendar: "roc",
      year: 115,
      monthCode: "M09",
      day: 2,
    });
    const shortWd = formatTaiwanOfficialPreset(rocDate, 20698, {
      weekday: "short",
    });
    expect(shortWd).toContain("（三）");

    const fullWd = formatTaiwanOfficialPreset(rocDate, 20698, {
      weekday: "full",
    });
    expect(fullWd).toContain("星期三");
  });

  it("covers Persian calendar error and calculation branches", () => {
    // Year < 1 or > 9999
    expect(() =>
      persianAdapter.converter!.toAbsoluteDay(
        calendarDate({
          calendar: "persian",
          year: 0,
          monthCode: "M01",
          day: 1,
        }),
      ),
    ).toThrow(ChroneraError);

    expect(() =>
      persianAdapter.converter!.toAbsoluteDay(
        calendarDate({
          calendar: "persian",
          year: 10000,
          monthCode: "M01",
          day: 1,
        }),
      ),
    ).toThrow(ChroneraError);

    // Invalid monthCode
    expect(() =>
      persianAdapter.converter!.toAbsoluteDay(
        calendarDate({
          calendar: "persian",
          year: 1403,
          monthCode: "XYZ" as unknown as MonthCode,
          day: 1,
        }),
      ),
    ).toThrow(ChroneraError);

    expect(() =>
      persianValidator.daysInMonth(1403, "XYZ" as unknown as MonthCode),
    ).toThrow(ChroneraError);

    // daysInPersianMonth out-of-range month
    expect(daysInPersianMonth(1403, 0)).toBe(0);
    expect(daysInPersianMonth(1403, 13)).toBe(0);

    // fromAbsoluteDay before Persian epoch
    expect(() => persianAdapter.converter!.fromAbsoluteDay(-500000)).toThrow(
      ChroneraError,
    );
  });

  it("covers Indian Saka calendar error and calculation branches", () => {
    // Year < 1
    expect(() =>
      indianAdapter.converter!.toAbsoluteDay(
        calendarDate({
          calendar: "indian",
          year: 0,
          monthCode: "M01",
          day: 1,
        }),
      ),
    ).toThrow(ChroneraError);

    // Invalid monthCode
    expect(() =>
      indianAdapter.converter!.toAbsoluteDay(
        calendarDate({
          calendar: "indian",
          year: 1946,
          monthCode: "XYZ" as unknown as MonthCode,
          day: 1,
        }),
      ),
    ).toThrow(ChroneraError);

    expect(() =>
      indianValidator.daysInMonth(1946, "XYZ" as unknown as MonthCode),
    ).toThrow(ChroneraError);

    // daysInIndianMonth out-of-range month
    expect(daysInIndianMonth(1946, 0)).toBe(0);
    expect(daysInIndianMonth(1946, 13)).toBe(0);

    // fromAbsoluteDay before Saka epoch
    expect(() => indianAdapter.converter!.fromAbsoluteDay(-700000)).toThrow(
      ChroneraError,
    );
  });

  it("covers ISO week invalid input branch", () => {
    expect(() => getIsoWeek({} as unknown as LocalDate)).toThrow(ChroneraError);
  });

  it("covers remaining validator and era branches", () => {
    // 1. Japanese pre-Meiji findJapaneseEraForAbsoluteDay fallback
    const earlyEra = japaneseAdapter.converter!.fromAbsoluteDay(-36998);
    expect(earlyEra.era).toBe("meiji");

    // 2. Japanese day < 1
    const jZeroDay = calendarDate({
      calendar: "japanese",
      year: 2026,
      monthCode: "M01",
      day: 0,
    });
    expect(
      japaneseValidator
        .validate(jZeroDay)
        .some((i) => i.code === "CHRONERA_INVALID_DATE"),
    ).toBe(true);

    // 3. ROC day < 1
    const rocZeroDay = calendarDate({
      calendar: "roc",
      year: 115,
      monthCode: "M01",
      day: 0,
    });
    expect(
      rocValidator
        .validate(rocZeroDay)
        .some((i) => i.code === "CHRONERA_INVALID_DATE"),
    ).toBe(true);

    // 4. Persian year < 1 or > 9999 validation
    const pYear0 = calendarDate({
      calendar: "persian",
      year: 0,
      monthCode: "M01",
      day: 1,
    });
    expect(
      persianValidator
        .validate(pYear0)
        .some((i) => i.code === "CHRONERA_OUT_OF_RANGE"),
    ).toBe(true);

    const pYear10k = calendarDate({
      calendar: "persian",
      year: 10000,
      monthCode: "M01",
      day: 1,
    });
    expect(
      persianValidator
        .validate(pYear10k)
        .some((i) => i.code === "CHRONERA_OUT_OF_RANGE"),
    ).toBe(true);

    // 5. Indian year < 1 or > 9900 validation
    const iYear0 = calendarDate({
      calendar: "indian",
      year: 0,
      monthCode: "M01",
      day: 1,
    });
    expect(
      indianValidator
        .validate(iYear0)
        .some((i) => i.code === "CHRONERA_OUT_OF_RANGE"),
    ).toBe(true);

    const iYear10k = calendarDate({
      calendar: "indian",
      year: 10000,
      monthCode: "M01",
      day: 1,
    });
    expect(
      indianValidator
        .validate(iYear10k)
        .some((i) => i.code === "CHRONERA_OUT_OF_RANGE"),
    ).toBe(true);
  });
});
