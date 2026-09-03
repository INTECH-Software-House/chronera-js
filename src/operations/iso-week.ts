import { defaultCalendarRegistry } from "../calendar/registry.js";
import { absoluteDayFromGregorianFields } from "../core/absolute-day.js";
import {
  formatIsoWeekString,
  getIsoWeekFromAbsoluteDay,
} from "../core/iso-week.js";
import { ChroneraError } from "../errors/errors.js";

import type { CalendarRegistry } from "../calendar/registry.js";
import type { IsoWeekFields } from "../core/iso-week.js";
import type { CalendarDate, LocalDate } from "../public-types.js";

export type { IsoWeekFields };

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
    "Invalid input for ISO week calculation; expected LocalDate or CalendarDate.",
  );
}

export function getIsoWeekWithRegistry(
  registry: CalendarRegistry,
  input: LocalDate | CalendarDate,
): IsoWeekFields {
  const absoluteDay = getAbsoluteDay(input, registry);
  return getIsoWeekFromAbsoluteDay(absoluteDay);
}

export function getIsoWeek(input: LocalDate | CalendarDate): IsoWeekFields {
  return getIsoWeekWithRegistry(defaultCalendarRegistry, input);
}

export function formatIsoWeek(
  input: LocalDate | CalendarDate,
  options: { includeDayOfWeek?: boolean } = {},
): string {
  const fields = getIsoWeek(input);
  return formatIsoWeekString(fields, options.includeDayOfWeek ?? true);
}
