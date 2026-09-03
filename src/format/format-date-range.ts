import { ChroneraError } from "../errors/errors.js";
import { compareInstants, compareLocalDates } from "../operations/compare.js";
import { formatDate } from "./format-date.js";
import { validateAndResolveLocale } from "../locale/resolve-locale.js";

import type {
  CalendarDate,
  DateRange,
  FormatDateRangeOptions,
  Instant,
  LocalDate,
} from "../public-types.js";

export function formatDateRange(
  range: DateRange<LocalDate | CalendarDate | Instant>,
  options: Readonly<FormatDateRangeOptions> = {},
): string {
  const { start, end } = range;

  // Validate mixed input kinds
  if (start.kind !== end.kind) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Cannot format date range with mixed input kinds: "${start.kind}" and "${end.kind}".`,
    );
  }

  // Validate ordering and timezone rules
  if (start.kind === "local-date") {
    if (options.timeZone !== undefined) {
      throw new ChroneraError(
        "CHRONERA_INCOMPATIBLE_OPTION",
        "Timezone option is forbidden for date-only ranges.",
      );
    }
    const cmp = compareLocalDates(start, end as LocalDate);
    if (cmp > 0) {
      throw new ChroneraError(
        "CHRONERA_OUT_OF_RANGE",
        "Range start must be earlier than or equal to range end.",
      );
    }
  } else if (start.kind === "calendar-date") {
    if (options.timeZone !== undefined) {
      throw new ChroneraError(
        "CHRONERA_INCOMPATIBLE_OPTION",
        "Timezone option is forbidden for calendar date ranges.",
      );
    }
    const endCal = end as CalendarDate;
    if (start.calendar !== endCal.calendar) {
      throw new ChroneraError(
        "CHRONERA_INVALID_CALENDAR",
        `Cannot format range with mixed calendars "${start.calendar}" and "${endCal.calendar}".`,
      );
    }
    if (
      start.year > endCal.year ||
      (start.year === endCal.year && start.monthCode > endCal.monthCode) ||
      (start.year === endCal.year &&
        start.monthCode === endCal.monthCode &&
        start.day > endCal.day)
    ) {
      throw new ChroneraError(
        "CHRONERA_OUT_OF_RANGE",
        "Range start must be earlier than or equal to range end.",
      );
    }
  } else if (start.kind === "instant") {
    const cmp = compareInstants(start, end as Instant);
    if (cmp > 0) {
      throw new ChroneraError(
        "CHRONERA_OUT_OF_RANGE",
        "Range start must be earlier than or equal to range end.",
      );
    }
  }

  const collapse = options.collapse ?? "auto";

  if (
    collapse === "auto" &&
    typeof Intl !== "undefined" &&
    typeof (Intl.DateTimeFormat.prototype as { formatRange?: unknown })
      .formatRange === "function" &&
    options.preset === undefined
  ) {
    try {
      const localeInfo = validateAndResolveLocale(options.locale);
      const locale = localeInfo.baseLocale;
      const cal =
        options.calendar ??
        (start.kind === "calendar-date" ? start.calendar : "gregory");
      const style = options.style ?? "medium";

      let startDate: Date;
      let endDate: Date;

      if (start.kind === "local-date") {
        const endLd = end as LocalDate;
        startDate = new Date(Date.UTC(start.year, start.month - 1, start.day));
        endDate = new Date(Date.UTC(endLd.year, endLd.month - 1, endLd.day));
      } else if (start.kind === "calendar-date") {
        const endCd = end as CalendarDate;
        const startM =
          start.month ?? Number.parseInt(start.monthCode.slice(1), 10);
        const endM =
          endCd.month ?? Number.parseInt(endCd.monthCode.slice(1), 10);
        startDate = new Date(Date.UTC(start.year, startM - 1, start.day));
        endDate = new Date(Date.UTC(endCd.year, endM - 1, endCd.day));
      } else {
        startDate = new Date(start.epochMilliseconds);
        endDate = new Date((end as Instant).epochMilliseconds);
      }

      const dtf = new Intl.DateTimeFormat(locale, {
        dateStyle: style as Intl.DateTimeFormatOptions["dateStyle"],
        timeZone: options.timeZone ?? "UTC",
        ...(cal !== "iso8601" ? { calendar: cal } : { calendar: "gregory" }),
      });

      return (
        dtf as unknown as { formatRange(a: Date, b: Date): string }
      ).formatRange(startDate, endDate);
    } catch {
      // Fall through to fallback formatting
    }
  }

  // Fallback formatting: start – end
  const startFormatted = formatDate(start, options);
  const endFormatted = formatDate(end, options);
  return `${startFormatted} – ${endFormatted}`;
}
