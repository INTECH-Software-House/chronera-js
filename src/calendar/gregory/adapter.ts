import {
  absoluteDayFromGregorian,
  gregorianFromAbsoluteDay,
} from "./absolute-day.js";
import { GREGORIAN_IDENTITY, ISO8601_IDENTITY } from "./constants.js";
import { gregorianValidator } from "./validator.js";
import { ChroneraError } from "../../errors/errors.js";
import { daysInGregorianMonth } from "../../core/gregorian-math.js";

import type { CalendarAdapter } from "../types.js";
import type { CalendarDate, Duration, MonthCode } from "../../public-types.js";

function addGregorianDuration(
  date: CalendarDate,
  dur: Duration,
  overflow: "constrain" | "reject",
): CalendarDate {
  let year = date.year + (dur.years ?? 0);
  let month = date.month ?? Number.parseInt(date.monthCode.slice(1), 10);
  month += dur.months ?? 0;

  // Normalize year and month
  while (month > 12) {
    year += 1;
    month -= 12;
  }
  while (month < 1) {
    year -= 1;
    month += 12;
  }

  let day = date.day;
  const maxDay = daysInGregorianMonth(year, month);
  if (day > maxDay) {
    if (overflow === "reject") {
      throw new ChroneraError(
        "CHRONERA_OUT_OF_RANGE",
        `Day ${day} exceeds maximum days ${maxDay} for month ${month} in year ${year}.`,
      );
    }
    day = maxDay;
  }

  // Days and weeks addition via absolute day
  let absDay = absoluteDayFromGregorian({
    year,
    monthCode: `M${String(month).padStart(2, "0")}` as MonthCode,
    day,
  });

  const extraDays = (dur.days ?? 0) + (dur.weeks ?? 0) * 7;
  absDay += extraDays;

  const resultFields = gregorianFromAbsoluteDay(absDay);
  return {
    kind: "calendar-date",
    calendar: date.calendar,
    year: resultFields.year,
    monthCode: resultFields.monthCode,
    month: resultFields.month,
    day: resultFields.day,
    era: date.era ?? "CE",
    eraYear: resultFields.year,
  };
}

export const gregorianAdapter: CalendarAdapter = {
  identity: GREGORIAN_IDENTITY,

  converter: {
    identity: GREGORIAN_IDENTITY,
    toAbsoluteDay(date: CalendarDate): number {
      return absoluteDayFromGregorian({
        year: date.year,
        monthCode: date.monthCode,
        day: date.day,
      });
    },
    fromAbsoluteDay(day: number): CalendarDate {
      const g = gregorianFromAbsoluteDay(day);
      return {
        kind: "calendar-date",
        calendar: "gregory",
        era: "CE",
        eraYear: g.year,
        year: g.year,
        monthCode: g.monthCode,
        month: g.month,
        day: g.day,
      };
    },
  },

  validator: gregorianValidator,

  arithmetic: {
    identity: GREGORIAN_IDENTITY,
    add: addGregorianDuration,
  },
};

export const iso8601Adapter: CalendarAdapter = {
  ...gregorianAdapter,
  identity: ISO8601_IDENTITY,
  converter: {
    identity: ISO8601_IDENTITY,
    toAbsoluteDay: gregorianAdapter.converter!.toAbsoluteDay,
    fromAbsoluteDay(day: number): CalendarDate {
      const base = gregorianAdapter.converter!.fromAbsoluteDay(day);
      return {
        ...base,
        calendar: "iso8601",
      };
    },
  },
};
