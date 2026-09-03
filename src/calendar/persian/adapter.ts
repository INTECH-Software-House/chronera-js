import {
  formatGregorianMonthCode,
  parseGregorianMonthCode,
} from "../../core/gregorian-math.js";
import { ChroneraError } from "../../errors/errors.js";
import { PERSIAN_EPOCH_ABSOLUTE_DAY, PERSIAN_IDENTITY } from "./constants.js";
import { absoluteDayToPersian, persianToAbsoluteDay } from "./math.js";
import { persianValidator } from "./validator.js";

import type { CalendarAdapter } from "../types.js";
import type { CalendarDate } from "../../public-types.js";

export const persianAdapter: CalendarAdapter = {
  identity: PERSIAN_IDENTITY,
  validator: persianValidator,
  converter: {
    identity: PERSIAN_IDENTITY,
    toAbsoluteDay(date: CalendarDate): number {
      const month = parseGregorianMonthCode(date.monthCode);
      if (month === null) {
        throw new ChroneraError(
          "CHRONERA_INVALID_DATE",
          `Invalid monthCode: "${date.monthCode}". Expected M01-M12.`,
        );
      }

      if (date.year < 1 || date.year > 9999) {
        throw new ChroneraError(
          "CHRONERA_OUT_OF_RANGE",
          `Persian calendar supports years 1..9999. Received year ${date.year}.`,
        );
      }

      return persianToAbsoluteDay(date.year, month, date.day);
    },

    fromAbsoluteDay(absoluteDay: number): CalendarDate {
      if (absoluteDay < PERSIAN_EPOCH_ABSOLUTE_DAY) {
        throw new ChroneraError(
          "CHRONERA_OUT_OF_RANGE",
          `Date is before Persian calendar epoch (622-03-22 CE).`,
        );
      }

      const { year, month, day } = absoluteDayToPersian(absoluteDay);
      if (year > 9999) {
        throw new ChroneraError(
          "CHRONERA_OUT_OF_RANGE",
          `Persian year exceeds maximum supported year 9999.`,
        );
      }

      return {
        kind: "calendar-date",
        calendar: "persian",
        era: "ap", // Anno Persico / Solar Hijri
        eraYear: year,
        year,
        monthCode: formatGregorianMonthCode(month),
        month,
        day,
      };
    },
  },
};
