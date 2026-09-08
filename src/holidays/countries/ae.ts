import type { HolidayCalendar } from "../types.js";

/**
 * Official Public Holidays for the United Arab Emirates 🇦🇪
 * Note: From Jan 1, 2022, UAE adopted Saturday & Sunday weekend.
 */
export const uaeHolidays: HolidayCalendar = {
  country: "AE",
  countryName: "United Arab Emirates",
  defaultWeekendDays: [6, 7], // Saturday, Sunday (post-2022)
  rules: [
    {
      type: "fixed",
      id: "ae-new-year",
      month: 1,
      day: 1,
      name: "رأس السنة الميلادية",
      nameEn: "New Year's Day",
    },
    {
      type: "fixed",
      id: "ae-commemoration-day",
      month: 12,
      day: 1,
      name: "يوم الشهيد",
      nameEn: "Commemoration Day",
    },
    {
      type: "fixed",
      id: "ae-national-day-1",
      month: 12,
      day: 2,
      name: "اليوم الوطني",
      nameEn: "UAE National Day",
    },
    {
      type: "fixed",
      id: "ae-national-day-2",
      month: 12,
      day: 3,
      name: "إجازة اليوم الوطني",
      nameEn: "UAE National Day Holiday",
    },
    {
      type: "hijri",
      id: "ae-eid-al-fitr",
      hijriMonth: 10,
      hijriDay: 1,
      durationDays: 3,
      name: "عيد الفطر",
      nameEn: "Eid al-Fitr Holiday",
    },
    {
      type: "hijri",
      id: "ae-arafah-day",
      hijriMonth: 12,
      hijriDay: 9,
      name: "وقفة عرفة",
      nameEn: "Arafah Day",
    },
    {
      type: "hijri",
      id: "ae-eid-al-adha",
      hijriMonth: 12,
      hijriDay: 10,
      durationDays: 3,
      name: "عيد الأضحى",
      nameEn: "Eid al-Adha Holiday",
    },
  ],
};
