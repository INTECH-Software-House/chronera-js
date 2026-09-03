import {
  findJapaneseEraForAbsoluteDay,
  resolveJapaneseEra,
} from "../../calendar/japanese/index.js";
import { formatNumberWithSystem } from "../../locale/numbering-system.js";

import type { CalendarDate, NumberingSystemId } from "../../public-types.js";

export interface WorldPresetOptions {
  readonly numberingSystem?: NumberingSystemId;
}

// English
const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const EN_WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

// German (DIN 5008)
const DE_MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
] as const;

const DE_WEEKDAYS = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
] as const;

// French (AFNOR)
const FR_MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

const FR_WEEKDAYS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
] as const;

// Spanish (RAE)
const ES_MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

const ES_WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
] as const;

// Chinese (GB/T 7408)
const ZH_WEEKDAYS = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
] as const;

// Arabic
const AR_GREGORIAN_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

export const AR_WEEKDAYS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

const THAI_SHORT_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
] as const;

function getDowIndex(absoluteDay: number): number {
  // 1970-01-01 was Thursday (index 4 in [Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6])
  return (((absoluteDay + 4) % 7) + 7) % 7;
}

function pad2(n: number, numberingSystem: NumberingSystemId): string {
  const str = String(n).padStart(2, "0");
  if (numberingSystem === "latn") return str;
  return formatNumberWithSystem(Number(str), numberingSystem);
}

// --- US English ---
export function formatUsStandardPreset(
  date: CalendarDate,
  _absDay: number,
  options: WorldPresetOptions = {},
): string {
  const ns = options.numberingSystem ?? "latn";
  const m = pad2(date.month ?? 1, ns);
  const d = pad2(date.day, ns);
  const y = formatNumberWithSystem(date.year, ns);
  return `${m}/${d}/${y}`;
}

export function formatUsLongPreset(
  date: CalendarDate,
  _absDay: number,
  options: WorldPresetOptions = {},
): string {
  const ns = options.numberingSystem ?? "latn";
  const monthName = EN_MONTHS[(date.month ?? 1) - 1]!;
  const dayStr = formatNumberWithSystem(date.day, ns);
  const yearStr = formatNumberWithSystem(date.year, ns);
  return `${monthName} ${dayStr}, ${yearStr}`;
}

export function formatUsWithWeekdayPreset(
  date: CalendarDate,
  absDay: number,
  options: WorldPresetOptions = {},
): string {
  const weekday = EN_WEEKDAYS[getDowIndex(absDay)]!;
  const base = formatUsLongPreset(date, absDay, options);
  return `${weekday}, ${base}`;
}

// --- UK English ---
export function formatUkStandardPreset(
  date: CalendarDate,
  _absDay: number,
  options: WorldPresetOptions = {},
): string {
  const ns = options.numberingSystem ?? "latn";
  const d = pad2(date.day, ns);
  const m = pad2(date.month ?? 1, ns);
  const y = formatNumberWithSystem(date.year, ns);
  return `${d}/${m}/${y}`;
}

export function formatUkLongPreset(
  date: CalendarDate,
  _absDay: number,
  options: WorldPresetOptions = {},
): string {
  const ns = options.numberingSystem ?? "latn";
  const dayStr = formatNumberWithSystem(date.day, ns);
  const monthName = EN_MONTHS[(date.month ?? 1) - 1]!;
  const yearStr = formatNumberWithSystem(date.year, ns);
  return `${dayStr} ${monthName} ${yearStr}`;
}

export function formatUkWithWeekdayPreset(
  date: CalendarDate,
  absDay: number,
  options: WorldPresetOptions = {},
): string {
  const weekday = EN_WEEKDAYS[getDowIndex(absDay)]!;
  const base = formatUkLongPreset(date, absDay, options);
  return `${weekday}, ${base}`;
}

