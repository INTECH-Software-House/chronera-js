import {
  absoluteDayFromGregorianFields,
  gregorianFieldsFromAbsoluteDay,
} from "../../core/absolute-day.js";
import {
  formatGregorianMonthCode,
  parseGregorianMonthCode,
} from "../../core/gregorian-math.js";
import { ChroneraError } from "../../errors/errors.js";
import {
  ROC_IDENTITY,
  ROC_OFFSET,
  ROC_START_ABSOLUTE_DAY,
} from "./constants.js";
import { rocValidator } from "./validator.js";

import type { CalendarAdapter } from "../types.js";
import type { CalendarDate } from "../../public-types.js";

export const rocAdapter: CalendarAdapter = {
  identity: ROC_IDENTITY,
  validator: rocValidator,
  converter: {
    identity: ROC_IDENTITY,
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
          `ROC calendar supports years >= 1. Received year ${date.year}.`,
        );
      }

      const gregorianYear = date.year + ROC_OFFSET;
      if (gregorianYear > 9999) {
        throw new ChroneraError(
          "CHRONERA_OUT_OF_RANGE",
          `ROC date exceeds maximum Gregorian year 9999.`,
        );
      }

      return absoluteDayFromGregorianFields(gregorianYear, month, date.day);
    },

    fromAbsoluteDay(absoluteDay: number): CalendarDate {
      if (absoluteDay < ROC_START_ABSOLUTE_DAY) {
        throw new ChroneraError(
          "CHRONERA_OUT_OF_RANGE",
          `Date is before ROC calendar epoch (1912-01-01).`,
        );
      }

      const fields = gregorianFieldsFromAbsoluteDay(absoluteDay);
      if (fields.year > 9999) {
        throw new ChroneraError(
          "CHRONERA_OUT_OF_RANGE",
          `Date exceeds maximum supported year 9999.`,
        );
      }

      const rocYear = fields.year - ROC_OFFSET;
      return {
        kind: "calendar-date",
        calendar: "roc",
        era: "roc",
        eraYear: rocYear,
        year: rocYear,
        monthCode: formatGregorianMonthCode(fields.month),
        month: fields.month,
        day: fields.day,
      };
    },
  },
};
