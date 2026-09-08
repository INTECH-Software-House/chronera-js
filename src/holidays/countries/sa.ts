import type { HolidayCalendar } from "../types.js";

/**
 * Official Public Holidays for the Kingdom of Saudi Arabia 🇸🇦
 * Evaluated with native Chronera Islamic Hijri adapters.
 * Default weekend: Friday & Saturday.
 */
export const saudiArabiaHolidays: HolidayCalendar = {
  country: "SA",
  countryName: "Saudi Arabia",
  defaultWeekendDays: [5, 6], // Friday, Saturday
  rules: [
    {
      type: "fixed",
      id: "sa-founding-day",
      month: 2,
      day: 22,
      name: "يوم التأسيس",
      nameEn: "Founding Day",
      validFromYear: 2022,
    },
    {
      type: "fixed",
      id: "sa-national-day",
      month: 9,
      day: 23,
      name: "اليوم الوطني",
      nameEn: "Saudi National Day",
    },
    {
      type: "hijri",
      id: "sa-eid-al-fitr",
      hijriMonth: 10, // Shawwal
      hijriDay: 1,
      durationDays: 4, // 4-day statutory holiday
      name: "إجازة عيد الفطر",
      nameEn: "Eid al-Fitr Holiday",
    },
    {
      type: "hijri",
      id: "sa-arafah-day",
      hijriMonth: 12, // Dhu al-Hijjah
      hijriDay: 9,
      name: "يوم عرفة",
      nameEn: "Day of Arafah",
    },
    {
      type: "hijri",
      id: "sa-eid-al-adha",
      hijriMonth: 12, // Dhu al-Hijjah
      hijriDay: 10,
      durationDays: 4, // 4-day statutory holiday
      name: "إجازة عيد الأضحى",
      nameEn: "Eid al-Adha Holiday",
    },
  ],
};
