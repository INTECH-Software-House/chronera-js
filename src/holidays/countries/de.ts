import type { HolidayCalendar } from "../types.js";

/**
 * Official Federal Statutory Holidays for Germany 🇩🇪
 * Bundesweite gesetzliche Feiertage.
 */
export const germanyHolidays: HolidayCalendar = {
  country: "DE",
  countryName: "Germany",
  defaultWeekendDays: [6, 7],
  rules: [
    {
      type: "fixed",
      id: "de-neujahr",
      month: 1,
      day: 1,
      name: "Neujahr",
      nameEn: "New Year's Day",
    },
    {
      type: "easter",
      id: "de-karfreitag",
      offsetDays: -2,
      name: "Karfreitag",
      nameEn: "Good Friday",
    },
    {
      type: "easter",
      id: "de-ostermontag",
      offsetDays: 1,
      name: "Ostermontag",
      nameEn: "Easter Monday",
    },
    {
      type: "fixed",
      id: "de-tag-der-arbeit",
      month: 5,
      day: 1,
      name: "Tag der Arbeit",
      nameEn: "Labour Day",
    },
    {
      type: "easter",
      id: "de-christi-himmelfahrt",
      offsetDays: 39,
      name: "Christi Himmelfahrt",
      nameEn: "Ascension Day",
    },
    {
      type: "easter",
      id: "de-pfingstmontag",
      offsetDays: 50,
      name: "Pfingstmontag",
      nameEn: "Whit Monday",
    },
    {
      type: "fixed",
      id: "de-deutsche-einheit",
      month: 10,
      day: 3,
      name: "Tag der Deutschen Einheit",
      nameEn: "German Unity Day",
      validFromYear: 1990,
    },
    {
      type: "fixed",
      id: "de-weihnachtstag-1",
      month: 12,
      day: 25,
      name: "1. Weihnachtstag",
      nameEn: "Christmas Day",
    },
    {
      type: "fixed",
      id: "de-weihnachtstag-2",
      month: 12,
      day: 26,
      name: "2. Weihnachtstag",
      nameEn: "St. Stephen's Day",
    },
  ],
};
