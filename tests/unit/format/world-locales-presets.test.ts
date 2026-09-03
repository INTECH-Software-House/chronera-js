import { describe, expect, it } from "vitest";
import { calendarDate, formatDate, localDate } from "../../../src/index.js";

describe("10 World Locales Official Formatting Presets", () => {
  const d = localDate(2026, 9, 2); // Wednesday, Sept 2, 2026

  it("formats US English presets (us-standard, us-long, us-with-weekday)", () => {
    expect(formatDate(d, { preset: "us-standard" })).toBe("09/02/2026");
    expect(formatDate(d, { preset: "us-long" })).toBe("September 2, 2026");
    expect(formatDate(d, { preset: "us-with-weekday" })).toBe(
      "Wednesday, September 2, 2026",
    );
  });

  it("formats UK English presets (uk-standard, uk-long, uk-with-weekday)", () => {
    expect(formatDate(d, { preset: "uk-standard" })).toBe("02/09/2026");
    expect(formatDate(d, { preset: "uk-long" })).toBe("2 September 2026");
    expect(formatDate(d, { preset: "uk-with-weekday" })).toBe(
      "Wednesday, 2 September 2026",
    );
  });

  it("formats German DIN 5008 presets (german-din-standard, german-long, german-with-weekday)", () => {
    expect(formatDate(d, { preset: "german-din-standard" })).toBe("02.09.2026");
    expect(formatDate(d, { preset: "german-long" })).toBe("2. September 2026");
    expect(formatDate(d, { preset: "german-with-weekday" })).toBe(
      "Mittwoch, 2. September 2026",
    );
  });

  it("formats French AFNOR presets (french-standard, french-long, french-with-weekday)", () => {
    expect(formatDate(d, { preset: "french-standard" })).toBe("02/09/2026");
    expect(formatDate(d, { preset: "french-long" })).toBe("2 septembre 2026");
    expect(formatDate(d, { preset: "french-with-weekday" })).toBe(
      "mercredi 2 septembre 2026",
    );
  });

  it("formats Chinese Simplified presets (chinese-standard, chinese-with-weekday, chinese-short)", () => {
    expect(formatDate(d, { preset: "chinese-standard" })).toBe("2026年9月2日");
    expect(formatDate(d, { preset: "chinese-with-weekday" })).toBe(
      "2026年9月2日 星期三",
    );
    expect(formatDate(d, { preset: "chinese-short" })).toBe("2026/09/02");
  });

  it("formats Spanish RAE presets (spanish-standard, spanish-long, spanish-with-weekday)", () => {
    expect(formatDate(d, { preset: "spanish-standard" })).toBe("02/09/2026");
    expect(formatDate(d, { preset: "spanish-long" })).toBe(
      "2 de septiembre de 2026",
    );
    expect(formatDate(d, { preset: "spanish-with-weekday" })).toBe(
      "miércoles, 2 de septiembre de 2026",
    );
  });

  it("formats Arabic Gregorian and Hijri presets", () => {
    const arGreg = formatDate(d, { preset: "arabic-gregorian" });
    expect(arGreg).toContain("سبتمبر");
    expect(arGreg).toContain("م");

    // Arabic Hijri
    const arHijri = formatDate(d, { preset: "arabic-hijri" });
    expect(arHijri).toContain("هـ");
  });

  it("formats Japanese Seireki and Era Short presets", () => {
    expect(formatDate(d, { preset: "japanese-seireki" })).toBe("2026年9月2日");
    // 2026 is Reiwa 8 -> R08.09.02
    expect(formatDate(d, { preset: "japanese-era-short" })).toBe("R08.09.02");

    // With CalendarDate
    const jDate = calendarDate({
      calendar: "japanese",
      era: "reiwa",
      eraYear: 8,
      year: 2026,
      monthCode: "M09",
      day: 2,
    });
    expect(formatDate(jDate, { preset: "japanese-era-short" })).toBe(
      "R08.09.02",
    );
  });

  it("formats Thai Short and Slash presets", () => {
    expect(formatDate(d, { preset: "thai-short-date" })).toBe("2 ก.ย. 2569");
    expect(formatDate(d, { preset: "thai-slash-date" })).toBe("02/09/2569");

    // With Buddhist CalendarDate
    const bDate = calendarDate({
      calendar: "buddhist",
      year: 2569,
      monthCode: "M09",
      day: 2,
    });
    expect(formatDate(bDate, { preset: "thai-short-date" })).toBe(
      "2 ก.ย. 2569",
    );
    expect(formatDate(bDate, { preset: "thai-slash-date" })).toBe("02/09/2569");
  });

  it("formats numeric style with formatDate", () => {
    const numericStr = formatDate(d, { style: "numeric", locale: "en-US" });
    expect(numericStr).toMatch(/9\/2\/2026/);
  });
});
