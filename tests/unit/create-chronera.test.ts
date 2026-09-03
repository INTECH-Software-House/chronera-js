import { describe, expect, it } from "vitest";
import { createChronera } from "../../src/create-chronera.js";
import { parseLocalDate } from "../../src/parse/parse-local-date.js";
import type { CalendarDate, LocalDate } from "../../src/public-types.js";

describe("createChronera", () => {
  it("creates configured instance with custom defaults", () => {
    const thai = createChronera({
      locale: "th-TH",
      calendar: "buddhist",
      numberingSystem: "latn",
      timeZone: "Asia/Bangkok",
    });

    const opts = thai.resolvedOptions();
    expect(opts.calendar).toBe("buddhist");
    expect(opts.locale).toBe("th-TH");

    const date = parseLocalDate("2026-09-02");
    const output = thai.formatDate(date, { style: "long" });
    expect(output).toContain("2569");
  });

  it("supports custom calendar plugin", () => {
    const fiscalCalendar = {
      id: "company-fiscal",
      algorithm: "custom-fiscal-v1",
      deterministic: true,
      validFrom: { kind: "local-date" as const, year: 2020, month: 1, day: 1 },
      validTo: { kind: "local-date" as const, year: 2030, month: 12, day: 31 },
      toIsoDate(date: CalendarDate) {
        return {
          kind: "local-date" as const,
          year: date.year,
          month: 1,
          day: 1,
        };
      },
      fromIsoDate(date: LocalDate) {
        return {
          kind: "calendar-date" as const,
          calendar: "company-fiscal",
          year: date.year,
          monthCode: "M01" as const,
          day: 1,
        };
      },
      validate() {
        return [];
      },
    };

    const instance = createChronera({
      calendars: [fiscalCalendar],
      calendar: "company-fiscal",
    });

    expect(instance.resolvedOptions().calendar).toBe("company-fiscal");
  });
});
