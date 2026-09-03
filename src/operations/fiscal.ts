import { getCalendarQuarter, getFiscalFields } from "../core/fiscal.js";
import { parseGregorianMonthCode } from "../core/gregorian-math.js";
import { ChroneraError } from "../errors/errors.js";

import type {
  FiscalFields,
  FiscalOptions,
  QuarterNumber,
} from "../core/fiscal.js";
import type { CalendarDate, LocalDate } from "../public-types.js";

export type { FiscalFields, FiscalOptions, QuarterNumber };

function getYearAndMonth(input: LocalDate | CalendarDate): {
  year: number;
  month: number;
} {
  if (input.kind === "local-date") {
    return { year: input.year, month: input.month };
  }
  if (input.kind === "calendar-date") {
    const m = input.month ?? parseGregorianMonthCode(input.monthCode);
    if (m === null) {
      throw new ChroneraError(
        "CHRONERA_INVALID_DATE",
        `Invalid month code for fiscal calculations: ${input.monthCode}`,
      );
    }
    return { year: input.year, month: m };
  }
  throw new ChroneraError(
    "CHRONERA_INVALID_DATE",
    "Invalid input for fiscal calculations; expected LocalDate or CalendarDate.",
  );
}

export function getQuarter(input: LocalDate | CalendarDate): QuarterNumber {
  const { month } = getYearAndMonth(input);
  return getCalendarQuarter(month);
}

export function getFiscalYear(
  input: LocalDate | CalendarDate,
  options: FiscalOptions = {},
): FiscalFields {
  const { year, month } = getYearAndMonth(input);
  return getFiscalFields(year, month, options);
}
