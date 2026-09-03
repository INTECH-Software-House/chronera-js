import { resolveDateFormattingInput } from "./resolve-date-input.js";
import { formatThaiOfficialPreset } from "./presets/thai-official.js";
import {
  formatJapaneseOfficialPreset,
  formatJapaneseOfficialWithWeekdayPreset,
} from "./presets/japanese-official.js";
import { formatTaiwanOfficialPreset } from "./presets/taiwan-official.js";
import {
  formatArabicGregorianPreset,
  formatArabicHijriPreset,
  formatChineseShortPreset,
  formatChineseStandardPreset,
  formatChineseWithWeekdayPreset,
  formatFrenchLongPreset,
  formatFrenchStandardPreset,
  formatFrenchWithWeekdayPreset,
  formatGermanDinStandardPreset,
  formatGermanLongPreset,
  formatGermanWithWeekdayPreset,
  formatJapaneseEraShortPreset,
  formatJapaneseSeirekiPreset,
  formatSpanishLongPreset,
  formatSpanishStandardPreset,
  formatSpanishWithWeekdayPreset,
  formatThaiShortDatePreset,
  formatThaiSlashDatePreset,
  formatUkLongPreset,
  formatUkStandardPreset,
  formatUkWithWeekdayPreset,
  formatUsLongPreset,
  formatUsStandardPreset,
  formatUsWithWeekdayPreset,
} from "./presets/world-locales.js";
import { defaultCalendarRegistry } from "../calendar/registry.js";
import { validateAndResolveLocale } from "../locale/resolve-locale.js";
import { formatNumberWithSystem } from "../locale/numbering-system.js";
import { gregorianFieldsFromAbsoluteDay } from "../core/absolute-day.js";

import type { CalendarRegistry } from "../calendar/registry.js";
import type { FormatDateInput, FormatDateOptions } from "../public-types.js";

export function formatDateWithRegistry(
  registry: CalendarRegistry,
  input: FormatDateInput,
  options: Readonly<FormatDateOptions> = {},
): string {
  const resolved = resolveDateFormattingInput(registry, input, options);
  const localeInfo = validateAndResolveLocale(options.locale);
  const locale = localeInfo.baseLocale;
  const numberingSystem =
    options.numberingSystem ?? localeInfo.unicodeNumberingSystem;

  if (options.preset !== undefined) {
    const presetOpt = numberingSystem !== undefined ? { numberingSystem } : {};
    switch (options.preset) {
      case "thai-official-date":
      case "thai-official-date-with-weekday":
        return formatThaiOfficialPreset(
          resolved.calendarDate,
          options.preset,
          resolved.absoluteDay,
          numberingSystem ?? "latn",
        );
      case "thai-short-date":
        return formatThaiShortDatePreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "thai-slash-date":
        return formatThaiSlashDatePreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "japanese-official":
        return formatJapaneseOfficialPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "japanese-official-with-weekday":
        return formatJapaneseOfficialWithWeekdayPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "japanese-seireki":
        return formatJapaneseSeirekiPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "japanese-era-short":
        return formatJapaneseEraShortPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "taiwan-official":
        return formatTaiwanOfficialPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "us-standard":
        return formatUsStandardPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "us-long":
        return formatUsLongPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "us-with-weekday":
        return formatUsWithWeekdayPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "uk-standard":
        return formatUkStandardPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "uk-long":
        return formatUkLongPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "uk-with-weekday":
        return formatUkWithWeekdayPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "german-din-standard":
        return formatGermanDinStandardPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "german-long":
        return formatGermanLongPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "german-with-weekday":
        return formatGermanWithWeekdayPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "french-standard":
        return formatFrenchStandardPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "french-long":
        return formatFrenchLongPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "french-with-weekday":
        return formatFrenchWithWeekdayPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "chinese-standard":
        return formatChineseStandardPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "chinese-with-weekday":
        return formatChineseWithWeekdayPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "chinese-short":
        return formatChineseShortPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "spanish-standard":
        return formatSpanishStandardPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "spanish-long":
        return formatSpanishLongPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "spanish-with-weekday":
        return formatSpanishWithWeekdayPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "arabic-gregorian":
        return formatArabicGregorianPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
      case "arabic-hijri":
        return formatArabicHijriPreset(
          resolved.calendarDate,
          resolved.absoluteDay,
          presetOpt,
        );
    }
  }

  const style = options.style ?? "medium";
  const calId = resolved.calendarDate.calendar;

  // Use UTC instant for the Gregorian equivalent day
  const fields = gregorianFieldsFromAbsoluteDay(resolved.absoluteDay);
  const utcDate = new Date(
    Date.UTC(fields.year, fields.month - 1, fields.day, 12, 0, 0),
  );

  const formatterOptions: Intl.DateTimeFormatOptions = {
    timeZone: "UTC",
    ...(style === "numeric"
      ? { year: "numeric", month: "numeric", day: "numeric" }
      : { dateStyle: style }),
  };

  if (calId !== "gregory" && calId !== "iso8601") {
    formatterOptions.calendar = calId;
  }

  if (numberingSystem) {
    formatterOptions.numberingSystem = numberingSystem;
  }

  const formatted = new Intl.DateTimeFormat(locale, formatterOptions).format(
    utcDate,
  );

  if (numberingSystem && numberingSystem !== "latn") {
    return formatNumberWithSystem(formatted, numberingSystem);
  }

  return formatted;
}

export function formatDate(
  input: FormatDateInput,
  options: Readonly<FormatDateOptions> = {},
): string {
  return formatDateWithRegistry(defaultCalendarRegistry, input, options);
}
