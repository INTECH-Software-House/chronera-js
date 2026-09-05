import { describe, it, expect } from "vitest";
import {
  registerHolidayCalendar,
  getHolidayCalendar,
  resolveAnnualHolidays,
} from "../../../src/holidays/registry.js";
import { localDate } from "../../../src/core/local-date.js";
import { ChroneraError } from "../../../src/errors/errors.js";

describe("Holiday Registry & Resolvers", () => {
  it("resolves built-in country holidays and caches result", () => {
    const holidays1 = resolveAnnualHolidays("TH", 2026);
    const holidays2 = resolveAnnualHolidays("TH", 2026);

    expect(holidays1).toBe(holidays2); // same cached reference
    expect(holidays1.length).toBeGreaterThan(0);
  });

  it("supports includeObserved = false option", () => {
    const withObserved = resolveAnnualHolidays("US", 2026, {
      includeObserved: true,
    });
    const withoutObserved = resolveAnnualHolidays("US", 2026, {
      includeObserved: false,
    });

    expect(withObserved.some((h) => h.isObserved)).toBe(true);
    expect(withoutObserved.every((h) => !h.isObserved)).toBe(true);
  });

  it("throws CHRONERA_INVALID_LOCALE for unsupported country code", () => {
    expect(() => getHolidayCalendar("XX")).toThrowError(ChroneraError);
    try {
      getHolidayCalendar("XX");
    } catch (err) {
      expect((err as ChroneraError).code).toBe("CHRONERA_INVALID_LOCALE");
    }
  });

  it("accepts HolidayCalendar object directly in getHolidayCalendar and resolveAnnualHolidays", () => {
    const customCal = {
      country: "CORP",
      countryName: "Corporate Holidays",
      rules: [
        {
          type: "fixed" as const,
          id: "corp-founding-day",
          month: 6,
          day: 15,
          name: "Company Founding Day",
          nameEn: "Company Founding Day",
        },
      ],
    };

    const retrieved = getHolidayCalendar(customCal);
    expect(retrieved).toBe(customCal);

    const holidays = resolveAnnualHolidays(customCal, 2026);
    expect(holidays).toHaveLength(1);
    expect(holidays[0]!.nameEn).toBe("Company Founding Day");
  });

  it("registers custom calendar via registerHolidayCalendar", () => {
    registerHolidayCalendar({
      country: "ACME",
      countryName: "Acme Corp",
      rules: [
        {
          type: "fixed",
          id: "acme-day",
          month: 3,
          day: 10,
          name: "Acme Day",
          nameEn: "Acme Day",
        },
      ],
    });

    const holidays = resolveAnnualHolidays("ACME", 2026);
    expect(holidays).toHaveLength(1);
    expect(holidays[0]!.id).toBe("acme-day");
  });

  it("supports additionalHolidays option", () => {
    const additional = [localDate(2026, 12, 30), localDate(2026, 1, 2)];
    const holidays = resolveAnnualHolidays("TH", 2026, {
      additionalHolidays: additional,
    });

    expect(holidays.some((h) => h.id === "custom-additional-1")).toBe(true);
    expect(holidays.some((h) => h.id === "custom-additional-2")).toBe(true);
    // Should be chronologically sorted
    for (let i = 1; i < holidays.length; i++) {
      const prev = holidays[i - 1]!.date;
      const curr = holidays[i]!.date;
      const prevVal = prev.year * 10000 + prev.month * 100 + prev.day;
      const currVal = curr.year * 10000 + curr.month * 100 + curr.day;
      expect(currVal).toBeGreaterThanOrEqual(prevVal);
    }
  });
});
