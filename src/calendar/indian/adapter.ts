import {
  absoluteDayFromGregorianFields,
  gregorianFieldsFromAbsoluteDay,
} from "../../core/absolute-day.js";
import {
  formatGregorianMonthCode,
  parseGregorianMonthCode,
} from "../../core/gregorian-math.js";
import { ChroneraError } from "../../errors/errors.js";
import { INDIAN_IDENTITY, SAKA_OFFSET } from "./constants.js";
import {
  daysInIndianMonth,
  indianValidator,
  isIndianLeapYear,
} from "./validator.js";

import type { CalendarAdapter } from "../types.js";
import type { CalendarDate } from "../../public-types.js";

function getChaitra1AbsoluteDay(sakaYear: number): number {
  const gYear = sakaYear + SAKA_OFFSET;
  const isLeap = isIndianLeapYear(sakaYear);
  return absoluteDayFromGregorianFields(gYear, 3, isLeap ? 21 : 22);
}

export const indianAdapter: CalendarAdapter = {
  identity: INDIAN_IDENTITY,
  validator: indianValidator,
  converter: {
    identity: INDIAN_IDENTITY,
    toAbsoluteDay(date: CalendarDate): number {
      const month = parseGregorianMonthCode(date.monthCode);
      if (month === null) {
        throw new ChroneraError(
          "CHRONERA_INVALID_DATE",
          `Invalid monthCode: "${date.monthCode}". Expected M01-M12.`,
        );
      }

      if (date.year < 1) {
        throw new ChroneraError(
          "CHRONERA_OUT_OF_RANGE",
          `Indian Saka calendar supports years >= 1. Received year ${date.year}.`,
        );
      }

      const chaitra1 = getChaitra1AbsoluteDay(date.year);
      let daysBeforeMonth = 0;
      for (let m = 1; m < month; m++) {
        daysBeforeMonth += daysInIndianMonth(date.year, m);
      }

      return chaitra1 + daysBeforeMonth + (date.day - 1);
    },

    fromAbsoluteDay(absoluteDay: number): CalendarDate {
      const gFields = gregorianFieldsFromAbsoluteDay(absoluteDay);
      let sakaYear = gFields.year - SAKA_OFFSET;

      // Adjust if before 1 Chaitra of candidate sakaYear
      if (absoluteDay < getChaitra1AbsoluteDay(sakaYear)) {
        sakaYear--;
      }

      if (sakaYear < 1) {
        throw new ChroneraError(
          "CHRONERA_OUT_OF_RANGE",
          `Date is before Indian Saka epoch (Year 1, 79 CE).`,
        );
      }

      const chaitra1 = getChaitra1AbsoluteDay(sakaYear);
      let dayOfYear = absoluteDay - chaitra1; // 0-based

      let month = 1;
      while (month <= 12) {
        const dim = daysInIndianMonth(sakaYear, month);
        if (dayOfYear < dim) {
          break;
        }
        dayOfYear -= dim;
        month++;
      }

      const day = dayOfYear + 1;
      return {
        kind: "calendar-date",
        calendar: "indian",
        era: "saka",
        eraYear: sakaYear,
        year: sakaYear,
        monthCode: formatGregorianMonthCode(month),
        month,
        day,
      };
    },
  },
};
