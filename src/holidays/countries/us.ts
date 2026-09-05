import type { HolidayCalendar } from "../types.js";

/**
 * Official Federal Public Holidays for the United States 🇺🇸
 * Includes all 11 Federal statutory holidays with Saturday-to-Friday and Sunday-to-Monday substitution.
 */
export const unitedStatesHolidays: HolidayCalendar = {
  country: "US",
  countryName: "United States",
  defaultWeekendDays: [6, 7],
  rules: [
    {
      type: "fixed",
      id: "us-new-year",
      month: 1,
      day: 1,
      name: "New Year's Day",
      nameEn: "New Year's Day",
      observed: "sat-to-fri-sun-to-mon",
    },
    {
      type: "floating",
      id: "us-mlk-day",
      month: 1,
      weekday: 1, // Monday
      occurrence: 3, // 3rd Monday
      name: "Martin Luther King Jr. Day",
      nameEn: "Martin Luther King Jr. Day",
    },
    {
      type: "floating",
      id: "us-presidents-day",
      month: 2,
      weekday: 1, // Monday
      occurrence: 3, // 3rd Monday
      name: "Washington's Birthday (Presidents' Day)",
      nameEn: "Washington's Birthday (Presidents' Day)",
    },
    {
      type: "floating",
      id: "us-memorial-day",
      month: 5,
      weekday: 1, // Monday
      occurrence: -1, // Last Monday of May
      name: "Memorial Day",
      nameEn: "Memorial Day",
    },
    {
      type: "fixed",
      id: "us-juneteenth",
      month: 6,
      day: 19,
      name: "Juneteenth National Independence Day",
      nameEn: "Juneteenth National Independence Day",
      observed: "sat-to-fri-sun-to-mon",
      validFromYear: 2021,
    },
    {
      type: "fixed",
      id: "us-independence-day",
      month: 7,
      day: 4,
      name: "Independence Day",
      nameEn: "Independence Day",
      observed: "sat-to-fri-sun-to-mon",
    },
    {
      type: "floating",
      id: "us-labor-day",
      month: 9,
      weekday: 1, // Monday
      occurrence: 1, // 1st Monday
      name: "Labor Day",
      nameEn: "Labor Day",
    },
    {
      type: "floating",
      id: "us-columbus-day",
      month: 10,
      weekday: 1, // Monday
      occurrence: 2, // 2nd Monday
      name: "Columbus Day / Indigenous Peoples' Day",
      nameEn: "Columbus Day / Indigenous Peoples' Day",
    },
    {
      type: "fixed",
      id: "us-veterans-day",
      month: 11,
      day: 11,
      name: "Veterans Day",
      nameEn: "Veterans Day",
      observed: "sat-to-fri-sun-to-mon",
    },
    {
      type: "floating",
      id: "us-thanksgiving",
      month: 11,
      weekday: 4, // Thursday
      occurrence: 4, // 4th Thursday
      name: "Thanksgiving Day",
      nameEn: "Thanksgiving Day",
    },
    {
      type: "fixed",
      id: "us-christmas",
      month: 12,
      day: 25,
      name: "Christmas Day",
      nameEn: "Christmas Day",
      observed: "sat-to-fri-sun-to-mon",
    },
  ],
};
