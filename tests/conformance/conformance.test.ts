import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { convertCalendarDate } from "../../src/operations/convert-calendar-date.js";

import type { CalendarDate, MonthCode } from "../../src/public-types.js";

describe("conformance fixtures", () => {
  it("passes Buddhist calendar conformance vectors", async () => {
    const fixturePath = join(
      process.cwd(),
      "tests",
      "conformance",
      "buddhist",
      "buddhist-vectors.json",
    );
    const content = await readFile(fixturePath, "utf-8");
    const fixture = JSON.parse(content);

    for (const c of fixture.cases) {
      const greg: CalendarDate = {
        kind: "calendar-date",
        calendar: "gregory",
        year: c.gregorian.year,
        monthCode: c.gregorian.monthCode as MonthCode,
        day: c.gregorian.day,
      };

      const result = convertCalendarDate(greg, "buddhist");
      expect(result.value.year).toBe(c.target.year);
      expect(result.value.monthCode).toBe(c.target.monthCode);
      expect(result.value.day).toBe(c.target.day);
      expect(result.value.era).toBe(c.target.era);
    }
  });

  it("passes Gregorian calendar conformance vectors", async () => {
    const fixturePath = join(
      process.cwd(),
      "tests",
      "conformance",
      "gregorian",
      "gregorian-vectors.json",
    );
    const content = await readFile(fixturePath, "utf-8");
    const fixture = JSON.parse(content);

    for (const c of fixture.cases) {
      const greg: CalendarDate = {
        kind: "calendar-date",
        calendar: "gregory",
        year: c.gregorian.year,
        monthCode: c.gregorian.monthCode as MonthCode,
        day: c.gregorian.day,
      };

      const result = convertCalendarDate(greg, "gregory");
      expect(result.value.year).toBe(c.target.year);
      expect(result.value.monthCode).toBe(c.target.monthCode);
      expect(result.value.day).toBe(c.target.day);
    }
  });
});
