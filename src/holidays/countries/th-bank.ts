import {
  THAI_LUNAR_HOLIDAYS_TABLE,
  evaluateThaiLunarHoliday,
} from "./th-lunar.js";

import type { HolidayCalendar, PublicHoliday } from "../types.js";

/**
 * Official Bank of Thailand (BOT / ธปท.) Financial Institutions Holidays Calendar.
 * วันหยุดตามประเพณีของสถาบันการเงินและสถาบันการเงินเฉพาะกิจ ตามประกาศธนาคารแห่งประเทศไทย.
 *
 * Distinct from Civil/Government Holidays:
 * - National Labour Day (May 1): Bank HOLIDAY (Government offices OPEN)
 * - Royal Ploughing Ceremony (วันพืชมงคล): Bank OPEN (Government offices CLOSED)
 * - Buddhist Lent Day (วันเข้าพรรษา): Bank OPEN (Government offices CLOSED)
 * - Mid-Year Closing Day (July 1): Abolished by BOT since 2019 (Bank OPEN)
 */
export const thailandBankHolidays: HolidayCalendar = {
  country: "TH-BOT",
  countryName: "Bank of Thailand (Financial Institutions)",
  defaultWeekendDays: [6, 7], // Saturday, Sunday
  rules: [
    {
      type: "fixed",
      id: "th-bank-new-year",
      month: 1,
      day: 1,
      name: "วันขึ้นปีใหม่",
      nameEn: "New Year's Day",
      observed: "weekend-to-monday",
    },
    {
      type: "custom",
      id: "th-bank-makha-bucha",
      name: "วันมาฆบูชา",
      nameEn: "Makha Bucha Day",
      evaluate(year: number): readonly PublicHoliday[] {
        const entry = THAI_LUNAR_HOLIDAYS_TABLE[year];
        if (!entry) return [];
        return evaluateThaiLunarHoliday(
          "th-bank-makha-bucha",
          "วันมาฆบูชา",
          "Makha Bucha Day",
          entry.makhaBucha[0],
          entry.makhaBucha[1],
          year,
          "TH-BOT",
        );
      },
    },
    {
      type: "fixed",
      id: "th-bank-chakri",
      month: 4,
      day: 6,
      name: "วันจักรี",
      nameEn: "Chakri Memorial Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "th-bank-songkran-1",
      month: 4,
      day: 13,
      name: "วันสงกรานต์",
      nameEn: "Songkran Festival Day 1",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "th-bank-songkran-2",
      month: 4,
      day: 14,
      name: "วันสงกรานต์",
      nameEn: "Songkran Festival Day 2",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "th-bank-songkran-3",
      month: 4,
      day: 15,
      name: "วันสงกรานต์",
      nameEn: "Songkran Festival Day 3",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "th-bank-labour",
      month: 5,
      day: 1,
      name: "วันแรงงานแห่งชาติ",
      nameEn: "National Labour Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "th-bank-coronation",
      month: 5,
      day: 4,
      name: "วันฉัตรมงคล",
      nameEn: "Coronation Day",
      observed: "weekend-to-monday",
      validFromYear: 2019,
    },
    {
      type: "custom",
      id: "th-bank-visakha-bucha",
      name: "วันวิสาขบูชา",
      nameEn: "Wisakha Bucha Day",
      evaluate(year: number): readonly PublicHoliday[] {
        const entry = THAI_LUNAR_HOLIDAYS_TABLE[year];
        if (!entry) return [];
        return evaluateThaiLunarHoliday(
          "th-bank-visakha-bucha",
          "วันวิสาขบูชา",
          "Wisakha Bucha Day",
          entry.visakhaBucha[0],
          entry.visakhaBucha[1],
          year,
          "TH-BOT",
        );
      },
    },
    {
      type: "fixed",
      id: "th-bank-queen-birthday",
      month: 6,
      day: 3,
      name: "วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าสุทิดาฯ",
      nameEn: "HM Queen Suthida's Birthday",
      observed: "weekend-to-monday",
      validFromYear: 2019,
    },
    {
      type: "custom",
      id: "th-bank-asarnha-bucha",
      name: "วันอาสาฬหบูชา",
      nameEn: "Asarnha Bucha Day",
      evaluate(year: number): readonly PublicHoliday[] {
        const entry = THAI_LUNAR_HOLIDAYS_TABLE[year];
        if (!entry) return [];
        return evaluateThaiLunarHoliday(
          "th-bank-asarnha-bucha",
          "วันอาสาฬหบูชา",
          "Asarnha Bucha Day",
          entry.asarnhaBucha[0],
          entry.asarnhaBucha[1],
          year,
          "TH-BOT",
        );
      },
    },
    {
      type: "fixed",
      id: "th-bank-king-birthday",
      month: 7,
      day: 28,
      name: "วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว",
      nameEn: "HM King Maha Vajiralongkorn's Birthday",
      observed: "weekend-to-monday",
      validFromYear: 2017,
    },
    {
      type: "fixed",
      id: "th-bank-queen-mother-birthday",
      month: 8,
      day: 12,
      name: "วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง / วันแม่แห่งชาติ",
      nameEn:
        "HM Queen Sirikit The Queen Mother's Birthday / National Mother's Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "th-bank-king-memorial",
      month: 10,
      day: 13,
      name: "วันนวมินทรมหาราช",
      nameEn: "King Bhumibol Adulyadej Memorial Day",
      observed: "weekend-to-monday",
      validFromYear: 2017,
    },
    {
      type: "fixed",
      id: "th-bank-chulalongkorn",
      month: 10,
      day: 23,
      name: "วันปิยมหาราช",
      nameEn: "Chulalongkorn Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "th-bank-king-father-birthday",
      month: 12,
      day: 5,
      name: "วันคล้ายวันพระบรมราชสมภพ ร.9 / วันพ่อแห่งชาติ",
      nameEn: "King Bhumibol Adulyadej's Birthday / National Father's Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "th-bank-constitution",
      month: 12,
      day: 10,
      name: "วันรัฐธรรมนูญ",
      nameEn: "Constitution Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "th-bank-new-year-eve",
      month: 12,
      day: 31,
      name: "วันสิ้นปี",
      nameEn: "New Year's Eve",
      observed: "none",
    },
  ],
};
