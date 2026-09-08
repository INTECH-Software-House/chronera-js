import type { HolidayCalendar } from "../types.js";

/**
 * Official Public Holidays for Singapore 🇸🇬
 * Multi-cultural statutory holidays with weekend-to-monday substitution.
 */
export const singaporeHolidays: HolidayCalendar = {
  country: "SG",
  countryName: "Singapore",
  defaultWeekendDays: [6, 7],
  rules: [
    {
      type: "fixed",
      id: "sg-new-year",
      month: 1,
      day: 1,
      name: "New Year's Day",
      nameEn: "New Year's Day",
      observed: "weekend-to-monday",
    },
    {
      type: "easter",
      id: "sg-good-friday",
      offsetDays: -2,
      name: "Good Friday",
      nameEn: "Good Friday",
    },
    {
      type: "fixed",
      id: "sg-labour-day",
      month: 5,
      day: 1,
      name: "Labour Day",
      nameEn: "Labour Day",
      observed: "weekend-to-monday",
    },
    {
      type: "fixed",
      id: "sg-national-day",
      month: 8,
      day: 9,
      name: "National Day",
      nameEn: "National Day",
      observed: "weekend-to-monday",
    },
    {
      type: "hijri",
      id: "sg-hari-raya-puasa",
      hijriMonth: 10,
      hijriDay: 1,
      name: "Hari Raya Puasa",
      nameEn: "Hari Raya Puasa",
    },
    {
      type: "hijri",
      id: "sg-hari-raya-haji",
      hijriMonth: 12,
      hijriDay: 10,
      name: "Hari Raya Haji",
      nameEn: "Hari Raya Haji",
    },
    {
      type: "fixed",
      id: "sg-christmas",
      month: 12,
      day: 25,
      name: "Christmas Day",
      nameEn: "Christmas Day",
      observed: "weekend-to-monday",
    },
  ],
};
