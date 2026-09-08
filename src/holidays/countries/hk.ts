import type { HolidayCalendar } from "../types.js";

/**
 * Official General Holidays for Hong Kong 🇭🇰
 * 香港公眾假期 (General Holidays Ordinance).
 */
export const hongKongHolidays: HolidayCalendar = {
  country: "HK",
  countryName: "Hong Kong",
  defaultWeekendDays: [6, 7],
  rules: [
    {
      type: "fixed",
      id: "hk-new-year",
      month: 1,
      day: 1,
      name: "一月一日 (元旦)",
      nameEn: "The first day of January",
      observed: "sunday-to-monday",
    },
    {
      type: "easter",
      id: "hk-good-friday",
      offsetDays: -2,
      name: "耶穌受難節",
      nameEn: "Good Friday",
    },
    {
      type: "easter",
      id: "hk-holy-saturday",
      offsetDays: -1,
      name: "耶穌受難節翌日",
      nameEn: "The day following Good Friday",
    },
    {
      type: "easter",
      id: "hk-easter-monday",
      offsetDays: 1,
      name: "復活節星期一",
      nameEn: "Easter Monday",
    },
    {
      type: "fixed",
      id: "hk-labour-day",
      month: 5,
      day: 1,
      name: "勞動節",
      nameEn: "Labour Day",
      observed: "sunday-to-monday",
    },
    {
      type: "fixed",
      id: "hk-hksar-day",
      month: 7,
      day: 1,
      name: "香港特別行政區成立紀念日",
      nameEn: "Hong Kong Special Administrative Region Establishment Day",
      observed: "sunday-to-monday",
    },
    {
      type: "fixed",
      id: "hk-national-day",
      month: 10,
      day: 1,
      name: "國慶日",
      nameEn: "National Day",
      observed: "sunday-to-monday",
    },
    {
      type: "fixed",
      id: "hk-christmas",
      month: 12,
      day: 25,
      name: "聖誕節",
      nameEn: "Christmas Day",
      observed: "sunday-to-monday",
    },
    {
      type: "fixed",
      id: "hk-boxing-day",
      month: 12,
      day: 26,
      name: "聖誕節後第一個周日",
      nameEn: "Boxing Day",
      observed: "sunday-to-monday",
    },
  ],
};
