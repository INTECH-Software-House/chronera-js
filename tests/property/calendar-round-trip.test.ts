import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  absoluteDayFromGregorianFields,
  gregorianFieldsFromAbsoluteDay,
  MAX_ABSOLUTE_DAY,
  MIN_ABSOLUTE_DAY,
} from "../../src/core/absolute-day.js";
import { convertCalendarDate } from "../../src/operations/convert-calendar-date.js";
import { formatGregorianMonthCode } from "../../src/core/gregorian-math.js";

import type { CalendarDate } from "../../src/public-types.js";

describe("property: calendar round trip", () => {
  it("absolute day <-> gregorian round-trip is bijective across all valid days", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: MIN_ABSOLUTE_DAY, max: MAX_ABSOLUTE_DAY }),
        (absDay) => {
          const fields = gregorianFieldsFromAbsoluteDay(absDay);
          const back = absoluteDayFromGregorianFields(
            fields.year,
            fields.month,
            fields.day,
          );
          expect(back).toBe(absDay);
        },
      ),
      { numRuns: 1000 },
    );
  });

  it("gregorian <-> buddhist conversion round-trips for valid years", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 28 }),
        (year, month, day) => {
          const greg: CalendarDate = {
            kind: "calendar-date",
            calendar: "gregory",
            year,
            monthCode: formatGregorianMonthCode(month),
            month,
            day,
          };

          const toBuddhist = convertCalendarDate(greg, "buddhist");
          const backToGreg = convertCalendarDate(toBuddhist.value, "gregory");

          expect(backToGreg.value.year).toBe(year);
          expect(backToGreg.value.month).toBe(month);
          expect(backToGreg.value.day).toBe(day);
        },
      ),
      { numRuns: 500 },
    );
  });
});
