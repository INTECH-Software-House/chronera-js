import {
  THAI_LUNAR_HOLIDAYS_TABLE,
  evaluateThaiLunarHoliday,
} from "./th-lunar.js";

import type { HolidayCalendar, PublicHoliday } from "../types.js";

/**
 * Official Public Holidays for Thailand 🇹🇭
 * Enforces Cabinet Substituted Holiday Rules (วันหยุดราชการตามมติคณะรัฐมนตรี).
 */
export const thailandHolidays: HolidayCalendar = {
  country: "TH",
  countryName: "Thailand",
  defaultWeekendDays: [6, 7], // Saturday, Sunday
  rules: [
    {
      type: "fixed",
      id: "th-new-year",
      month: 1,
      day: 1,
      name: "วันขึ้นปีใหม่",
      nameEn: "New Year's Day",
      observed: "weekend-to-monday",
    },
    {
      type: "custom",
      id: "th-makha-bucha",
      name: "วันมาฆบูชา",
      nameEn: "Makha Bucha Day",
      evaluate(year: number): readonly PublicHoliday[] {
        const entry = THAI_LUNAR_HOLIDAYS_TABLE[year];
        if (!entry) return [];
        return evaluateThaiLunarHoliday(
          "th-makha-bucha",
          "วันมาฆบูชา",
          "Makha Bucha Day",
          entry.makhaBucha[0],
          entry.makhaBucha[1],
          year,
          "TH",
        );
      },
    },
    {
      type: "fixed",
      id: "th-chakri",
      month: 4,
      day: 6,
      name: "วันจักรี",
      nameEn: "Chakri Memorial Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "th-songkran-1",
      month: 4,
      day: 13,
      name: "วันสงกรานต์",
      nameEn: "Songkran Festival Day 1",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "th-songkran-2",
      month: 4,
      day: 14,
      name: "วันสงกรานต์",
      nameEn: "Songkran Festival Day 2",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "th-songkran-3",
      month: 4,
      day: 15,
      name: "วันสงกรานต์",
      nameEn: "Songkran Festival Day 3",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "th-labour",
      month: 5,
      day: 1,
      name: "วันแรงงานแห่งชาติ",
      nameEn: "National Labour Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "th-coronation",
      month: 5,
      day: 4,
      name: "วันฉัตรมงคล",
      nameEn: "Coronation Day",
      observed: "weekend-to-monday",
      validFromYear: 2019,
    },
    {
      type: "custom",
      id: "th-royal-ploughing",
      name: "วันพืชมงคลจรดพระนังคัลแรกนาขวัญ",
      nameEn: "Royal Ploughing Ceremony",
      evaluate(year: number): readonly PublicHoliday[] {
        const entry = THAI_LUNAR_HOLIDAYS_TABLE[year];
        if (!entry?.royalPloughing) return [];
        return evaluateThaiLunarHoliday(
          "th-royal-ploughing",
          "วันพืชมงคลจรดพระนังคัลแรกนาขวัญ",
          "Royal Ploughing Ceremony",
          entry.royalPloughing[0],
          entry.royalPloughing[1],
          year,
          "TH",
        );
      },
    },
    {
      type: "custom",
      id: "th-visakha-bucha",
      name: "วันวิสาขบูชา",
      nameEn: "Wisakha Bucha Day",
      evaluate(year: number): readonly PublicHoliday[] {
        const entry = THAI_LUNAR_HOLIDAYS_TABLE[year];
        if (!entry) return [];
        return evaluateThaiLunarHoliday(
          "th-visakha-bucha",
          "วันวิสาขบูชา",
          "Wisakha Bucha Day",
          entry.visakhaBucha[0],
          entry.visakhaBucha[1],
          year,
          "TH",
        );
      },
    },
    {
      type: "fixed",
      id: "th-queen-birthday",
      month: 6,
      day: 3,
      name: "วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าสุทิดาฯ",
      nameEn: "HM Queen Suthida's Birthday",
      observed: "weekend-to-monday",
      validFromYear: 2019,
    },
    {
      type: "custom",
      id: "th-asarnha-bucha",
      name: "วันอาสาฬหบูชา",
      nameEn: "Asarnha Bucha Day",
      evaluate(year: number): readonly PublicHoliday[] {
        const entry = THAI_LUNAR_HOLIDAYS_TABLE[year];
        if (!entry) return [];
        return evaluateThaiLunarHoliday(
          "th-asarnha-bucha",
          "วันอาสาฬหบูชา",
          "Asarnha Bucha Day",
          entry.asarnhaBucha[0],
          entry.asarnhaBucha[1],
          year,
          "TH",
        );
      },
    },
    {
      type: "custom",
      id: "th-khao-phansa",
      name: "วันเข้าพรรษา",
      nameEn: "Buddhist Lent Day",
      evaluate(year: number): readonly PublicHoliday[] {
        const entry = THAI_LUNAR_HOLIDAYS_TABLE[year];
        if (!entry) return [];
        return evaluateThaiLunarHoliday(
          "th-khao-phansa",
          "วันเข้าพรรษา",
          "Buddhist Lent Day",
          entry.khaoPhansa[0],
          entry.khaoPhansa[1],
          year,
          "TH",
        );
      },
    },
    {
      type: "fixed",
      id: "th-king-birthday",
      month: 7,
      day: 28,
      name: "วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว",
      nameEn: "HM King Maha Vajiralongkorn's Birthday",
      observed: "weekend-to-monday",
      validFromYear: 2017,
    },
    {
      type: "fixed",
      id: "th-queen-mother-birthday",
      month: 8,
      day: 12,
      name: "วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง / วันแม่แห่งชาติ",
      nameEn:
        "HM Queen Sirikit The Queen Mother's Birthday / National Mother's Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "th-king-memorial",
      month: 10,
      day: 13,
      name: "วันนวมินทรมหาราช",
      nameEn: "King Bhumibol Adulyadej Memorial Day",
      observed: "weekend-to-monday",
      validFromYear: 2017,
    },
    {
      type: "fixed",
      id: "th-chulalongkorn",
      month: 10,
      day: 23,
      name: "วันปิยมหาราช",
      nameEn: "Chulalongkorn Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "th-king-father-birthday",
      month: 12,
      day: 5,
      name: "วันคล้ายวันพระบรมราชสมภพ ร.9 / วันพ่อแห่งชาติ",
      nameEn: "King Bhumibol Adulyadej's Birthday / National Father's Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "th-constitution",
      month: 12,
      day: 10,
      name: "วันรัฐธรรมนูญ",
      nameEn: "Constitution Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "th-new-year-eve",
      month: 12,
      day: 31,
      name: "วันสิ้นปี",
      nameEn: "New Year's Eve",
      observed: "none",
    },
  ],
};
