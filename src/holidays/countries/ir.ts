import type { HolidayCalendar } from "../types.js";

/**
 * Official Public Holidays for Iran 🇮🇷
 * Persian Solar Hijri (Nowruz) & Islamic statutory holidays.
 * Legal weekend: Thursday (4) & Friday (5).
 */
export const iranHolidays: HolidayCalendar = {
  country: "IR",
  countryName: "Iran",
  defaultWeekendDays: [4, 5], // Thursday, Friday
  rules: [
    {
      type: "fixed",
      id: "ir-nowruz-1",
      month: 3,
      day: 21, // 1 Farvardin
      name: "جشن نوروز",
      nameEn: "Nowruz Day 1",
    },
    {
      type: "fixed",
      id: "ir-nowruz-2",
      month: 3,
      day: 22, // 2 Farvardin
      name: "جشن نوروز",
      nameEn: "Nowruz Day 2",
    },
    {
      type: "fixed",
      id: "ir-nowruz-3",
      month: 3,
      day: 23, // 3 Farvardin
      name: "جشن نوروز",
      nameEn: "Nowruz Day 3",
    },
    {
      type: "fixed",
      id: "ir-nowruz-4",
      month: 3,
      day: 24, // 4 Farvardin
      name: "جشن نوروز",
      nameEn: "Nowruz Day 4",
    },
    {
      type: "fixed",
      id: "ir-islamic-republic-day",
      month: 4,
      day: 1, // 12 Farvardin
      name: "روز جمهوری اسلامی",
      nameEn: "Islamic Republic Day",
    },
    {
      type: "fixed",
      id: "ir-nature-day",
      month: 4,
      day: 2, // 13 Farvardin
      name: "روز طبیعت / سیزده‌بدر",
      nameEn: "Nature Day (Sizdah Bedar)",
    },
    {
      type: "fixed",
      id: "ir-khomeini-demise",
      month: 6,
      day: 4, // 14 Khordad
      name: "رحلت امام خمینی",
      nameEn: "Demise of Imam Khomeini",
    },
    {
      type: "fixed",
      id: "ir-khordad-revolt",
      month: 6,
      day: 5, // 15 Khordad
      name: "قیام ۱۵ خرداد",
      nameEn: "Revolt of Khordad 15",
    },
    {
      type: "fixed",
      id: "ir-revolution-day",
      month: 2,
      day: 11, // 22 Bahman
      name: "پیروزی انقلاب اسلامی",
      nameEn: "Islamic Revolution Day",
    },
    {
      type: "fixed",
      id: "ir-oil-nationalization",
      month: 3,
      day: 19, // 29 Esfand
      name: "روز ملی شدن صنعت نفت",
      nameEn: "Oil Nationalization Day",
    },
  ],
};
