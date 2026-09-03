import { defaultCalendarRegistry } from "../calendar/registry.js";
import {
  absoluteDayFromGregorianFields,
  gregorianFieldsFromAbsoluteDay,
} from "../core/absolute-day.js";
import {
  fromJulianDayNumber as coreFromJdn,
  fromModifiedJulianDay as coreFromMjd,
  toJulianDayNumber as coreToJdn,
  toModifiedJulianDay as coreToMjd,
} from "../core/julian-day.js";
import { localDate } from "../core/local-date.js";
import { ChroneraError } from "../errors/errors.js";

import type { CalendarRegistry } from "../calendar/registry.js";
import type { CalendarDate, LocalDate } from "../public-types.js";

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
    "Invalid input for Julian Day calculation; expected LocalDate or CalendarDate.",
  );
}

export function toJulianDayNumber(
  input: LocalDate | CalendarDate,
  registry: CalendarRegistry = defaultCalendarRegistry,
): number {
  const absDay = getAbsoluteDay(input, registry);
  return coreToJdn(absDay);
}

export function toModifiedJulianDay(
  input: LocalDate | CalendarDate,
  registry: CalendarRegistry = defaultCalendarRegistry,
): number {
  const absDay = getAbsoluteDay(input, registry);
  return coreToMjd(absDay);
}

export function localDateFromJulianDayNumber(jdn: number): LocalDate {
  const absDay = coreFromJdn(jdn);
  const { year, month, day } = gregorianFieldsFromAbsoluteDay(absDay);
  return localDate(year, month, day);
}

export function localDateFromModifiedJulianDay(mjd: number): LocalDate {
  const absDay = coreFromMjd(mjd);
  const { year, month, day } = gregorianFieldsFromAbsoluteDay(absDay);
  return localDate(year, month, day);
}