// --- German (DIN 5008) ---
export function formatGermanDinStandardPreset(
  date: CalendarDate,
  _absDay: number,
  options: WorldPresetOptions = {},
): string {
  const ns = options.numberingSystem ?? "latn";
  const d = pad2(date.day, ns);
  const m = pad2(date.month ?? 1, ns);
  const y = formatNumberWithSystem(date.year, ns);
  return `${d}.${m}.${y}`;
}

export function formatGermanLongPreset(
  date: CalendarDate,
  _absDay: number,
  options: WorldPresetOptions = {},
): string {
  const ns = options.numberingSystem ?? "latn";
  const dayStr = formatNumberWithSystem(date.day, ns);
  const monthName = DE_MONTHS[(date.month ?? 1) - 1]!;
  const yearStr = formatNumberWithSystem(date.year, ns);
  return `${dayStr}. ${monthName} ${yearStr}`;
}

export function formatGermanWithWeekdayPreset(
  date: CalendarDate,
  absDay: number,
  options: WorldPresetOptions = {},
): string {
  const weekday = DE_WEEKDAYS[getDowIndex(absDay)]!;
  const base = formatGermanLongPreset(date, absDay, options);
  return `${weekday}, ${base}`;
}

// --- French (AFNOR) ---
export function formatFrenchStandardPreset(
  date: CalendarDate,
  _absDay: number,
  options: WorldPresetOptions = {},
): string {
  const ns = options.numberingSystem ?? "latn";
  const d = pad2(date.day, ns);
  const m = pad2(date.month ?? 1, ns);
  const y = formatNumberWithSystem(date.year, ns);
  return `${d}/${m}/${y}`;
}

export function formatFrenchLongPreset(
  date: CalendarDate,
  _absDay: number,
  options: WorldPresetOptions = {},
): string {
  const ns = options.numberingSystem ?? "latn";
  const dayStr = formatNumberWithSystem(date.day, ns);
  const monthName = FR_MONTHS[(date.month ?? 1) - 1]!;
  const yearStr = formatNumberWithSystem(date.year, ns);
  return `${dayStr} ${monthName} ${yearStr}`;
}

export function formatFrenchWithWeekdayPreset(
  date: CalendarDate,
  absDay: number,
  options: WorldPresetOptions = {},
): string {
  const weekday = FR_WEEKDAYS[getDowIndex(absDay)]!;
  const base = formatFrenchLongPreset(date, absDay, options);
  return `${weekday} ${base}`;
}

// --- Spanish (RAE) ---
export function formatSpanishStandardPreset(
  date: CalendarDate,
  _absDay: number,
  options: WorldPresetOptions = {},
): string {
  const ns = options.numberingSystem ?? "latn";
  const d = pad2(date.day, ns);
  const m = pad2(date.month ?? 1, ns);
  const y = formatNumberWithSystem(date.year, ns);
  return `${d}/${m}/${y}`;
}

export function formatSpanishLongPreset(
  date: CalendarDate,
  _absDay: number,
  options: WorldPresetOptions = {},
): string {
  const ns = options.numberingSystem ?? "latn";
  const dayStr = formatNumberWithSystem(date.day, ns);
  const monthName = ES_MONTHS[(date.month ?? 1) - 1]!;
  const yearStr = formatNumberWithSystem(date.year, ns);
  return `${dayStr} de ${monthName} de ${yearStr}`;
}

export function formatSpanishWithWeekdayPreset(
  date: CalendarDate,
  absDay: number,
  options: WorldPresetOptions = {},
): string {
  const weekday = ES_WEEKDAYS[getDowIndex(absDay)]!;
  const base = formatSpanishLongPreset(date, absDay, options);
  return `${weekday}, ${base}`;
}

// --- Chinese (GB/T 7408) ---
export function formatChineseStandardPreset(
  date: CalendarDate,
  _absDay: number,
  options: WorldPresetOptions = {},
): string {
  const ns = options.numberingSystem ?? "latn";
  const y = formatNumberWithSystem(date.year, ns);
  const m = formatNumberWithSystem(date.month ?? 1, ns);
  const d = formatNumberWithSystem(date.day, ns);
  return `${y}年${m}月${d}日`;
}

