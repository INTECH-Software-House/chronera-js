import { createLocalDate } from "../../core/local-date.js";
import { getIsoDayOfWeek } from "../../core/iso-week.js";
import { getAbsoluteDay } from "../../operations/convenience.js";

import type {
  FloatingHolidayRule,
  PublicHoliday,
  CountryCode,
} from "../types.js";

function getGregorianDaysInMonth(year: number, month: number): number {
  if (month === 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return isLeap ? 29 : 28;
  }
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

/**
 * Evaluates a floating weekday rule for a given year.
 * e.g., 4th Thursday of November (Thanksgiving), 2nd Monday of January (Coming of Age Day).
 */
export function evaluateFloatingRule(
  rule: FloatingHolidayRule,
  year: number,
  country: CountryCode | (string & {}),
): readonly PublicHoliday[] {
  if (rule.validFromYear && year < rule.validFromYear) return [];
  if (rule.validUntilYear && year > rule.validUntilYear) return [];

  const targetWeekday = rule.weekday; // 1 = Mon ... 7 = Sun
  let targetDay: number;

  if (rule.occurrence === -1) {
    // Last occurrence in the month
    const totalDays = getGregorianDaysInMonth(year, rule.month);
    const lastDate = createLocalDate(year, rule.month, totalDays);
    const lastDow = getIsoDayOfWeek(getAbsoluteDay(lastDate));
    const diff = (lastDow - targetWeekday + 7) % 7;
    targetDay = totalDays - diff;
  } else {
    // 1st, 2nd, 3rd, 4th, or 5th occurrence
    const firstDate = createLocalDate(year, rule.month, 1);
    const firstDow = getIsoDayOfWeek(getAbsoluteDay(firstDate));
    const firstOccurrenceDay = 1 + ((targetWeekday - firstDow + 7) % 7);
    targetDay = firstOccurrenceDay + (rule.occurrence - 1) * 7;

    const totalDays = getGregorianDaysInMonth(year, rule.month);
    if (targetDay > totalDays) {
      return []; // Month doesn't have a 5th occurrence
    }
  }

  const date = createLocalDate(year, rule.month, targetDay);
  return [
    {
      id: rule.id,
      date,
      name: rule.name,
      nameEn: rule.nameEn,
      country,
      isObserved: false,
    },
  ];
}
