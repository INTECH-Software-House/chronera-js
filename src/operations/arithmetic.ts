import { defaultCalendarRegistry } from "../calendar/registry.js";
import { ChroneraError } from "../errors/errors.js";

import type { CalendarDate, Duration } from "../public-types.js";
import type { CalendarRegistry } from "../calendar/registry.js";

export function addDateDurationWithRegistry(
  registry: CalendarRegistry,
  date: CalendarDate,
  dur: Duration,
  overflow: "constrain" | "reject" = "reject",
): CalendarDate {
  const adapter = registry.getAdapter(date.calendar);
  if (!adapter.arithmetic) {
    throw new ChroneraError(
      "CHRONERA_UNSUPPORTED_OPERATION",
      `Calendar "${date.calendar}" does not support date arithmetic.`,
    );
  }
  return adapter.arithmetic.add(date, dur, overflow);
}

export function addDateDuration(
  date: CalendarDate,
  dur: Duration,
  overflow: "constrain" | "reject" = "reject",
): CalendarDate {
  return addDateDurationWithRegistry(
    defaultCalendarRegistry,
    date,
    dur,
    overflow,
  );
}
