import { describe, it, expect } from "vitest";
import {
  evaluateFixedRule,
  evaluateFloatingRule,
  evaluateEasterRule,
  evaluateHijriRule,
} from "../../../src/holidays/rules/index.js";

describe("Holiday Rules Evaluators", () => {
  describe("evaluateFixedRule", () => {
    it("evaluates fixed solar holiday without rollover", () => {
      const holidays = evaluateFixedRule(
        {
          type: "fixed",
          id: "test-fixed",
          month: 1,
          day: 1,
          name: "ปีใหม่",
          nameEn: "New Year",
          observed: "none",
        },
        2026,
        "TH",
      );

      expect(holidays).toHaveLength(1);
      expect(holidays[0]!.date.year).toBe(2026);
      expect(holidays[0]!.date.month).toBe(1);
      expect(holidays[0]!.date.day).toBe(1);
      expect(holidays[0]!.isObserved).toBe(false);
    });

    it("applies sat-to-fri-sun-to-mon rollover (US federal rule)", () => {
      // July 4, 2026 is Saturday -> should roll to Friday July 3, 2026!
      const holidays = evaluateFixedRule(
        {
          type: "fixed",
          id: "us-independence",
          month: 7,
          day: 4,
          name: "Independence Day",
          nameEn: "Independence Day",
          observed: "sat-to-fri-sun-to-mon",
        },
        2026,
        "US",
      );

      expect(holidays).toHaveLength(2);
      expect(holidays[0]!.date.day).toBe(4);
      expect(holidays[0]!.isObserved).toBe(false);

      expect(holidays[1]!.date.day).toBe(3); // Friday July 3!
      expect(holidays[1]!.isObserved).toBe(true);
    });

    it("applies weekend-to-monday rollover (Thai / UK rule)", () => {
      // King Chulalongkorn Day Oct 23, 2027 is Saturday -> rolls to Monday Oct 25, 2027
      const holidays = evaluateFixedRule(
        {
          type: "fixed",
          id: "th-chulalongkorn",
          month: 10,
          day: 23,
          name: "วันปิยมหาราช",
          nameEn: "Chulalongkorn Day",
          observed: "weekend-to-monday",
        },
        2027,
        "TH",
      );

      expect(holidays).toHaveLength(2);
      expect(holidays[1]!.date.day).toBe(25); // Monday Oct 25
      expect(holidays[1]!.isObserved).toBe(true);
    });
  });

  describe("evaluateFloatingRule", () => {
    it("evaluates US Thanksgiving (4th Thursday of November)", () => {
      const thanksgiving = evaluateFloatingRule(
        {
          type: "floating",
          id: "us-thanksgiving",
          month: 11,
          weekday: 4, // Thursday
          occurrence: 4,
          name: "Thanksgiving",
          nameEn: "Thanksgiving",
        },
        2026,
        "US",
      );

      expect(thanksgiving).toHaveLength(1);
      expect(thanksgiving[0]!.date.year).toBe(2026);
      expect(thanksgiving[0]!.date.month).toBe(11);
      expect(thanksgiving[0]!.date.day).toBe(26); // Nov 26, 2026
    });

    it("evaluates Memorial Day (Last Monday of May)", () => {
      const memorial = evaluateFloatingRule(
        {
          type: "floating",
          id: "us-memorial",
          month: 5,
          weekday: 1, // Monday
          occurrence: -1, // Last Monday
          name: "Memorial Day",
          nameEn: "Memorial Day",
        },
        2026,
        "US",
      );

      expect(memorial).toHaveLength(1);
      expect(memorial[0]!.date.year).toBe(2026);
      expect(memorial[0]!.date.month).toBe(5);
      expect(memorial[0]!.date.day).toBe(25); // May 25, 2026
    });

    it("evaluates Japan Coming of Age Day (2nd Monday of January)", () => {
      const comingOfAge = evaluateFloatingRule(
        {
          type: "floating",
          id: "jp-coming-of-age",
          month: 1,
          weekday: 1,
          occurrence: 2,
          name: "成人の日",
          nameEn: "Coming of Age Day",
        },
        2026,
        "JP",
      );

      expect(comingOfAge).toHaveLength(1);
      expect(comingOfAge[0]!.date.year).toBe(2026);
      expect(comingOfAge[0]!.date.month).toBe(1);
      expect(comingOfAge[0]!.date.day).toBe(12); // Jan 12, 2026
    });
  });

  describe("evaluateEasterRule", () => {
    it("evaluates Good Friday and Easter Monday rules", () => {
      const gf = evaluateEasterRule(
        {
          type: "easter",
          id: "gb-good-friday",
          offsetDays: -2,
          name: "Good Friday",
          nameEn: "Good Friday",
        },
        2026,
        "GB",
      );
      expect(gf[0]!.date.month).toBe(4);
      expect(gf[0]!.date.day).toBe(3); // April 3, 2026

      const em = evaluateEasterRule(
        {
          type: "easter",
          id: "gb-easter-monday",
          offsetDays: 1,
          name: "Easter Monday",
          nameEn: "Easter Monday",
        },
        2026,
        "GB",
      );
      expect(em[0]!.date.month).toBe(4);
      expect(em[0]!.date.day).toBe(6); // April 6, 2026
    });

    it("evaluates Easter Sunday itself (offsetDays = 0)", () => {
      const easter = evaluateEasterRule(
        {
          type: "easter",
          id: "easter-sunday",
          offsetDays: 0,
          name: "Easter Sunday",
          nameEn: "Easter Sunday",
        },
        2026,
        "DE",
      );
      expect(easter).toHaveLength(1);
      expect(easter[0]!.date.month).toBe(4);
      expect(easter[0]!.date.day).toBe(5); // April 5, 2026
    });

    it("filters out rules outside validFromYear or validUntilYear", () => {
      const futureRule = evaluateEasterRule(
        {
          type: "easter",
          id: "future-easter",
          offsetDays: 0,
          name: "Future",
          nameEn: "Future",
          validFromYear: 2030,
        },
        2026,
        "DE",
      );
      expect(futureRule).toHaveLength(0);

      const pastRule = evaluateEasterRule(
        {
          type: "easter",
          id: "past-easter",
          offsetDays: 0,
          name: "Past",
          nameEn: "Past",
          validUntilYear: 2020,
        },
        2026,
        "DE",
      );
      expect(pastRule).toHaveLength(0);
    });
  });

  describe("evaluateFixedRule edge cases & rolls", () => {
    it("applies sunday-to-monday roll", () => {
      // March 1, 2026 is Sunday
      const holidays = evaluateFixedRule(
        {
          type: "fixed",
          id: "test-sun",
          month: 3,
          day: 1,
          name: "Sunday Holiday",
          nameEn: "Sunday Holiday",
          observed: "sunday-to-monday",
        },
        2026,
        "JP",
      );
      expect(holidays).toHaveLength(2);
      expect(holidays[1]!.date.day).toBe(2); // Monday March 2
      expect(holidays[1]!.isObserved).toBe(true);
    });

    it("applies iran-roll for Thursday and Friday weekends", () => {
      // Jan 1, 2026 is Thursday (dow 4) -> rolls +2 to Saturday Jan 3
      const thuHoliday = evaluateFixedRule(
        {
          type: "fixed",
          id: "ir-thu",
          month: 1,
          day: 1,
          name: "Thu Holiday",
          nameEn: "Thu Holiday",
          observed: "iran-roll",
        },
        2026,
        "IR",
      );
      expect(thuHoliday).toHaveLength(2);
      expect(thuHoliday[1]!.date.day).toBe(3); // Saturday

      // Jan 2, 2026 is Friday (dow 5) -> rolls +1 to Saturday Jan 3
      const friHoliday = evaluateFixedRule(
        {
          type: "fixed",
          id: "ir-fri",
          month: 1,
          day: 2,
          name: "Fri Holiday",
          nameEn: "Fri Holiday",
          observed: "iran-roll",
        },
        2026,
        "IR",
      );
      expect(friHoliday).toHaveLength(2);
      expect(friHoliday[1]!.date.day).toBe(3); // Saturday
    });

    it("respects includeObserved = false and year bounds", () => {
      const unobserved = evaluateFixedRule(
        {
          type: "fixed",
          id: "th-roll",
          month: 10,
          day: 23,
          name: "Chulalongkorn",
          nameEn: "Chulalongkorn",
          observed: "weekend-to-monday",
        },
        2027,
        "TH",
        false,
      );
      expect(unobserved).toHaveLength(1);
      expect(unobserved[0]!.isObserved).toBe(false);

      const future = evaluateFixedRule(
        {
          type: "fixed",
          id: "future",
          month: 1,
          day: 1,
          name: "Future",
          nameEn: "Future",
          validFromYear: 2030,
        },
        2026,
        "TH",
      );
      expect(future).toHaveLength(0);

      const past = evaluateFixedRule(
        {
          type: "fixed",
          id: "past",
          month: 1,
          day: 1,
          name: "Past",
          nameEn: "Past",
          validUntilYear: 2020,
        },
        2026,
        "TH",
      );
      expect(past).toHaveLength(0);
    });
  });

  describe("evaluateFloatingRule edge cases", () => {
    it("returns empty when 5th occurrence does not exist", () => {
      // February 2026 has only 28 days, no 5th Monday
      const res = evaluateFloatingRule(
        {
          type: "floating",
          id: "fifth-mon",
          month: 2,
          weekday: 1,
          occurrence: 5,
          name: "5th Monday",
          nameEn: "5th Monday",
        },
        2026,
        "US",
      );
      expect(res).toHaveLength(0);
    });

    it("filters out floating rules outside year bounds", () => {
      const future = evaluateFloatingRule(
        {
          type: "floating",
          id: "future",
          month: 11,
          weekday: 4,
          occurrence: 4,
          name: "Future",
          nameEn: "Future",
          validFromYear: 2030,
        },
        2026,
        "US",
      );
      expect(future).toHaveLength(0);

      const past = evaluateFloatingRule(
        {
          type: "floating",
          id: "past",
          month: 11,
          weekday: 4,
          occurrence: 4,
          name: "Past",
          nameEn: "Past",
          validUntilYear: 2020,
        },
        2026,
        "US",
      );
      expect(past).toHaveLength(0);
    });
  });

  describe("evaluateHijriRule", () => {
    it("evaluates Eid al-Fitr across consecutive statutory days", () => {
      const eid = evaluateHijriRule(
        {
          type: "hijri",
          id: "sa-eid-al-fitr",
          hijriMonth: 10,
          hijriDay: 1,
          durationDays: 4,
          name: "Eid al-Fitr",
          nameEn: "Eid al-Fitr",
        },
        2026,
        "SA",
      );

      expect(eid.length).toBeGreaterThanOrEqual(4);
      expect(eid[0]!.date.year).toBe(2026);
    });

    it("evaluates single-day Hijri holiday and handles year bounds", () => {
      const single = evaluateHijriRule(
        {
          type: "hijri",
          id: "islamic-new-year",
          hijriMonth: 1,
          hijriDay: 1,
          name: "Islamic New Year",
          nameEn: "Islamic New Year",
        },
        2026,
        "SA",
      );
      expect(single.length).toBeGreaterThan(0);
      expect(single[0]!.nameEn).toBe("Islamic New Year");

      const future = evaluateHijriRule(
        {
          type: "hijri",
          id: "future",
          hijriMonth: 1,
          hijriDay: 1,
          name: "Future",
          nameEn: "Future",
          validFromYear: 2030,
        },
        2026,
        "SA",
      );
      expect(future).toHaveLength(0);

      const past = evaluateHijriRule(
        {
          type: "hijri",
          id: "past",
          hijriMonth: 1,
          hijriDay: 1,
          name: "Past",
          nameEn: "Past",
          validUntilYear: 2020,
        },
        2026,
        "SA",
      );
      expect(past).toHaveLength(0);
    });
  });
});
