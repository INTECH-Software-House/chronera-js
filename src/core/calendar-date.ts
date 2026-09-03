import { ChroneraError } from "../errors/errors.js";
import { requireInteger } from "./integer.js";

import type {
  CalendarDate,
  CalendarId,
  EraId,
  MonthCode,
} from "../public-types.js";

export interface CalendarDateInit {
  calendar: CalendarId;
  year: number;
  monthCode: MonthCode;
  day: number;
  era?: EraId;
  eraYear?: number;
  month?: number;
}

export function calendarDate(init: CalendarDateInit): CalendarDate {
  if (!init || typeof init !== "object") {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      "Expected calendar date fields object.",
    );
  }

  if (!init.calendar || typeof init.calendar !== "string") {
    throw new ChroneraError(
      "CHRONERA_INVALID_CALENDAR",
      `Invalid calendar identifier: ${String(init.calendar)}.`,
    );
  }

  requireInteger("year", init.year);
  requireInteger("day", init.day);

  if (typeof init.monthCode !== "string" || !init.monthCode.startsWith("M")) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Invalid month code: ${String(init.monthCode)}. Must start with 'M'.`,
    );
  }

  if (init.month !== undefined) {
    requireInteger("month", init.month);
  }

  if (init.eraYear !== undefined) {
    requireInteger("eraYear", init.eraYear);
  }

  let month = init.month;
  if (month === undefined && /^M\d{2}$/.test(init.monthCode)) {
    month = Number.parseInt(init.monthCode.slice(1), 10);
  }

  const result: CalendarDate = {
    kind: "calendar-date",
    calendar: init.calendar,
    year: init.year,
    monthCode: init.monthCode,
    day: init.day,
    ...(init.era !== undefined ? { era: init.era } : {}),
    ...(init.eraYear !== undefined ? { eraYear: init.eraYear } : {}),
    ...(month !== undefined ? { month } : {}),
  };

  return result;
}
