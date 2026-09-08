import { calculateEasterSunday } from "../easter.js";
import { addDays } from "../../operations/convenience.js";

import type {
  EasterHolidayRule,
  PublicHoliday,
  CountryCode,
} from "../types.js";

/**
 * Evaluates an Easter cycle holiday rule (Good Friday, Easter Monday, Ascension Day, etc.).
 */
export function evaluateEasterRule(
  rule: EasterHolidayRule,
  year: number,
  country: CountryCode | (string & {}),
): readonly PublicHoliday[] {
  if (rule.validFromYear && year < rule.validFromYear) return [];
  if (rule.validUntilYear && year > rule.validUntilYear) return [];

  const easterSunday = calculateEasterSunday(year);
  const date =
    rule.offsetDays === 0
      ? easterSunday
      : addDays(easterSunday, rule.offsetDays);

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
