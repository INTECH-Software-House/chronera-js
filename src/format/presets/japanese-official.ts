import {
  findJapaneseEraForAbsoluteDay,
  JAPANESE_WEEKDAY_SHORT,
  resolveJapaneseEra,
} from "../../calendar/japanese/index.js";
import { formatNumberWithSystem } from "../../locale/numbering-system.js";

import type { CalendarDate, NumberingSystemId } from "../../public-types.js";

export interface JapaneseFormatOptions {
  readonly numberingSystem?: NumberingSystemId;
  readonly gannen?: boolean; // Default true: eraYear 1 -> 元年
  readonly fullWeekday?: boolean; // Default false: （水）, true: 水曜日
}

export function formatJapaneseOfficialPreset(
  date: CalendarDate,
  absoluteDay: number,
  options: JapaneseFormatOptions = {},
): string {
  const numberingSystem = options.numberingSystem ?? "latn";
  const useGannen = options.gannen ?? true;

  // Resolve era definition and eraYear
  const isJapaneseCalendar = date.calendar === "japanese";
  const eraDef =
    (isJapaneseCalendar ? resolveJapaneseEra(date.era) : undefined) ??
    findJapaneseEraForAbsoluteDay(absoluteDay);
  const eraYear =
    isJapaneseCalendar && date.eraYear !== undefined
      ? date.eraYear
      : date.year - eraDef.offset;
  const kanjiEra = eraDef.kanji;

  const monthNum = date.month ?? 1;
  const dayNum = date.day;

  // Year representation: "元年" if eraYear === 1 and useGannen is true
  let yearPart: string;
  if (eraYear === 1 && useGannen) {
    yearPart = "元年";
  } else {
    yearPart = `${formatNumberWithSystem(eraYear, numberingSystem)}年`;
  }

  const monthPart = `${formatNumberWithSystem(monthNum, numberingSystem)}月`;
  const dayPart = `${formatNumberWithSystem(dayNum, numberingSystem)}日`;

  return `${kanjiEra}${yearPart}${monthPart}${dayPart}`;
}

export function formatJapaneseOfficialWithWeekdayPreset(
  date: CalendarDate,
  absoluteDay: number,
  options: JapaneseFormatOptions = {},
): string {
  const base = formatJapaneseOfficialPreset(date, absoluteDay, options);
  // Day of week from absolute day: (absoluteDay + 4) % 7
  // 1970-01-01 was Thursday (4). (0 + 4) % 7 = 4 -> 木 (Thursday)
  const dowIndex = (((absoluteDay + 4) % 7) + 7) % 7;
  const weekdayShort = JAPANESE_WEEKDAY_SHORT[dowIndex];

  if (options.fullWeekday) {
    return `${base} ${weekdayShort}曜日`;
  }
  return `${base}（${weekdayShort}）`;
}
