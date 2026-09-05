import type { HolidayCalendar } from "../types.js";

/**
 * Official Public Holidays for India 🇮🇳
 * Includes the 3 mandatory national gazetted holidays.
 */
export const indiaHolidays: HolidayCalendar = {
  country: "IN",
  countryName: "India",
  defaultWeekendDays: [6, 7],
  rules: [
    {
      type: "fixed",
      id: "in-republic-day",
      month: 1,
      day: 26,
      name: "गणतंत्र दिवस",
      nameEn: "Republic Day",
    },
    {
      type: "fixed",
      id: "in-may-day",
      month: 5,
      day: 1,
      name: "मई दिवस / मजदूर दिवस",
      nameEn: "May Day / Labour Day",
    },
    {
      type: "fixed",
      id: "in-independence-day",
      month: 8,
      day: 15,
      name: "स्वतंत्रता दिवस",
      nameEn: "Independence Day",
    },
    {
      type: "fixed",
      id: "in-gandhi-jayanti",
      month: 10,
      day: 2,
      name: "गांधी जयंती",
      nameEn: "Mahatma Gandhi Jayanti",
    },
    {
      type: "fixed",
      id: "in-christmas",
      month: 12,
      day: 25,
      name: "क्रिसमस",
      nameEn: "Christmas Day",
    },
  ],
};
