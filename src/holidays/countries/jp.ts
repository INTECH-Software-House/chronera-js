import type { HolidayCalendar } from "../types.js";

/**
 * Official Public Holidays for Japan 🇯🇵
 * Enforces Golden Week, Happy Monday System, and Sunday-to-Monday substitution (振替休日).
 */
export const japanHolidays: HolidayCalendar = {
  country: "JP",
  countryName: "Japan",
  defaultWeekendDays: [6, 7], // Saturday, Sunday
  rules: [
    {
      type: "fixed",
      id: "jp-new-year",
      month: 1,
      day: 1,
      name: "元日",
      nameEn: "New Year's Day",
      observed: "sunday-to-monday",
    },
    {
      type: "floating",
      id: "jp-coming-of-age",
      month: 1,
      weekday: 1, // Monday
      occurrence: 2, // 2nd Monday
      name: "成人の日",
      nameEn: "Coming of Age Day",
    },
    {
      type: "fixed",
      id: "jp-national-foundation",
      month: 2,
      day: 11,
      name: "建国記念の日",
      nameEn: "National Foundation Day",
      observed: "sunday-to-monday",
    },
    {
      type: "fixed",
      id: "jp-emperor-birthday",
      month: 2,
      day: 23,
      name: "天皇誕生日",
      nameEn: "The Emperor's Birthday",
      observed: "sunday-to-monday",
      validFromYear: 2020,
    },
    {
      type: "fixed",
      id: "jp-showa-day",
      month: 4,
      day: 29,
      name: "昭和の日",
      nameEn: "Showa Day",
      observed: "sunday-to-monday",
    },
    {
      type: "fixed",
      id: "jp-constitution-memorial",
      month: 5,
      day: 3,
      name: "憲法記念日",
      nameEn: "Constitution Memorial Day",
      observed: "sunday-to-monday",
    },
    {
      type: "fixed",
      id: "jp-greenery-day",
      month: 5,
      day: 4,
      name: "みどりの日",
      nameEn: "Greenery Day",
      observed: "sunday-to-monday",
    },
    {
      type: "fixed",
      id: "jp-childrens-day",
      month: 5,
      day: 5,
      name: "こどもの日",
      nameEn: "Children's Day",
      observed: "sunday-to-monday",
    },
    {
      type: "floating",
      id: "jp-marine-day",
      month: 7,
      weekday: 1,
      occurrence: 3, // 3rd Monday
      name: "海の日",
      nameEn: "Marine Day",
    },
    {
      type: "fixed",
      id: "jp-mountain-day",
      month: 8,
      day: 11,
      name: "山の日",
      nameEn: "Mountain Day",
      observed: "sunday-to-monday",
      validFromYear: 2016,
    },
    {
      type: "floating",
      id: "jp-respect-for-aged",
      month: 9,
      weekday: 1,
      occurrence: 3, // 3rd Monday
      name: "敬老の日",
      nameEn: "Respect for the Aged Day",
    },
    {
      type: "floating",
      id: "jp-sports-day",
      month: 10,
      weekday: 1,
      occurrence: 2, // 2nd Monday
      name: "スポーツの日",
      nameEn: "Sports Day",
    },
    {
      type: "fixed",
      id: "jp-culture-day",
      month: 11,
      day: 3,
      name: "文化の日",
      nameEn: "Culture Day",
      observed: "sunday-to-monday",
    },
    {
      type: "fixed",
      id: "jp-labor-thanksgiving",
      month: 11,
      day: 23,
      name: "勤労感謝の日",
      nameEn: "Labor Thanksgiving Day",
      observed: "sunday-to-monday",
    },
  ],
};
