import {
  absoluteDayFromGregorian,
  gregorianFromAbsoluteDay,
} from "../gregory/absolute-day.js";
import { BUDDHIST_ERA_YEAR_OFFSET, BUDDHIST_IDENTITY } from "./constants.js";
import { assertBuddhistDate, buddhistValidator } from "./validator.js";

import type { CalendarDate } from "../../public-types.js";
import type { CalendarAdapter } from "../types.js";

export const buddhistAdapter: CalendarAdapter = {
  identity: BUDDHIST_IDENTITY,

  converter: {
    identity: BUDDHIST_IDENTITY,
    toAbsoluteDay(date: CalendarDate): number {
      assertBuddhistDate(date);

      return absoluteDayFromGregorian({
        year: date.year - BUDDHIST_ERA_YEAR_OFFSET,
        monthCode: date.monthCode,
        day: date.day,
      });
    },

    fromAbsoluteDay(day: number): CalendarDate {
      const gregorian = gregorianFromAbsoluteDay(day);
      const year = gregorian.year + BUDDHIST_ERA_YEAR_OFFSET;

      return {
        kind: "calendar-date",
        calendar: "buddhist",
        era: "BE",
        eraYear: year,
        year,
        monthCode: gregorian.monthCode,
        month: gregorian.month,
        day: gregorian.day,
      };
    },
  },

  validator: buddhistValidator,
};
