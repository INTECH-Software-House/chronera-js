import type { HolidayCalendar } from "../types.js";

/**
 * Official Public Holidays for Taiwan 🇹🇼
 * Evaluated with Republic of China (Minguo) and statutory observances.
 */
export const taiwanHolidays: HolidayCalendar = {
  country: "TW",
  countryName: "Taiwan",
  defaultWeekendDays: [6, 7],
  rules: [
    {
      type: "fixed",
      id: "tw-founding-day",
      month: 1,
      day: 1,
      name: "中華民國開國紀念日",
      nameEn: "Founding Day of the Republic of China",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "tw-peace-memorial",
      month: 2,
      day: 28,
      name: "和平紀念日",
      nameEn: "Peace Memorial Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "tw-childrens-day",
      month: 4,
      day: 4,
      name: "兒童節",
      nameEn: "Children's Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "tw-labour-day",
      month: 5,
      day: 1,
      name: "勞動節",
      nameEn: "Labor Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "tw-national-day",
      month: 10,
      day: 10,
      name: "國慶日",
      nameEn: "National Day (Double Tenth Day)",
      observed: "weekend-to-monday",
    },
  ],
};
