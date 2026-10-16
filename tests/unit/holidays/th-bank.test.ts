import { describe, it, expect } from "vitest";
import {
  isBankHoliday,
  getBankHolidays,
  isPublicHoliday,
  isBankBusinessDay,
  addBankBusinessDays,
  diffInBankBusinessDays,
  addBusinessDays,
  chronera,
  localDate,
  thailandBankHolidays,
} from "../../../src/index.js";

describe("Bank of Thailand (BOT / ธปท.) Financial Holidays Calendar", () => {
  it("thailandBankHolidays calendar object is properly structured", () => {
    expect(thailandBankHolidays.country).toBe("TH-BOT");
    expect(thailandBankHolidays.countryName).toBe(
      "Bank of Thailand (Financial Institutions)",
    );
    expect(thailandBankHolidays.defaultWeekendDays).toEqual([6, 7]);
    expect(thailandBankHolidays.rules.length).toBeGreaterThan(10);
  });

  describe("Crucial Differences between Civil vs Bank Holidays in Thailand", () => {
    it("National Labour Day (May 1): Banks CLOSED, Civil Offices OPEN", () => {
      // Labour day is a bank holiday in Thailand
      expect(isBankHoliday("2026-05-01", "TH")).toBe(true);
      expect(isBankBusinessDay("2026-05-01", "TH")).toBe(false);

      const c = chronera("2026-05-01");
      expect(c.isBankHoliday("TH")).toBe(true);
      expect(c.isBankBusinessDay("TH")).toBe(false);
    });

    it("Royal Ploughing Ceremony (May 11, 2026): Civil CLOSED, Banks OPEN!", () => {
      // Civil public holiday
      expect(isPublicHoliday("2026-05-11", "TH")).toBe(true);

      // BUT Bank of Thailand DOES NOT observe Royal Ploughing Ceremony as a holiday!
      expect(isBankHoliday("2026-05-11", "TH")).toBe(false);
      expect(isBankBusinessDay("2026-05-11", "TH")).toBe(true);

      const c = chronera("2026-05-11");
      expect(c.isPublicHoliday("TH")).toBe(true);
      expect(c.isBankHoliday("TH")).toBe(false);
      expect(c.isBankBusinessDay("TH")).toBe(true);
    });

    it("Buddhist Lent Day (วันเข้าพรรษา July 30, 2026): Civil CLOSED, Banks OPEN!", () => {
      // Day after Asarnha Bucha
      expect(isPublicHoliday("2026-07-30", "TH")).toBe(true);

      // Banks are OPEN on Buddhist Lent Day!
      expect(isBankHoliday("2026-07-30", "TH")).toBe(false);
      expect(isBankBusinessDay("2026-07-30", "TH")).toBe(true);

      const c = chronera("2026-07-30");
      expect(c.isPublicHoliday("TH")).toBe(true);
      expect(c.isBankHoliday("TH")).toBe(false);
      expect(c.isBankBusinessDay("TH")).toBe(true);
    });
  });

  describe("Financial Settlement (T+2) difference between civil and bank calendar", () => {
    it("advances 2 business days from Friday May 8, 2026 correctly according to BOT", () => {
      const fridayMay8 = localDate(2026, 5, 8);

      // Civil calendar: May 9 (Sat), May 10 (Sun), May 11 (Mon, Royal Ploughing - Civil holiday) -> arrives May 13 (Wed)
      const civilSettlement = addBusinessDays(fridayMay8, 2, {
        holidays: "TH",
      });
      expect(civilSettlement).toEqual(localDate(2026, 5, 13));

      // Financial BOT settlement: May 11 is an OPEN bank business day -> arrives May 12 (Tue)!
      const bankSettlement = addBankBusinessDays(fridayMay8, 2, "TH");
      expect(bankSettlement).toEqual(localDate(2026, 5, 12));

      // Fluent API parity
      const cSettlement = chronera("2026-05-08").addBankBusinessDays(2, "TH");
      expect(cSettlement.toLocalDate()).toEqual(localDate(2026, 5, 12));
    });
  });

  describe("Official BOT Holidays Schedule for 2026", () => {
    it("recognizes standard bank holidays throughout the year", () => {
      expect(isBankHoliday("2026-01-01", "TH")).toBe(true); // New Year
      expect(isBankHoliday("2026-03-03", "TH")).toBe(true); // Makha Bucha
      expect(isBankHoliday("2026-04-06", "TH")).toBe(true); // Chakri Day
      expect(isBankHoliday("2026-04-13", "TH")).toBe(true); // Songkran Day 1
      expect(isBankHoliday("2026-04-14", "TH")).toBe(true); // Songkran Day 2
      expect(isBankHoliday("2026-04-15", "TH")).toBe(true); // Songkran Day 3
      expect(isBankHoliday("2026-05-01", "TH")).toBe(true); // Labour Day
      expect(isBankHoliday("2026-05-04", "TH")).toBe(true); // Coronation Day
      expect(isBankHoliday("2026-06-03", "TH")).toBe(true); // Queen Suthida Birthday
      expect(isBankHoliday("2026-07-28", "TH")).toBe(true); // King Rama X Birthday
      expect(isBankHoliday("2026-07-29", "TH")).toBe(true); // Asarnha Bucha
      expect(isBankHoliday("2026-08-12", "TH")).toBe(true); // Queen Mother Birthday / Mother's Day
      expect(isBankHoliday("2026-10-13", "TH")).toBe(true); // King Bhumibol Memorial Day
      expect(isBankHoliday("2026-10-23", "TH")).toBe(true); // Chulalongkorn Day
      expect(isBankHoliday("2026-12-10", "TH")).toBe(true); // Constitution Day
      expect(isBankHoliday("2026-12-31", "TH")).toBe(true); // New Year's Eve
    });

    it("observes weekend substitution rolls on Mondays for BOT holidays", () => {
      // Wisakha Bucha falls on Sunday May 31, 2026 -> observed on Monday June 1, 2026
      expect(isBankHoliday("2026-05-31", "TH")).toBe(true);
      expect(isBankHoliday("2026-06-01", "TH")).toBe(true);

      // Dec 5, 2026 is Saturday -> observed on Monday Dec 7, 2026
      expect(isBankHoliday("2026-12-05", "TH")).toBe(true);
      expect(isBankHoliday("2026-12-07", "TH")).toBe(true);
    });

    it("retrieves full annual bank holidays list via getBankHolidays", () => {
      const holidays = getBankHolidays(2026, "TH");
      expect(holidays.length).toBeGreaterThan(15);
      expect(holidays.some((h) => h.id === "th-bank-labour")).toBe(true);
      expect(holidays.some((h) => h.id.includes("royal-ploughing"))).toBe(
        false,
      );
    });
  });

  describe("diffInBankBusinessDays", () => {
    it("computes difference in bank business days correctly", () => {
      // Friday May 8, 2026 to Tuesday May 12, 2026:
      // May 9 (Sat), May 10 (Sun), May 11 (Mon - bank open) -> 2 bank business days!
      const diff = diffInBankBusinessDays("2026-05-12", "2026-05-08", "TH");
      expect(diff).toBe(2);

      const c1 = chronera("2026-05-12");
      expect(c1.diffInBankBusinessDays("2026-05-08", "TH")).toBe(2);
    });
  });
});
