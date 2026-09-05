import { createLocalDate } from "../../core/local-date.js";
import { getIsoDayOfWeek } from "../../core/iso-week.js";
import { addDays, getAbsoluteDay } from "../../operations/convenience.js";

import type { FixedHolidayRule, PublicHoliday, CountryCode } from "../types.js";
import type { LocalDate } from "../../public-types.js";

/**
 * Applies legal substitution roll rules when a holiday lands on a weekend.
 */
function applyObservedRoll(
  date: LocalDate,
  rule: FixedHolidayRule,
): LocalDate | null {
  const roll = rule.observed ?? "none";
  if (roll === "none") {
    return null;
  }

  const abs = getAbsoluteDay(date);
  const dow = getIsoDayOfWeek(abs); // 1 = Mon ... 6 = Sat, 7 = Sun

  if (roll === "sunday-to-monday" && dow === 7) {
    return addDays(date, 1);
  }

  if (roll === "weekend-to-monday") {
    if (dow === 6) return addDays(date, 2);
    if (dow === 7) return addDays(date, 1);
  }

  if (roll === "sat-to-fri-sun-to-mon") {
    if (dow === 6) return addDays(date, -1);
    if (dow === 7) return addDays(date, 1);
  }

  if (roll === "iran-roll") {
    // Iran weekend is Thursday (4) & Friday (5)
    if (dow === 4 || dow === 5) {
      return addDays(date, dow === 4 ? 2 : 1);
    }
  }

  return null;
}

/**
 * Evaluates a fixed solar holiday rule for a given year.
 */
export function evaluateFixedRule(
  rule: FixedHolidayRule,
  year: number,
  country: CountryCode | (string & {}),
  includeObserved = true,
): readonly PublicHoliday[] {
  if (rule.validFromYear && year < rule.validFromYear) return [];
  if (rule.validUntilYear && year > rule.validUntilYear) return [];

  const originalDate = createLocalDate(year, rule.month, rule.day);
  const results: PublicHoliday[] = [
    {
      id: rule.id,
      date: originalDate,
      name: rule.name,
      nameEn: rule.nameEn,
      country,
      isObserved: false,
    },
  ];

  if (includeObserved) {
    const observedDate = applyObservedRoll(originalDate, rule);
    if (observedDate) {
      results.push({
        id: `${rule.id}-observed`,
        date: observedDate,
        name: `${rule.name} (ชดเชย / Observed)`,
        nameEn: `${rule.nameEn} (Observed)`,
        country,
        isObserved: true,
        originalDate,
      });
    }
  }

  return results;
}
