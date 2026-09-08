import { evaluateFixedRule } from "./fixed-rule.js";
import { evaluateFloatingRule } from "./floating-rule.js";
import { evaluateEasterRule } from "./easter-rule.js";
import { evaluateHijriRule } from "./hijri-rule.js";

import type { HolidayRule, PublicHoliday, CountryCode } from "../types.js";

/**
 * Dispatches and evaluates any HolidayRule for a specified Gregorian year.
 */
export function evaluateRule(
  rule: HolidayRule,
  year: number,
  country: CountryCode | (string & {}),
  includeObserved = true,
): readonly PublicHoliday[] {
  switch (rule.type) {
    case "fixed":
      return evaluateFixedRule(rule, year, country, includeObserved);
    case "floating":
      return evaluateFloatingRule(rule, year, country);
    case "easter":
      return evaluateEasterRule(rule, year, country);
    case "hijri":
      return evaluateHijriRule(rule, year, country);
    case "custom":
      return rule.evaluate(year);
  }
}

export * from "./fixed-rule.js";
export * from "./floating-rule.js";
export * from "./easter-rule.js";
export * from "./hijri-rule.js";
