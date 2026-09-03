import {
  absoluteDayFromGregorianFields,
  gregorianFieldsFromAbsoluteDay,
} from "../../core/absolute-day.js";
import {
  formatGregorianMonthCode,
  parseGregorianMonthCode,
} from "../../core/gregorian-math.js";

import type { MonthCode } from "../../public-types.js";

export function absoluteDayFromGregorian(date: {
  year: number;
  monthCode: MonthCode;
  day: number;
}): number {
  const month = parseGregorianMonthCode(date.monthCode);
  return absoluteDayFromGregorianFields(date.year, month, date.day);
}

export function gregorianFromAbsoluteDay(day: number): {
  year: number;
  month: number;
  monthCode: MonthCode;
  day: number;
} {
  const fields = gregorianFieldsFromAbsoluteDay(day);
  return {
    ...fields,
    monthCode: formatGregorianMonthCode(fields.month),
  };
}
