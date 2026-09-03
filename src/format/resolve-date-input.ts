import { ChroneraError } from "../errors/errors.js";
import { instantFromDate } from "../core/instant.js";
import { projectInstantToZonedFields } from "../runtime/timezone.js";
import { formatGregorianMonthCode } from "../core/gregorian-math.js";
import { convertCalendarDateWithRegistry } from "../operations/convert-calendar-date.js";
import { absoluteDayFromGregorianFields } from "../core/absolute-day.js";

import type { CalendarRegistry } from "../calendar/registry.js";
import type {
  CalendarDate,
  CalendarId,
  FormatDateBaseOptions,
  FormatDateInput,
  Instant,
  TimeZoneId,
} from "../public-types.js";

export interface ResolvedDateFormattingInput {
  calendarDate: CalendarDate;
  instant?: Instant;
  absoluteDay: number;
  timeZone?: TimeZoneId;
}

export function resolveDateFormattingInput(
  registry: CalendarRegistry,
  input: FormatDateInput,
  options: Readonly<FormatDateBaseOptions> = {},
): ResolvedDateFormattingInput {
  const targetCalendar = options.calendar;

  // Date-only input (LocalDate)
  if ("kind" in input && input.kind === "local-date") {
    if (options.timeZone !== undefined) {
      throw new ChroneraError(
        "CHRONERA_INCOMPATIBLE_OPTION",
        "Timezone option is forbidden for date-only inputs.",
      );
    }

    const monthCode = formatGregorianMonthCode(input.month);
    let calDate: CalendarDate = {
      kind: "calendar-date",
      calendar: "gregory",
      year: input.year,
      monthCode,
      month: input.month,
      day: input.day,
      era: "CE",
      eraYear: input.year,
    };

    if (
      targetCalendar &&
      targetCalendar !== "gregory" &&
      targetCalendar !== "iso8601"
    ) {
      const conv = convertCalendarDateWithRegistry(
        registry,
        calDate,
        targetCalendar,
      );
      calDate = conv.value;
    }

    const absDay = absoluteDayFromGregorianFields(
      input.year,
      input.month,
      input.day,
    );
    return {
      calendarDate: calDate,
      absoluteDay: absDay,
    };
  }

  // CalendarDate input
  if ("kind" in input && input.kind === "calendar-date") {
    if (options.timeZone !== undefined) {
      throw new ChroneraError(
        "CHRONERA_INCOMPATIBLE_OPTION",
        "Timezone option is forbidden for calendar date inputs.",
      );
    }

    let calDate = input;
    if (targetCalendar && targetCalendar !== input.calendar) {
      const conv = convertCalendarDateWithRegistry(
        registry,
        input,
        targetCalendar,
      );
      calDate = conv.value;
    }

    const adapter = registry.getAdapter(calDate.calendar);
    if (!adapter.converter) {
      throw new ChroneraError(
        "CHRONERA_UNSUPPORTED_OPERATION",
        `Calendar "${calDate.calendar}" does not support conversion to absolute day.`,
      );
    }
    const absDay = adapter.converter.toAbsoluteDay(calDate);

    return {
      calendarDate: calDate,
      absoluteDay: absDay,
    };
  }

  // Instant or Date input
  let instant: Instant;
  if ("kind" in input && input.kind === "instant") {
    instant = input;
  } else if (input instanceof Date) {
    instant = instantFromDate(input);
  } else {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      "Expected LocalDate, CalendarDate, Instant, or Date.",
    );
  }

  const timeZone: TimeZoneId = options.timeZone ?? "UTC";
  const calId: CalendarId = targetCalendar ?? "gregory";

  const zonedFields = projectInstantToZonedFields(instant, timeZone);
  let calDate: CalendarDate = {
    kind: "calendar-date",
    calendar: "gregory",
    year: zonedFields.year,
    monthCode: formatGregorianMonthCode(zonedFields.month),
    month: zonedFields.month,
    day: zonedFields.day,
    eraYear: zonedFields.year,
    ...(zonedFields.era !== undefined ? { era: zonedFields.era } : {}),
  };

  if (calId !== "gregory" && calId !== "iso8601") {
    const conv = convertCalendarDateWithRegistry(registry, calDate, calId);
    calDate = conv.value;
  }

  const absDay = absoluteDayFromGregorianFields(
    zonedFields.year,
    zonedFields.month,
    zonedFields.day,
  );

  return {
    calendarDate: calDate,
    instant,
    absoluteDay: absDay,
    timeZone,
  };
}
