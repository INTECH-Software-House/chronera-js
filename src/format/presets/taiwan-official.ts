import {
  ROC_OFFSET,
  TAIWAN_WEEKDAY_NAMES,
  TAIWAN_WEEKDAY_SHORT,
} from "../../calendar/roc/index.js";
import { formatNumberWithSystem } from "../../locale/numbering-system.js";

import type { CalendarDate, NumberingSystemId } from "../../public-types.js";

export interface TaiwanFormatOptions {
  readonly numberingSystem?: NumberingSystemId;
  readonly weekday?: "none" | "short" | "full"; // Default "none"
}

export function formatTaiwanOfficialPreset(
  date: CalendarDate,
  absoluteDay: number,
  options: TaiwanFormatOptions = {},
): string {
  const numberingSystem = options.numberingSystem ?? "latn";
  const weekdayMode = options.weekday ?? "none";

  // Calculate ROC year
  const rocYear = date.calendar === "roc" ? date.year : date.year - ROC_OFFSET;
  const monthNum = date.month ?? 1;
  const dayNum = date.day;

  const yearPart = `${formatNumberWithSystem(rocYear, numberingSystem)}年`;
  const monthPart = `${formatNumberWithSystem(monthNum, numberingSystem)}月`;
  const dayPart = `${formatNumberWithSystem(dayNum, numberingSystem)}日`;

  const base = `民國${yearPart}${monthPart}${dayPart}`;

  if (weekdayMode === "none") {
    return base;
  }

  const dowIndex = (((absoluteDay + 4) % 7) + 7) % 7;
  if (weekdayMode === "full") {
    return `${base} ${TAIWAN_WEEKDAY_NAMES[dowIndex]}`;
  }
  return `${base}（${TAIWAN_WEEKDAY_SHORT[dowIndex]}）`;
}
