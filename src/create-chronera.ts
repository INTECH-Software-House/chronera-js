import { ChroneraEngine } from "./internal/engine.js";
import { formatDateWithRegistry } from "./format/format-date.js";
import { parseLocalDate } from "./parse/parse-local-date.js";
import { convertCalendarDateWithRegistry } from "./operations/convert-calendar-date.js";

import type {
  CalendarDate,
  CalendarId,
  ChroneraConfig,
  ChroneraInstance,
  ConvertCalendarOptions,
  FormatDateInput,
  FormatDateOptions,
  LocalDate,
  ParseLocalDateOptions,
  ResolvedChroneraOptions,
} from "./public-types.js";

export function createChronera(
  config?: Readonly<ChroneraConfig>,
): ChroneraInstance {
  const engine = new ChroneraEngine(config);

  const defaultLocale = config?.locale ?? "en-US";
  const defaultCalendar = config?.calendar ?? "gregory";
  const defaultTimeZone = config?.timeZone ?? "UTC";
  const defaultNumberingSystem = config?.numberingSystem;
  const formatterCacheSize = config?.formatterCacheSize ?? 64;

  return {
    formatDate(
      input: FormatDateInput,
      options?: Readonly<FormatDateOptions>,
    ): string {
      const isDateOnly =
        "kind" in input &&
        (input.kind === "local-date" || input.kind === "calendar-date");

      const base = {
        locale: options?.locale ?? defaultLocale,
        calendar: options?.calendar ?? defaultCalendar,
        ...(options?.numberingSystem !== undefined
          ? { numberingSystem: options.numberingSystem }
          : defaultNumberingSystem !== undefined
            ? { numberingSystem: defaultNumberingSystem }
            : {}),
        ...(options?.timeZone !== undefined
          ? { timeZone: options.timeZone }
          : !isDateOnly
            ? { timeZone: defaultTimeZone }
            : {}),
      };

      const mergedOptions: FormatDateOptions =
        options && "preset" in options && options.preset !== undefined
          ? { ...base, preset: options.preset }
          : {
              ...base,
              ...(options && "style" in options && options.style !== undefined
                ? { style: options.style }
                : {}),
            };

      return formatDateWithRegistry(engine.registry, input, mergedOptions);
    },

    parseLocalDate(
      input: string,
      options?: Readonly<ParseLocalDateOptions>,
    ): LocalDate {
      return parseLocalDate(input, options);
    },

    convertCalendarDate(
      source: CalendarDate,
      targetCalendar: CalendarId,
      options?: Readonly<ConvertCalendarOptions>,
    ): ReturnType<typeof convertCalendarDateWithRegistry> {
      return convertCalendarDateWithRegistry(
        engine.registry,
        source,
        targetCalendar,
        options,
      );
    },

    resolvedOptions(): ResolvedChroneraOptions {
      return {
        locale: defaultLocale,
        calendar: defaultCalendar,
        ...(defaultNumberingSystem !== undefined
          ? { numberingSystem: defaultNumberingSystem }
          : {}),
        timeZone: defaultTimeZone,
        formatterCacheSize,
      };
    },
  };
}
