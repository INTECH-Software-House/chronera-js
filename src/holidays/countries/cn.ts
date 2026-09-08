import type { HolidayCalendar } from "../types.js";

/**
 * Statutory Solar Public Holidays for the People's Republic of China 🇨🇳
 * 中华人民共和国法定节假日 (公历固定假期).
 */
export const chinaHolidays: HolidayCalendar = {
  country: "CN",
  countryName: "China",
  defaultWeekendDays: [6, 7],
  rules: [
    {
      type: "fixed",
      id: "cn-new-year",
      month: 1,
      day: 1,
      name: "元旦",
      nameEn: "New Year's Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "cn-labor-day",
      month: 5,
      day: 1,
      name: "劳动节",
      nameEn: "International Labour Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "cn-national-day-1",
      month: 10,
      day: 1,
      name: "国庆节",
      nameEn: "National Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "cn-national-day-2",
      month: 10,
      day: 2,
      name: "国庆节假期",
      nameEn: "National Day Holiday Day 2",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "cn-national-day-3",
      month: 10,
      day: 3,
      name: "国庆节假期",
      nameEn: "National Day Holiday Day 3",
      observed: "weekend-to-monday",
    },
  ],
};
