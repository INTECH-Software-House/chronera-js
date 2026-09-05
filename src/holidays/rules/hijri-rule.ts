import {
  islamicCivilToAbsoluteDay,
  islamicCivilFromAbsoluteDay,
} from "../../calendar/hijri/civil-adapter.js";
import { absoluteDayFromGregorianFields } from "../../core/absolute-day.js";
import { gregorianFromAbsoluteDay } from "../../calendar/gregory/absolute-day.js";
import { localDate } from "../../core/local-date.js";
import { addDays } from "../../operations/convenience.js";

import type { HijriHolidayRule, PublicHoliday, CountryCode } from "../types.js";

/**
 * Evaluates an Islamic Lunar Hijri holiday rule for a given Gregorian solar year.
 * Handles single or multi-day statutory festivals (e.g. Eid al-Fitr, Eid al-Adha).
 */
export function evaluateHijriRule(
  rule: HijriHolidayRule,
  year: number,
  country: CountryCode | (string & {}),
): readonly PublicHoliday[] {
  if (rule.validFromYear && year < rule.validFromYear) return [];
  if (rule.validUntilYear && year > rule.validUntilYear) return [];

  const startAbs = absoluteDayFromGregorianFields(year, 1, 1);
  const endAbs = absoluteDayFromGregorianFields(year, 12, 31);

  const startHijri = islamicCivilFromAbsoluteDay(startAbs);
  const endHijri = islamicCivilFromAbsoluteDay(endAbs);

  const duration = rule.durationDays ?? 1;
  const results: PublicHoliday[] = [];

  for (let hYear = startHijri.year - 1; hYear <= endHijri.year + 1; hYear++) {
    const baseAbs = islamicCivilToAbsoluteDay(
      hYear,
      rule.hijriMonth,
      rule.hijriDay,
    );
    const gFields = gregorianFromAbsoluteDay(baseAbs);
    const baseDate = localDate(gFields.year, gFields.month, gFields.day);

    for (let dayOffset = 0; dayOffset < duration; dayOffset++) {
      const date = dayOffset === 0 ? baseDate : addDays(baseDate, dayOffset);
      if (date.year === year) {
        const idSuffix = duration > 1 ? `-day-${dayOffset + 1}` : "";
        const nameSuffix = duration > 1 ? ` (วันที่ ${dayOffset + 1})` : "";
        const nameEnSuffix = duration > 1 ? ` (Day ${dayOffset + 1})` : "";

        results.push({
          id: `${rule.id}${idSuffix}`,
          date,
          name: `${rule.name}${nameSuffix}`,
          nameEn: `${rule.nameEn}${nameEnSuffix}`,
          country,
          isObserved: false,
        });
      }
    }
  }

  return results;
}
