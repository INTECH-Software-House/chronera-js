import { ChroneraError } from "../errors/errors.js";
import { daysInGregorianMonth } from "./gregorian-math.js";
import { requireInteger } from "./integer.js";

import type { LocalDate } from "../public-types.js";

export function localDate(year: number, month: number, day: number): LocalDate {
  requireInteger("year", year);
  requireInteger("month", month);
  requireInteger("day", day);

  if (year < 1 || year > 9999) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `Gregorian year must be between 1 and 9999; received ${year}.`,
    );
  }

  const maximumDay = daysInGregorianMonth(year, month);

  if (day < 1 || day > maximumDay) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Invalid day ${day} for Gregorian month ${month} in year ${year}.`,
    );
  }

  return {
    kind: "local-date",
    year,
    month,
    day,
  };
}
