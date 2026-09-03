import { defaultCalendarRegistry } from "../calendar/registry.js";
import { ChroneraError } from "../errors/errors.js";

import type {
  CalendarDate,
  Comparison,
  Instant,
  LocalDate,
} from "../public-types.js";

export function compareInstants(left: Instant, right: Instant): Comparison {
  if (left.epochMilliseconds < right.epochMilliseconds) return -1;
  if (left.epochMilliseconds > right.epochMilliseconds) return 1;
  return 0;
}

export function compareLocalDates(
  left: LocalDate,
  right: LocalDate,
): Comparison {
  if (left.year !== right.year) {
    return left.year < right.year ? -1 : 1;
  }
  if (left.month !== right.month) {
    return left.month < right.month ? -1 : 1;
  }
  if (left.day !== right.day) {
    return left.day < right.day ? -1 : 1;
  }
  return 0;
}

export function sameCalendarDate(
  left: CalendarDate,
  right: CalendarDate,
): boolean {
  if (left.calendar !== right.calendar) return false;
  if (left.year !== right.year) return false;
  if (left.monthCode !== right.monthCode) return false;
  if (left.day !== right.day) return false;
  if (left.era !== right.era) return false;
  if (left.eraYear !== right.eraYear) return false;
  return true;
}

export function sameAbsoluteDate(
  left: CalendarDate,
  right: CalendarDate,
): boolean {
  const leftAdapter = defaultCalendarRegistry.getAdapter(left.calendar);
  const rightAdapter = defaultCalendarRegistry.getAdapter(right.calendar);

  if (!leftAdapter.converter) {
    throw new ChroneraError(
      "CHRONERA_UNSUPPORTED_OPERATION",
      `Calendar "${left.calendar}" does not support conversion to absolute date.`,
    );
  }
  if (!rightAdapter.converter) {
    throw new ChroneraError(
      "CHRONERA_UNSUPPORTED_OPERATION",
      `Calendar "${right.calendar}" does not support conversion to absolute date.`,
    );
  }

  const leftDay = leftAdapter.converter.toAbsoluteDay(left);
  const rightDay = rightAdapter.converter.toAbsoluteDay(right);
  return leftDay === rightDay;
}
