import { scanPattern } from "./pattern-scanner.js";
import { formatNumberWithSystem } from "../locale/numbering-system.js";
import { resolveDateFormattingInput } from "./resolve-date-input.js";
import { defaultCalendarRegistry } from "../calendar/registry.js";
import { validateAndResolveLocale } from "../locale/resolve-locale.js";
import { absoluteDayFromGregorianFields } from "../core/absolute-day.js";
import { getDayOfYearFromAbsoluteDay } from "../core/day-of-year.js";
import {
  getIsoDayOfWeek,
  getIsoWeekFromAbsoluteDay,
} from "../core/iso-week.js";
import { ChroneraError } from "../errors/errors.js";

import type { CalendarRegistry } from "../calendar/registry.js";
import type {
  CalendarDate,
  FormatDateInput,
  LocalDateTime,
  PatternFormatOptions,
} from "../public-types.js";

export function formatWithPatternWithRegistry(
  registry: CalendarRegistry,
  input: FormatDateInput | LocalDateTime,
  pattern: string,
  options: Readonly<PatternFormatOptions> = {},
): string {
  const tokens = scanPattern(pattern);
  const localeInfo = validateAndResolveLocale(options.locale);
  const locale = localeInfo.baseLocale;
  const numberingSystem = options.numberingSystem ?? "latn";

  // Check if input is LocalDateTime
  let isLocalDateTime = false;
  let localDt: LocalDateTime | undefined;
  if ("kind" in input && input.kind === "local-date-time") {
    isLocalDateTime = true;
    localDt = input;
  }

  let calDate: CalendarDate;
  let absDay: number;
  let hour = 0;
  let minute = 0;
  let second = 0;
  let millisecond = 0;
  let offsetString = "Z";

  if (isLocalDateTime && localDt) {
    calDate = {
      kind: "calendar-date",
      calendar: "gregory",
      year: localDt.date.year,
      monthCode: `M${String(localDt.date.month).padStart(2, "0")}`,
      month: localDt.date.month,
      day: localDt.date.day,
      era: "CE",
      eraYear: localDt.date.year,
    };
    absDay = absoluteDayFromGregorianFields(
      localDt.date.year,
      localDt.date.month,
      localDt.date.day,
    );
    hour = localDt.time.hour;
    minute = localDt.time.minute;
    second = localDt.time.second;
    millisecond = localDt.time.millisecond;
  } else {
    const resolved = resolveDateFormattingInput(
      registry,
      input as FormatDateInput,
      options,
    );
    calDate = resolved.calendarDate;
    absDay = resolved.absoluteDay;

    if (resolved.instant) {
      const date = new Date(resolved.instant.epochMilliseconds);
      const tz = resolved.timeZone ?? "UTC";

      // Project fields using Intl
      const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hourCycle: "h23",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZoneName: "longOffset",
      });

      const parts = dtf.formatToParts(date);
      for (const p of parts) {
        if (p.type === "hour") hour = Number.parseInt(p.value, 10);
        if (p.type === "minute") minute = Number.parseInt(p.value, 10);
        if (p.type === "second") second = Number.parseInt(p.value, 10);
        if (p.type === "timeZoneName") {
          // e.g. "GMT+07:00" -> "+07:00"
          const m = p.value.match(/GMT([+-]\d{2}:\d{2})/);
          if (m && m[1]) {
            offsetString = m[1];
          } else if (p.value === "GMT") {
            offsetString = "Z";
          }
        }
      }
      millisecond = ((resolved.instant.epochMilliseconds % 1000) + 1000) % 1000;
    }
  }

  const month =
    calDate.month ?? Number.parseInt(calDate.monthCode.slice(1), 10);
  const year = calDate.eraYear ?? calDate.year;

  // Helper for localized text
  const localizedDate = new Date(
    Date.UTC(calDate.year, month - 1, calDate.day),
  );

  let out = "";
  for (const t of tokens) {
    if (t.type === "literal") {
      out += t.value;
      continue;
    }

    switch (t.symbol) {
      case "y":
        out += formatNumberWithSystem(year, numberingSystem);
        break;
      case "yy":
        out += formatNumberWithSystem(
          String(year % 100).padStart(2, "0"),
          numberingSystem,
        );
        break;
      case "yyyy":
        out += formatNumberWithSystem(
          String(year).padStart(4, "0"),
          numberingSystem,
        );
        break;
      case "M":
        out += formatNumberWithSystem(month, numberingSystem);
        break;
      case "MM":
        out += formatNumberWithSystem(
          String(month).padStart(2, "0"),
          numberingSystem,
        );
        break;
      case "MMM": {
        const dtf = new Intl.DateTimeFormat(locale, {
          calendar: calDate.calendar,
          month: "short",
          timeZone: "UTC",
        });
        out += dtf.format(localizedDate);
        break;
      }
      case "MMMM": {
        const dtf = new Intl.DateTimeFormat(locale, {
          calendar: calDate.calendar,
          month: "long",
          timeZone: "UTC",
        });
        out += dtf.format(localizedDate);
        break;
      }
      case "d":
        out += formatNumberWithSystem(calDate.day, numberingSystem);
        break;
      case "dd":
        out += formatNumberWithSystem(
          String(calDate.day).padStart(2, "0"),
          numberingSystem,
        );
        break;
      case "E": {
        const dtf = new Intl.DateTimeFormat(locale, {
          calendar: calDate.calendar,
          weekday: "short",
          timeZone: "UTC",
        });
        out += dtf.format(localizedDate);
        break;
      }
      case "EEEE": {
        const dtf = new Intl.DateTimeFormat(locale, {
          calendar: calDate.calendar,
          weekday: "long",
          timeZone: "UTC",
        });
        out += dtf.format(localizedDate);
        break;
      }
      case "G":
        out += calDate.era ?? (year >= 0 ? "AD" : "BC");
        break;
      case "GGGG": {
        const dtf = new Intl.DateTimeFormat(locale, {
          calendar: calDate.calendar,
          era: "long",
          timeZone: "UTC",
        });
        out += dtf.format(localizedDate);
        break;
      }
      case "H":
        out += formatNumberWithSystem(hour, numberingSystem);
        break;
      case "HH":
        out += formatNumberWithSystem(
          String(hour).padStart(2, "0"),
          numberingSystem,
        );
        break;
      case "h": {
        const h12 = hour % 12 === 0 ? 12 : hour % 12;
        out += formatNumberWithSystem(h12, numberingSystem);
        break;
      }
      case "hh": {
        const h12 = hour % 12 === 0 ? 12 : hour % 12;
        out += formatNumberWithSystem(
          String(h12).padStart(2, "0"),
          numberingSystem,
        );
        break;
      }
      case "a":
        out += hour < 12 ? "AM" : "PM";
        break;
      case "m":
        out += formatNumberWithSystem(minute, numberingSystem);
        break;
      case "mm":
        out += formatNumberWithSystem(
          String(minute).padStart(2, "0"),
          numberingSystem,
        );
        break;
      case "s":
        out += formatNumberWithSystem(second, numberingSystem);
        break;
      case "ss":
        out += formatNumberWithSystem(
          String(second).padStart(2, "0"),
          numberingSystem,
        );
        break;
      case "S": {
        const frac1 = Math.floor(millisecond / 100);
        out += formatNumberWithSystem(frac1, numberingSystem);
        break;
      }
      case "SSS":
        out += formatNumberWithSystem(
          String(millisecond).padStart(3, "0"),
          numberingSystem,
        );
        break;
      case "XXX":
        out += offsetString === "+00:00" ? "Z" : offsetString;
        break;
      case "Q": {
        const qNum = Math.floor((month - 1) / 3) + 1;
        out += formatNumberWithSystem(qNum, numberingSystem);
        break;
      }
      case "QQQ": {
        const qNum = Math.floor((month - 1) / 3) + 1;
        out += `Q${formatNumberWithSystem(qNum, numberingSystem)}`;
        break;
      }
      case "QQQQ": {
        const qIndex = Math.floor((month - 1) / 3);
        const qNames = [
          "1st quarter",
          "2nd quarter",
          "3rd quarter",
          "4th quarter",
        ];
        out += qNames[qIndex]!;
        break;
      }
      case "D": {
        const doy = getDayOfYearFromAbsoluteDay(absDay).dayOfYear;
        out += formatNumberWithSystem(doy, numberingSystem);
        break;
      }
      case "DDD": {
        const doy = getDayOfYearFromAbsoluteDay(absDay).dayOfYear;
        out += formatNumberWithSystem(
          String(doy).padStart(3, "0"),
          numberingSystem,
        );
        break;
      }
      case "w": {
        const wn = getIsoWeekFromAbsoluteDay(absDay).weekNumber;
        out += formatNumberWithSystem(wn, numberingSystem);
        break;
      }
      case "ww": {
        const wn = getIsoWeekFromAbsoluteDay(absDay).weekNumber;
        out += formatNumberWithSystem(
          String(wn).padStart(2, "0"),
          numberingSystem,
        );
        break;
      }
      case "e": {
        const dow = getIsoDayOfWeek(absDay);
        out += formatNumberWithSystem(dow, numberingSystem);
        break;
      }
      case "ee": {
        const dow = getIsoDayOfWeek(absDay);
        out += formatNumberWithSystem(
          String(dow).padStart(2, "0"),
          numberingSystem,
        );
        break;
      }
      default:
        throw new ChroneraError(
          "CHRONERA_PATTERN_TOO_COMPLEX",
          `Unhandled pattern symbol: ${t.symbol}`,
        );
    }
  }

  return out;
}

export function formatWithPattern(
  input: FormatDateInput | LocalDateTime,
  pattern: string,
  options?: Readonly<PatternFormatOptions>,
): string {
  return formatWithPatternWithRegistry(
    defaultCalendarRegistry,
    input,
    pattern,
    options,
  );
}
