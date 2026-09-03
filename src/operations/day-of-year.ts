import { defaultCalendarRegistry } from "../calendar/registry.js";
import { absoluteDayFromGregorianFields } from "../core/absolute-day.js";
import {
  formatOrdinalDate as coreFormatOrdinalDate,
  getDayOfYearFromAbsoluteDay,
} from "../core/day-of-year.js";
import { ChroneraError } from "../errors/errors.js";

import type { CalendarRegistry } from "../calendar/registry.js";
import type { DayOfYearFields } from "../core/day-of-year.js";
import type { CalendarDate, LocalDate } from "../public-types.js";

export type { DayOfYearFields };

function getAbsoluteDay(
  input: LocalDate | CalendarDate,
  registry: CalendarRegistry,
): number {
  if (input.kind === "local-date") {
    return absoluteDayFromGregorianFields(input.year, input.month, input.day);
  }
  if (input.kind === "calendar-date") {
    const adapter = registry.getAdapter(input.calendar);
    if (!adapter.converter) {
      throw new ChroneraError(
        "CHRONERA_UNSUPPORTED_OPERATION",
        `Calendar "${input.calendar}" does not support conversion to absolute day.`,
      );
    }
    return adapter.converter.toAbsoluteDay(input);
  }
  throw new ChroneraError(
    "CHRONERA_INVALID_DATE",
    "Invalid input for day-of-year calculation; expected LocalDate or CalendarDate.",
  );
}

export function getDayOfYearWithRegistry(
  registry: CalendarRegistry,
  input: LocalDate | CalendarDate,
): DayOfYearFields {
  const absDay = getAbsoluteDay(input, registry);
  return getDayOfYearFromAbsoluteDay(absDay);
}

export function getDayOfYear(input: LocalDate | CalendarDate): DayOfYearFields {
  return getDayOfYearWithRegistry(defaultCalendarRegistry, input);
}

export function formatOrdinalDate(input: LocalDate | CalendarDate): string {
  const { year, dayOfYear } = getDayOfYear(input);
  return coreFormatOrdinalDate(year, dayOfYear);
}
