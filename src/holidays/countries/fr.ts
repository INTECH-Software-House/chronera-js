import type { HolidayCalendar } from "../types.js";

/**
 * Official Public Holidays for France 🇫🇷
 * Jours fériés légaux en France.
 */
export const franceHolidays: HolidayCalendar = {
  country: "FR",
  countryName: "France",
  defaultWeekendDays: [6, 7],
  rules: [
    {
      type: "fixed",
      id: "fr-jour-de-lan",
      month: 1,
      day: 1,
      name: "Jour de l'An",
      nameEn: "New Year's Day",
    },
    {
      type: "easter",
      id: "fr-lundi-de-paques",
      offsetDays: 1,
      name: "Lundi de Pâques",
      nameEn: "Easter Monday",
    },
    {
      type: "fixed",
      id: "fr-fete-du-travail",
      month: 5,
      day: 1,
      name: "Fête du Travail",
      nameEn: "Labour Day",
    },
    {
      type: "fixed",
      id: "fr-victoire-1945",
      month: 5,
      day: 8,
      name: "Victoire 1945",
      nameEn: "Victory in Europe Day",
    },
    {
      type: "easter",
      id: "fr-ascension",
      offsetDays: 39,
      name: "Ascension",
      nameEn: "Ascension Day",
    },
    {
      type: "easter",
      id: "fr-lundi-de-pentecote",
      offsetDays: 50,
      name: "Lundi de Pentecôte",
      nameEn: "Whit Monday",
    },
    {
      type: "fixed",
      id: "fr-fete-nationale",
      month: 7,
      day: 14,
      name: "Fête Nationale (Bastille Day)",
      nameEn: "Bastille Day",
    },
    {
      type: "fixed",
      id: "fr-assomption",
      month: 8,
      day: 15,
      name: "Assomption",
      nameEn: "Assumption of Mary",
    },
    {
      type: "fixed",
      id: "fr-toussaint",
      month: 11,
      day: 1,
      name: "Toussaint",
      nameEn: "All Saints' Day",
    },
    {
      type: "fixed",
      id: "fr-armistice",
      month: 11,
      day: 11,
      name: "Armistice 1918",
      nameEn: "Armistice Day",
    },
    {
      type: "fixed",
      id: "fr-noel",
      month: 12,
      day: 25,
      name: "Noël",
      nameEn: "Christmas Day",
    },
  ],
};
