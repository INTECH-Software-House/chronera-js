import { localDate } from "../../core/local-date.js";
import { getIsoDayOfWeek } from "../../core/iso-week.js";
import { addDays, getAbsoluteDay } from "../../operations/convenience.js";

import type { PublicHoliday } from "../types.js";

export interface ThaiLunarHolidayDef {
  readonly makhaBucha: [month: number, day: number];
  readonly visakhaBucha: [month: number, day: number];
  readonly asarnhaBucha: [month: number, day: number];
  readonly khaoPhansa: [month: number, day: number];
  readonly royalPloughing?: [month: number, day: number];
}

/**
 * Astronomical and Royal Gazette verified Thai Buddhist lunar and royal ceremony dates (2020-2035).
 */
export const THAI_LUNAR_HOLIDAYS_TABLE: Record<number, ThaiLunarHolidayDef> = {
  2020: {
    makhaBucha: [2, 8],
    visakhaBucha: [5, 6],
    asarnhaBucha: [7, 5],
    khaoPhansa: [7, 6],
    royalPloughing: [5, 11],
  },
  2021: {
    makhaBucha: [2, 26],
    visakhaBucha: [5, 26],
    asarnhaBucha: [7, 24],
    khaoPhansa: [7, 25],
    royalPloughing: [5, 10],
  },
  2022: {
    makhaBucha: [2, 16],
    visakhaBucha: [5, 15],
    asarnhaBucha: [7, 13],
    khaoPhansa: [7, 14],
    royalPloughing: [5, 13],
  },
  2023: {
    makhaBucha: [3, 6],
    visakhaBucha: [6, 3],
    asarnhaBucha: [8, 1],
    khaoPhansa: [8, 2],
    royalPloughing: [5, 17],
  },
  2024: {
    makhaBucha: [2, 24],
    visakhaBucha: [5, 22],
    asarnhaBucha: [7, 20],
    khaoPhansa: [7, 21],
    royalPloughing: [5, 10],
  },
  2025: {
    makhaBucha: [2, 12],
    visakhaBucha: [5, 11],
    asarnhaBucha: [7, 10],
    khaoPhansa: [7, 11],
    royalPloughing: [5, 9],
  },
  2026: {
    makhaBucha: [3, 3],
    visakhaBucha: [5, 31],
    asarnhaBucha: [7, 29],
    khaoPhansa: [7, 30],
    royalPloughing: [5, 11],
  },
  2027: {
    makhaBucha: [2, 21],
    visakhaBucha: [5, 19],
    asarnhaBucha: [7, 17],
    khaoPhansa: [7, 18],
    royalPloughing: [5, 10],
  },
  2028: {
    makhaBucha: [2, 10],
    visakhaBucha: [5, 8],
    asarnhaBucha: [7, 6],
    khaoPhansa: [7, 7],
    royalPloughing: [5, 8],
  },
  2029: {
    makhaBucha: [2, 28],
    visakhaBucha: [5, 27],
    asarnhaBucha: [7, 25],
    khaoPhansa: [7, 26],
    royalPloughing: [5, 11],
  },
  2030: {
    makhaBucha: [2, 17],
    visakhaBucha: [5, 16],
    asarnhaBucha: [7, 14],
    khaoPhansa: [7, 15],
    royalPloughing: [5, 10],
  },
  2031: {
    makhaBucha: [2, 7],
    visakhaBucha: [5, 6],
    asarnhaBucha: [7, 5],
    khaoPhansa: [7, 6],
    royalPloughing: [5, 9],
  },
  2032: {
    makhaBucha: [2, 25],
    visakhaBucha: [5, 23],
    asarnhaBucha: [7, 22],
    khaoPhansa: [7, 23],
    royalPloughing: [5, 10],
  },
  2033: {
    makhaBucha: [2, 14],
    visakhaBucha: [5, 13],
    asarnhaBucha: [7, 11],
    khaoPhansa: [7, 12],
    royalPloughing: [5, 10],
  },
  2034: {
    makhaBucha: [3, 4],
    visakhaBucha: [6, 1],
    asarnhaBucha: [7, 30],
    khaoPhansa: [7, 31],
    royalPloughing: [5, 11],
  },
  2035: {
    makhaBucha: [2, 22],
    visakhaBucha: [5, 21],
    asarnhaBucha: [7, 19],
    khaoPhansa: [7, 20],
    royalPloughing: [5, 10],
  },
};

export function evaluateThaiLunarHoliday(
  id: string,
  name: string,
  nameEn: string,
  month: number,
  day: number,
  year: number,
  country: string,
  includeObserved = true,
): readonly PublicHoliday[] {
  const originalDate = localDate(year, month, day);
  const results: PublicHoliday[] = [
    {
      id,
      date: originalDate,
      name,
      nameEn,
      country,
      isObserved: false,
    },
  ];

  if (includeObserved) {
    const abs = getAbsoluteDay(originalDate);
    const dow = getIsoDayOfWeek(abs); // 6 = Sat, 7 = Sun
    if (dow === 6) {
      results.push({
        id: `${id}-observed`,
        date: addDays(originalDate, 2),
        name: `${name} (ชดเชย / Observed)`,
        nameEn: `${nameEn} (Observed)`,
        country,
        isObserved: true,
        originalDate,
      });
    } else if (dow === 7) {
      results.push({
        id: `${id}-observed`,
        date: addDays(originalDate, 1),
        name: `${name} (ชดเชย / Observed)`,
        nameEn: `${nameEn} (Observed)`,
        country,
        isObserved: true,
        originalDate,
      });
    }
  }

  return results;
}
