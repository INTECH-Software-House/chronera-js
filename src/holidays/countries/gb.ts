import type { HolidayCalendar } from "../types.js";

/**
 * Official Bank Holidays for England & Wales, United Kingdom 🇬🇧
 * Enforces Bank Holiday Acts and weekend-to-monday substitution.
 */
export const unitedKingdomHolidays: HolidayCalendar = {
  country: "GB",
  countryName: "United Kingdom",
  defaultWeekendDays: [6, 7],
  rules: [
    {
      type: "fixed",
      id: "gb-new-year",
      month: 1,
      day: 1,
      name: "New Year's Day",
      nameEn: "New Year's Day",
      observed: "weekend-to-monday",
    },
    {
      type: "easter",
      id: "gb-good-friday",
      offsetDays: -2,
      name: "Good Friday",
      nameEn: "Good Friday",
    },
    {
      type: "easter",
      id: "gb-easter-monday",
      offsetDays: 1,
      name: "Easter Monday",
      nameEn: "Easter Monday",
    },
    {
      type: "floating",
      id: "gb-early-may",
      month: 5,
      weekday: 1,
      occurrence: 1, // 1st Monday of May
      name: "Early May Bank Holiday",
      nameEn: "Early May Bank Holiday",
    },
    {
      type: "floating",
      id: "gb-spring-bank",
      month: 5,
      weekday: 1,
      occurrence: -1, // Last Monday of May
      name: "Spring Bank Holiday",
      nameEn: "Spring Bank Holiday",
    },
    {
      type: "floating",
      id: "gb-summer-bank",
      month: 8,
      weekday: 1,
      occurrence: -1, // Last Monday of August
      name: "Summer Bank Holiday",
      nameEn: "Summer Bank Holiday",
    },
    {
      type: "fixed",
      id: "gb-christmas",
      month: 12,
      day: 25,
      name: "Christmas Day",
      nameEn: "Christmas Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "gb-boxing-day",
      month: 12,
      day: 26,
      name: "Boxing Day",
      nameEn: "Boxing Day",
      observed: "weekend-to-monday",
    },
  ],
};
