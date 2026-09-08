import { describe, it, expect } from "vitest";
import { createLocalDate } from "../../../src/core/local-date.js";
import {
  isPublicHoliday,
  getPublicHolidays,
  getHolidayDetails,
} from "../../../src/operations/holidays.js";
import { BUILT_IN_HOLIDAYS } from "../../../src/holidays/countries/index.js";

import type { CountryCode } from "../../../src/holidays/types.js";

describe("15 Countries National Public Holidays Suite", () => {
  const allCountries: CountryCode[] = [
    "TH",
    "JP",
    "SA",
    "AE",
    "IR",
    "TW",
    "IN",
    "SG",
    "US",
    "GB",
    "DE",
    "FR",
    "AU",
    "CN",
    "HK",
  ];

  it("contains all 15 countries in the built-in catalog", () => {
    expect(Object.keys(BUILT_IN_HOLIDAYS)).toHaveLength(15);
    for (const code of allCountries) {
      expect(BUILT_IN_HOLIDAYS[code]).toBeDefined();
      expect(BUILT_IN_HOLIDAYS[code].country).toBe(code);
      expect(BUILT_IN_HOLIDAYS[code].rules.length).toBeGreaterThan(0);
    }
  });

  describe("🇹🇭 Thailand (TH)", () => {
    it("recognizes Songkran festival days (April 13, 14, 15)", () => {
      expect(isPublicHoliday(createLocalDate(2026, 4, 13), "TH")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 4, 14), "TH")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 4, 15), "TH")).toBe(true);

      const details = getHolidayDetails(createLocalDate(2026, 4, 13), "TH");
      expect(details).toBeDefined();
      expect(details?.name).toBe("วันสงกรานต์");
      expect(details?.nameEn).toContain("Songkran");
    });

    it("recognizes New Year and Royal birthdays", () => {
      expect(isPublicHoliday(createLocalDate(2026, 1, 1), "TH")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 7, 28), "TH")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 12, 5), "TH")).toBe(true);
    });
  });

  describe("🇯🇵 Japan (JP)", () => {
    it("recognizes Golden Week (Apr 29, May 3, 4, 5)", () => {
      expect(isPublicHoliday(createLocalDate(2026, 4, 29), "JP")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 5, 3), "JP")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 5, 4), "JP")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 5, 5), "JP")).toBe(true);
    });

    it("recognizes Mountain Day and Emperor's Birthday", () => {
      expect(isPublicHoliday(createLocalDate(2026, 8, 11), "JP")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 2, 23), "JP")).toBe(true);
    });
  });

  describe("🇸🇦 Saudi Arabia (SA)", () => {
    it("recognizes Saudi Founding Day (Feb 22) and National Day (Sep 23)", () => {
      expect(isPublicHoliday(createLocalDate(2026, 2, 22), "SA")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 9, 23), "SA")).toBe(true);
    });

    it("evaluates Islamic Eid statutory holidays", () => {
      const saHolidays = getPublicHolidays(2026, "SA");
      expect(saHolidays.length).toBeGreaterThanOrEqual(10);
      expect(saHolidays.some((h) => h.id.includes("eid"))).toBe(true);
    });
  });

  describe("🇦🇪 United Arab Emirates (AE)", () => {
    it("recognizes UAE National Day and Commemoration Day", () => {
      expect(isPublicHoliday(createLocalDate(2026, 12, 1), "AE")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 12, 2), "AE")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 12, 3), "AE")).toBe(true);
    });
  });

  describe("🇮🇷 Iran (IR)", () => {
    it("recognizes Nowruz (Farvardin 1-4 / March 21-24)", () => {
      expect(isPublicHoliday(createLocalDate(2026, 3, 21), "IR")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 3, 22), "IR")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 3, 23), "IR")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 3, 24), "IR")).toBe(true);
    });

    it("recognizes Islamic Republic Day (April 1)", () => {
      expect(isPublicHoliday(createLocalDate(2026, 4, 1), "IR")).toBe(true);
    });
  });

  describe("🇹🇼 Taiwan (TW)", () => {
    it("recognizes National Day (Oct 10) and Peace Memorial (Feb 28)", () => {
      expect(isPublicHoliday(createLocalDate(2026, 10, 10), "TW")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 2, 28), "TW")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 5, 1), "TW")).toBe(true);
    });
  });

  describe("🇮🇳 India (IN)", () => {
    it("recognizes 3 mandatory gazetted holidays", () => {
      expect(isPublicHoliday(createLocalDate(2026, 1, 26), "IN")).toBe(true); // Republic Day
      expect(isPublicHoliday(createLocalDate(2026, 8, 15), "IN")).toBe(true); // Independence Day
      expect(isPublicHoliday(createLocalDate(2026, 10, 2), "IN")).toBe(true); // Gandhi Jayanti
    });
  });

  describe("🇸🇬 Singapore (SG)", () => {
    it("recognizes National Day (Aug 9) and Labour Day (May 1)", () => {
      expect(isPublicHoliday(createLocalDate(2026, 8, 9), "SG")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 5, 1), "SG")).toBe(true);
    });
  });

  describe("🇺🇸 United States (US)", () => {
    it("recognizes 11 Federal Holidays", () => {
      expect(isPublicHoliday(createLocalDate(2026, 1, 1), "US")).toBe(true); // New Year
      expect(isPublicHoliday(createLocalDate(2026, 6, 19), "US")).toBe(true); // Juneteenth
      expect(isPublicHoliday(createLocalDate(2026, 7, 4), "US")).toBe(true); // July 4
      expect(isPublicHoliday(createLocalDate(2026, 11, 26), "US")).toBe(true); // Thanksgiving
      expect(isPublicHoliday(createLocalDate(2026, 12, 25), "US")).toBe(true); // Christmas
    });
  });

  describe("🇬🇧 United Kingdom (GB)", () => {
    it("recognizes Bank Holidays including Good Friday, Easter Monday, Boxing Day", () => {
      expect(isPublicHoliday(createLocalDate(2026, 1, 1), "GB")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 4, 3), "GB")).toBe(true); // Good Friday
      expect(isPublicHoliday(createLocalDate(2026, 4, 6), "GB")).toBe(true); // Easter Monday
      expect(isPublicHoliday(createLocalDate(2026, 12, 25), "GB")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 12, 26), "GB")).toBe(true);
    });
  });

  describe("🇩🇪 Germany (DE)", () => {
    it("recognizes Tag der Deutschen Einheit (Oct 3)", () => {
      expect(isPublicHoliday(createLocalDate(2026, 10, 3), "DE")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 5, 1), "DE")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 4, 3), "DE")).toBe(true); // Karfreitag
    });
  });

  describe("🇫🇷 France (FR)", () => {
    it("recognizes Bastille Day (July 14) and Armistice (Nov 11)", () => {
      expect(isPublicHoliday(createLocalDate(2026, 7, 14), "FR")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 11, 11), "FR")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 5, 8), "FR")).toBe(true); // Victoire 1945
    });
  });

  describe("🇦🇺 Australia (AU)", () => {
    it("recognizes Australia Day (Jan 26) and ANZAC Day (Apr 25)", () => {
      expect(isPublicHoliday(createLocalDate(2026, 1, 26), "AU")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 4, 25), "AU")).toBe(true);
    });
  });

  describe("🇨🇳 China (CN)", () => {
    it("recognizes National Day Golden Week (Oct 1, 2, 3)", () => {
      expect(isPublicHoliday(createLocalDate(2026, 10, 1), "CN")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 10, 2), "CN")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 10, 3), "CN")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 5, 1), "CN")).toBe(true);
    });
  });

  describe("🇭🇰 Hong Kong (HK)", () => {
    it("recognizes HKSAR Establishment Day (July 1) and National Day (Oct 1)", () => {
      expect(isPublicHoliday(createLocalDate(2026, 7, 1), "HK")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 10, 1), "HK")).toBe(true);
      expect(isPublicHoliday(createLocalDate(2026, 4, 3), "HK")).toBe(true); // Good Friday
    });
  });
});
