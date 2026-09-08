import type { HolidayCalendar } from "../types.js";

/**
 * National Public Holidays for Australia 🇦🇺
 * Includes statutory national holidays and common nationwide bank holidays.
 */
export const australiaHolidays: HolidayCalendar = {
  country: "AU",
  countryName: "Australia",
  defaultWeekendDays: [6, 7],
  rules: [
    {
      type: "fixed",
      id: "au-new-year",
      month: 1,
      day: 1,
      name: "New Year's Day",
      nameEn: "New Year's Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "au-australia-day",
      month: 1,
      day: 26,
      name: "Australia Day",
      nameEn: "Australia Day",
      observed: "weekend-to-monday",
    },
    {
      type: "easter",
      id: "au-good-friday",
      offsetDays: -2,
      name: "Good Friday",
      nameEn: "Good Friday",
    },
    {
      type: "easter",
      id: "au-easter-monday",
      offsetDays: 1,
      name: "Easter Monday",
      nameEn: "Easter Monday",
    },
    {
      type: "fixed",
      id: "au-anzac-day",
      month: 4,
      day: 25,
      name: "ANZAC Day",
      nameEn: "ANZAC Day",
    },
    {
      type: "floating",
      id: "au-kings-birthday",
      month: 6,
      weekday: 1,
      occurrence: 2, // 2nd Monday of June (most states)
      name: "King's Birthday",
      nameEn: "King's Birthday",
    },
    {
      type: "fixed",
      id: "au-christmas",
      month: 12,
      day: 25,
      name: "Christmas Day",
      nameEn: "Christmas Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "au-boxing-day",
      month: 12,
      day: 26,
      name: "Boxing Day",
      nameEn: "Boxing Day",
      observed: "weekend-to-monday",
    },
  ],
};
