import { describe, expect, it } from "vitest";
import {
  calendarDate,
  convertCalendarDate,
  formatDate,
  localDate,
} from "../../../src/index.js";
import {
  japaneseAdapter,
  japaneseValidator,
} from "../../../src/calendar/japanese/index.js";
import { ChroneraError } from "../../../src/errors/errors.js";

describe("Japanese Imperial Era Calendar", () => {
  it("converts Reiwa dates and handles Year 1 (Gannen) transition", () => {
    // 2019-05-01 is Reiwa 1
    const dReiwa1 = localDate(2019, 5, 1);
    const calReiwa1 = convertCalendarDate(
      calendarDate({
        calendar: "gregory",
        year: 2019,
        monthCode: "M05",
        day: 1,
      }),
      "japanese",
    );
    expect(calReiwa1.value.era).toBe("reiwa");
    expect(calReiwa1.value.eraYear).toBe(1);

    // Official format produces 令和元年
    const formattedGannen = formatDate(dReiwa1, {
      preset: "japanese-official",
    });
    expect(formattedGannen).toBe("令和元年5月1日");

    // With weekday
    const formattedWeekday = formatDate(dReiwa1, {
      preset: "japanese-official-with-weekday",
    });
    expect(formattedWeekday).toContain("令和元年5月1日");
    expect(formattedWeekday).toContain("水"); // 2019-05-01 was Wednesday
  });

  it("converts Heisei boundary: 2019-04-30 is Heisei 31", () => {
    const calHeisei31 = convertCalendarDate(
      calendarDate({
        calendar: "gregory",
        year: 2019,
        monthCode: "M04",
        day: 30,
      }),
      "japanese",
    );
    expect(calHeisei31.value.era).toBe("heisei");
    expect(calHeisei31.value.eraYear).toBe(31);

    const formatted = formatDate(localDate(2019, 4, 30), {
      preset: "japanese-official",
    });
    expect(formatted).toBe("平成31年4月30日");
  });

  it("handles modern date 2026-09-02 (Reiwa 8)", () => {
    const d = localDate(2026, 9, 2);
    const cal = convertCalendarDate(
      calendarDate({
        calendar: "gregory",
        year: 2026,
        monthCode: "M09",
        day: 2,
      }),
      "japanese",
    );
    expect(cal.value.era).toBe("reiwa");
    expect(cal.value.eraYear).toBe(8);

    const formatted = formatDate(d, { preset: "japanese-official" });
    expect(formatted).toBe("令和8年9月2日");

    // Fullwidth digits
    const formattedFullwidth = formatDate(d, {
      preset: "japanese-official",
      numberingSystem: "fullwide",
    });
    expect(formattedFullwidth).toBe("令和８年９月２日");

    // Hanidec digits
    const formattedHanidec = formatDate(d, {
      preset: "japanese-official",
      numberingSystem: "hanidec",
    });
    expect(formattedHanidec).toBe("令和八年九月二日");
  });

  it("handles Showa and Taisho boundaries", () => {
    // 1989-01-07: Showa 64
    const calShowa64 = convertCalendarDate(
      calendarDate({
        calendar: "gregory",
        year: 1989,
        monthCode: "M01",
        day: 7,
      }),
      "japanese",
    );
    expect(calShowa64.value.era).toBe("showa");
    expect(calShowa64.value.eraYear).toBe(64);

    // 1989-01-08: Heisei 1
    const calHeisei1 = convertCalendarDate(
      calendarDate({
        calendar: "gregory",
        year: 1989,
        monthCode: "M01",
        day: 8,
      }),
      "japanese",
    );
    expect(calHeisei1.value.era).toBe("heisei");
    expect(calHeisei1.value.eraYear).toBe(1);

    // 1926-12-25: Showa 1
    const calShowa1 = convertCalendarDate(
      calendarDate({
        calendar: "gregory",
        year: 1926,
        monthCode: "M12",
        day: 25,
      }),
      "japanese",
    );
    expect(calShowa1.value.era).toBe("showa");
    expect(calShowa1.value.eraYear).toBe(1);

    // 1912-07-30: Taisho 1
    const calTaisho1 = convertCalendarDate(
      calendarDate({
        calendar: "gregory",
        year: 1912,
        monthCode: "M07",
        day: 30,
      }),
      "japanese",
    );
    expect(calTaisho1.value.era).toBe("taisho");
    expect(calTaisho1.value.eraYear).toBe(1);
  });

  it("round-trips Japanese CalendarDate back to Gregorian", () => {
    const japDate = calendarDate({
      calendar: "japanese",
      era: "reiwa",
      eraYear: 8,
      year: 2026,
      monthCode: "M09",
      day: 2,
    });
    const backToGreg = convertCalendarDate(japDate, "gregory");
    expect(backToGreg.value.year).toBe(2026);
    expect(backToGreg.value.monthCode).toBe("M09");
    expect(backToGreg.value.day).toBe(2);
  });

  it("validates Japanese calendar constraints and reports issues", () => {
    expect(japaneseValidator.daysInMonth(2024, "M02")).toBe(29);
    expect(japaneseValidator.isLeapYear(2024)).toBe(true);

    // Pre-Meiji out of range
    const preMeiji = calendarDate({
      calendar: "japanese",
      year: 1800,
      monthCode: "M01",
      day: 1,
    });
    const issues = japaneseValidator.validate(preMeiji);
    expect(issues.some((i) => i.code === "CHRONERA_OUT_OF_RANGE")).toBe(true);

    // Invalid era
    const badEra = calendarDate({
      calendar: "japanese",
      era: "unknown_era",
      year: 2026,
      monthCode: "M01",
      day: 1,
    });
    expect(
      japaneseValidator.validate(badEra).some((i) => i.path?.[0] === "era"),
    ).toBe(true);

    // Reject wrong calendar
    expect(() =>
      japaneseAdapter.validator.validate(
        calendarDate({
          calendar: "gregory",
          year: 2026,
          monthCode: "M01",
          day: 1,
        }),
      ),
    ).toThrow(ChroneraError);
  });
});