export function formatChineseWithWeekdayPreset(
  date: CalendarDate,
  absDay: number,
  options: WorldPresetOptions = {},
): string {
  const base = formatChineseStandardPreset(date, absDay, options);
  const weekday = ZH_WEEKDAYS[getDowIndex(absDay)]!;
  return `${base} ${weekday}`;
}

export function formatChineseShortPreset(
  date: CalendarDate,
  _absDay: number,
  options: WorldPresetOptions = {},
): string {
  const ns = options.numberingSystem ?? "latn";
  const y = formatNumberWithSystem(date.year, ns);
  const m = pad2(date.month ?? 1, ns);
  const d = pad2(date.day, ns);
  return `${y}/${m}/${d}`;
}

// --- Arabic ---
export function formatArabicGregorianPreset(
  date: CalendarDate,
  _absDay: number,
  options: WorldPresetOptions = {},
): string {
  const ns = options.numberingSystem ?? "arab";
  const d = formatNumberWithSystem(date.day, ns);
  const m = AR_GREGORIAN_MONTHS[(date.month ?? 1) - 1]!;
  const y = formatNumberWithSystem(date.year, ns);
  return `${d} ${m} ${y} م`;
}

export function formatArabicHijriPreset(
  date: CalendarDate,
  _absDay: number,
  options: WorldPresetOptions = {},
): string {
  const ns = options.numberingSystem ?? "arab";
  const d = formatNumberWithSystem(date.day, ns);
  const m = formatNumberWithSystem(date.month ?? 1, ns);
  const y = formatNumberWithSystem(date.year, ns);
  return `${d}/${m}/${y} هـ`;
}

// --- Japanese Extensions ---
export function formatJapaneseSeirekiPreset(
  date: CalendarDate,
  _absDay: number,
  options: WorldPresetOptions = {},
): string {
  const ns = options.numberingSystem ?? "latn";
  const y = formatNumberWithSystem(date.year, ns);
  const m = formatNumberWithSystem(date.month ?? 1, ns);
  const d = formatNumberWithSystem(date.day, ns);
  return `${y}年${m}月${d}日`;
}

export function formatJapaneseEraShortPreset(
  date: CalendarDate,
  absDay: number,
  _options: WorldPresetOptions = {},
): string {
  const isJap = date.calendar === "japanese";
  const eraDef =
    (isJap ? resolveJapaneseEra(date.era) : undefined) ??
    findJapaneseEraForAbsoluteDay(absDay);
  const eraYear =
    isJap && date.eraYear !== undefined
      ? date.eraYear
      : date.year - eraDef.offset;

  const letter = eraDef.romaji.charAt(0).toUpperCase();
  const y = String(eraYear).padStart(2, "0");
  const m = String(date.month ?? 1).padStart(2, "0");
  const d = String(date.day).padStart(2, "0");
  return `${letter}${y}.${m}.${d}`;
}

// --- Thai Extensions ---
export function formatThaiShortDatePreset(
  date: CalendarDate,
  _absDay: number,
  options: WorldPresetOptions = {},
): string {
  const ns = options.numberingSystem ?? "latn";
  const beYear = date.calendar === "buddhist" ? date.year : date.year + 543;
  const d = formatNumberWithSystem(date.day, ns);
  const m = THAI_SHORT_MONTHS[(date.month ?? 1) - 1]!;
  const y = formatNumberWithSystem(beYear, ns);
  return `${d} ${m} ${y}`;
}

export function formatThaiSlashDatePreset(
  date: CalendarDate,
  _absDay: number,
  options: WorldPresetOptions = {},
): string {
  const ns = options.numberingSystem ?? "latn";
  const beYear = date.calendar === "buddhist" ? date.year : date.year + 543;
  const d = pad2(date.day, ns);
  const m = pad2(date.month ?? 1, ns);
  const y = formatNumberWithSystem(beYear, ns);
  return `${d}/${m}/${y}`;
}
