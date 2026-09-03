import { formatNumberWithSystem } from "../../locale/numbering-system.js";
import { ChroneraError } from "../../errors/errors.js";

import type { CalendarDate, NumberingSystemId } from "../../public-types.js";

const THAI_MONTH_NAMES: readonly string[] = [
  "",
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

// Day 0 is 1970-01-01 (Thursday)
const THAI_WEEKDAY_NAMES_FROM_MOD7: readonly string[] = [
  "วันพฤหัสบดี", // 0
  "วันศุกร์", // 1
  "วันเสาร์", // 2
  "วันอาทิตย์", // 3
  "วันจันทร์", // 4
  "วันอังคาร", // 5
  "วันพุธ", // 6
];

export function formatThaiOfficialPreset(
  date: CalendarDate,
  preset: "thai-official-date" | "thai-official-date-with-weekday",
  absoluteDay: number,
  numberingSystem: NumberingSystemId = "latn",
): string {
  // Calendar must be buddhist or be convertible
  const beYear = date.calendar === "buddhist" ? date.year : date.year + 543;
  const month = date.month ?? Number.parseInt(date.monthCode.slice(1), 10);

  const monthName = THAI_MONTH_NAMES[month];
  if (!monthName) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Invalid month ${month} for Thai official date formatting.`,
    );
  }

  const dayStr = formatNumberWithSystem(date.day, numberingSystem);
  const yearStr = formatNumberWithSystem(beYear, numberingSystem);

  if (preset === "thai-official-date") {
    return `วันที่ ${dayStr} ${monthName} พ.ศ. ${yearStr}`;
  }

  const mod7 = ((absoluteDay % 7) + 7) % 7;
  const weekdayName = THAI_WEEKDAY_NAMES_FROM_MOD7[mod7]!;
  return `${weekdayName}ที่ ${dayStr} ${monthName} พ.ศ. ${yearStr}`;
}
