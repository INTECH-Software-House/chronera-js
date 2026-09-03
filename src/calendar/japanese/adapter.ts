import {
  absoluteDayFromGregorianFields,
  gregorianFieldsFromAbsoluteDay,
} from "../../core/absolute-day.js";
import {
  formatGregorianMonthCode,
  parseGregorianMonthCode,
} from "../../core/gregorian-math.js";
import { ChroneraError } from "../../errors/errors.js";
import { JAPANESE_ERAS, JAPANESE_IDENTITY } from "./constants.js";
import { japaneseValidator, resolveJapaneseEra } from "./validator.js";

import type { CalendarAdapter } from "../types.js";
import type { CalendarDate } from "../../public-types.js";

export function findJapaneseEraForAbsoluteDay(absoluteDay: number) {
  for (const era of JAPANESE_ERAS) {
    if (absoluteDay >= era.startAbsoluteDay) {
      return era;
    }
  }
  // Fallback to earliest supported era (Meiji)
  return JAPANESE_ERAS[JAPANESE_ERAS.length - 1]!;
}

export const japaneseAdapter: CalendarAdapter = {
  identity: JAPANESE_IDENTITY,
  validator: japaneseValidator,
  converter: {
    identity: JAPANESE_IDENTITY,
    toAbsoluteDay(date: CalendarDate): number {
      const month = parseGregorianMonthCode(date.monthCode);
      if (month === null) {
        throw new ChroneraError(
          "CHRONERA_INVALID_DATE",
          `Invalid monthCode: "${date.monthCode}". Expected M01-M12.`,
        );
      }

      let gregorianYear = date.year;
      if (date.era) {
        const eraDef = resolveJapaneseEra(date.era);
        if (!eraDef) {
          throw new ChroneraError(
            "CHRONERA_INVALID_DATE",
            `Unknown Japanese era: "${date.era}". Expected reiwa, heisei, showa, taisho, meiji.`,
          );
        }
        if (date.eraYear !== undefined) {
          gregorianYear = eraDef.offset + date.eraYear;
        } else if (date.year < 100) {
          gregorianYear = eraDef.offset + date.year;
        }
      }

      if (gregorianYear < 1868 || gregorianYear > 9999) {
        throw new ChroneraError(
          "CHRONERA_OUT_OF_RANGE",
          `Japanese calendar supports dates between 1868 and 9999 CE. Received year ${gregorianYear}.`,
        );
      }

      return absoluteDayFromGregorianFields(gregorianYear, month, date.day);
    },

    fromAbsoluteDay(absoluteDay: number): CalendarDate {
      const fields = gregorianFieldsFromAbsoluteDay(absoluteDay);
      if (fields.year < 1868 || fields.year > 9999) {
        throw new ChroneraError(
          "CHRONERA_OUT_OF_RANGE",
          `Japanese calendar supports dates between 1868 and 9999 CE. Received Gregorian year ${fields.year}.`,
        );
      }

      const era = findJapaneseEraForAbsoluteDay(absoluteDay);
      const eraYear = fields.year - era.offset;

      return {
        kind: "calendar-date",
        calendar: "japanese",
        era: era.id,
        eraYear,
        year: fields.year,
        monthCode: formatGregorianMonthCode(fields.month),
        month: fields.month,
        day: fields.day,
      };
    },
  },
};
