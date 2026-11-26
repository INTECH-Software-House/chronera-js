import { localDate } from "../core/local-date.js";
import { toJulianDayNumber } from "./julian-day.js";
import { resolveThaiLocalDate, type ThaiDateInput } from "./thai-fiscal.js";

import type { LocalDate } from "../public-types.js";

export interface ThaiLunarDate {
  /** true = ข้างขึ้น (Waxing), false = ข้างแรม (Waning) */
  readonly isWaxing: boolean;
  /** ค่ำ (1 - 15) */
  readonly phaseDay: number;
  /** เดือนทางจันทรคติไทย (1 - 12, โดย เดือน 8 หลัง จะมี isLeapMonth: true) */
  readonly lunarMonth: number;
  /** เป็นเดือน 8 หลัง ในปีอธิกมาส (เดือน 8 สองหน) หรือไม่ */
  readonly isLeapMonth: boolean;
  /** ปีอธิกมาส (ปีที่มีเดือน 8 สองหน — 384 วัน) หรือไม่ */
  readonly isLeapMonthYear: boolean;
  /** ปีอธิกวาร (เดือน 7 มีแรม 15 ค่ำ — 355 วัน) หรือไม่ */
  readonly isExtraDayYear: boolean;
  /** ตรงกับวันพระหรือไม่ (ขึ้น 8, ขึ้น 15, แรม 8, แรม 14 หรือ แรม 15 ค่ำ) */
  readonly isWanPhra: boolean;
  /** คำอธิบายภาษาไทย เช่น "วันพระ (วันเพ็ญ ขึ้น ๑๕ ค่ำ)" */
  readonly wanPhraTitle?: string | undefined;
  /** อัตราส่วนความสว่างของดวงจันทร์ (0.0 ถึง 1.0) */
  readonly illumination: number;
  /** ระยะของดวงจันทร์ */
  readonly moonPhase:
    | "new-moon"
    | "waxing-crescent"
    | "first-quarter"
    | "waxing-gibbous"
    | "full-moon"
    | "waning-gibbous"
    | "last-quarter"
    | "waning-crescent";
}

const SYNODIC_MONTH = 29.53058868;
// Reference epoch: 2000-01-06 18:14 UTC (New Moon, JDN 2451550.26)
const REFERENCE_NEW_MOON_JDN = 2451550.26;

// Anchored at BE 2563 (CE 2019/2020) เดือนอ้าย ขึ้น 1 ค่ำ (2019-11-27, JDN 2458815)
const ANCHOR_CE_YEAR = 2020;
const ANCHOR_MONTH1_DAY1_JDN = 2458815;

// 19-year Suriyayatra Adhikamasa remainders mod 19 on Chulasakarat year (ce - 638)
const ADHIKAMASA_REMAINDERS = new Set([1, 4, 6, 9, 12, 15, 17]);

function isAdhikamasaYear(ceYear: number): boolean {
  const c = ceYear - 638;
  return ADHIKAMASA_REMAINDERS.has(((c % 19) + 19) % 19);
}

function rawAvoman(ceYear: number): number {
  const c = ceYear - 638;
  const h = Math.floor((292207 * c + 373) / 800) + 1;
  return (11 * h + 650) % 692;
}

function isAdhikavaraYear(ceYear: number): boolean {
  if (isAdhikamasaYear(ceYear)) return false;
  return (
    rawAvoman(ceYear) < 127 ||
    (isAdhikamasaYear(ceYear - 1) && rawAvoman(ceYear - 1) < 127)
  );
}

function getThaiLunarYearLength(ceYear: number): 354 | 355 | 384 {
  if (isAdhikamasaYear(ceYear)) return 384;
  return isAdhikavaraYear(ceYear) ? 355 : 354;
}

interface SuriyayatraLunarPosition {
  readonly lunarMonth: number;
  readonly isLeapMonth: boolean;
  readonly isLeapMonthYear: boolean;
  readonly isExtraDayYear: boolean;
  readonly monthLength: 29 | 30;
  readonly dayInMonth: number; // 1..30
}

function resolveSuriyayatraPosition(jdn: number): SuriyayatraLunarPosition {
  let year = ANCHOR_CE_YEAR;
  let yearStartJdn = ANCHOR_MONTH1_DAY1_JDN;

  if (jdn >= yearStartJdn) {
    while (jdn >= yearStartJdn + getThaiLunarYearLength(year)) {
      yearStartJdn += getThaiLunarYearLength(year);
      year++;
    }
  } else {
    while (jdn < yearStartJdn) {
      year--;
      yearStartJdn -= getThaiLunarYearLength(year);
    }
  }

  const isLeapMonthYear = isAdhikamasaYear(year);
  const isExtraDayYear = isAdhikavaraYear(year);
  let remaining = jdn - yearStartJdn;

  // Thai months 1..12: odd months = 29 days (except Month 7 = 30 in Adhikavara),
  // even months = 30 days (with Month 8 occurring twice in Adhikamasa).
  for (let m = 1; m <= 12; m++) {
    if (m === 8 && isLeapMonthYear) {
      // First 8th month (เดือน 8 แรก, 30 days)
      if (remaining < 30) {
        return {
          lunarMonth: 8,
          isLeapMonth: false,
          isLeapMonthYear,
          isExtraDayYear,
          monthLength: 30,
          dayInMonth: remaining + 1,
        };
      }
      remaining -= 30;
      // Second 8th month (เดือน 8 หลัง, 30 days)
      if (remaining < 30) {
        return {
          lunarMonth: 8,
          isLeapMonth: true,
          isLeapMonthYear,
          isExtraDayYear,
          monthLength: 30,
          dayInMonth: remaining + 1,
        };
      }
      remaining -= 30;
      continue;
    }

    const len: 29 | 30 = m % 2 === 0 || (m === 7 && isExtraDayYear) ? 30 : 29;
    if (remaining < len) {
      return {
        lunarMonth: m,
        isLeapMonth: false,
        isLeapMonthYear,
        isExtraDayYear,
        monthLength: len,
        dayInMonth: remaining + 1,
      };
    }
    remaining -= len;
  }

  return {
    lunarMonth: 12,
    isLeapMonth: false,
    isLeapMonthYear,
    isExtraDayYear,
    monthLength: 30,
    dayInMonth: 30,
  };
}

/**
 * Calculates Thai Buddhist Lunar Calendar (ปฏิทินจันทรคติไทย ตามหลักคัมภีร์สุริยยาตร์)
 * including true lunar month (`1..12`), `อธิกมาส` (`isLeapMonth` เดือน 8 สองหน), `อธิกวาร` (`เดือน 7 แรม 15 ค่ำ`),
 * waxing/waning phase (`ขึ้น/แรม 1–15 ค่ำ`), Wan Phra (`วันพระ`), and astronomical illumination.
 */
export function getThaiLunarDate(input: ThaiDateInput): ThaiLunarDate {
  const d = resolveThaiLocalDate(input);
  const jdn = toJulianDayNumber(d);
  const pos = resolveSuriyayatraPosition(jdn);

  const isWaxing = pos.dayInMonth <= 15;
  const phaseDay = isWaxing ? pos.dayInMonth : pos.dayInMonth - 15;
  const maxWaningDay = pos.monthLength === 29 ? 14 : 15;

  // Synodic astronomical phase for illumination & visual MoonPhase classification
  const daysSinceEpoch = jdn - REFERENCE_NEW_MOON_JDN;
  let phase = (daysSinceEpoch / SYNODIC_MONTH) % 1;
  if (phase < 0) phase += 1;

  const illumination =
    Math.round(0.5 * (1 - Math.cos(2 * Math.PI * phase)) * 100) / 100;

  let moonPhase: ThaiLunarDate["moonPhase"];
  if (phase < 0.03 || phase > 0.97) {
    moonPhase = "new-moon";
  } else if (phase < 0.22) {
    moonPhase = "waxing-crescent";
  } else if (phase < 0.28) {
    moonPhase = "first-quarter";
  } else if (phase < 0.47) {
    moonPhase = "waxing-gibbous";
  } else if (phase < 0.53) {
    moonPhase = "full-moon";
  } else if (phase < 0.72) {
    moonPhase = "waning-gibbous";
  } else if (phase < 0.78) {
    moonPhase = "last-quarter";
  } else {
    moonPhase = "waning-crescent";
  }

  // Wan Phra detection per exact Thai month length (แรม 14 ค่ำ in 29-day months, แรม 15 ค่ำ in 30-day months):
  let isWanPhra = false;
  let wanPhraTitle: string | undefined;

  if (isWaxing) {
    if (phaseDay === 8) {
      isWanPhra = true;
      wanPhraTitle = "วันพระ (ขึ้น ๘ ค่ำ)";
    } else if (phaseDay === 15) {
      isWanPhra = true;
      wanPhraTitle = "วันพระ (วันเพ็ญ ขึ้น ๑๕ ค่ำ)";
    }
  } else if (phaseDay === 8) {
    isWanPhra = true;
    wanPhraTitle = "วันพระ (แรม ๘ ค่ำ)";
  } else if (phaseDay === maxWaningDay) {
    isWanPhra = true;
    wanPhraTitle = `วันพระ (วันดับ แรม ${phaseDay === 14 ? "๑๔" : "๑๕"} ค่ำ)`;
  }

  return {
    isWaxing,
    phaseDay,
    lunarMonth: pos.lunarMonth,
    isLeapMonth: pos.isLeapMonth,
    isLeapMonthYear: pos.isLeapMonthYear,
    isExtraDayYear: pos.isExtraDayYear,
    isWanPhra,
    ...(wanPhraTitle !== undefined ? { wanPhraTitle } : {}),
    illumination,
    moonPhase,
  };
}

/**
 * Returns true if the specified date is a Buddhist Holy Day (วันพระ).
 */
export function isWanPhra(input: ThaiDateInput): boolean {
  return getThaiLunarDate(input).isWanPhra;
}

const THAI_DIGITS = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];

function toThaiNumerals(num: number): string {
  return num
    .toString()
    .split("")
    .map((c) => {
      const idx = Number(c);
      return Number.isNaN(idx) ? c : (THAI_DIGITS[idx] ?? c);
    })
    .join("");
}

/**
 * Formats Thai Lunar date into traditional phrase (e.g. "ขึ้น ๑๕ ค่ำ เดือน ๔" or "ขึ้น ๑๕ ค่ำ เดือน ๘ หลัง").
 */
export function formatThaiLunarDate(
  lunarDateOrInput: ThaiLunarDate | ThaiDateInput,
  options: { thaiDigits?: boolean } = {},
): string {
  const lunarDate: ThaiLunarDate =
    typeof lunarDateOrInput === "object" &&
    lunarDateOrInput !== null &&
    "phaseDay" in lunarDateOrInput &&
    "lunarMonth" in lunarDateOrInput
      ? lunarDateOrInput
      : getThaiLunarDate(lunarDateOrInput as ThaiDateInput);

  const useThaiDigits = options.thaiDigits ?? true;
  const dayStr = useThaiDigits
    ? toThaiNumerals(lunarDate.phaseDay)
    : lunarDate.phaseDay.toString();
  const monthStr = useThaiDigits
    ? toThaiNumerals(lunarDate.lunarMonth)
    : lunarDate.lunarMonth.toString();
  const side = lunarDate.isWaxing ? "ขึ้น" : "แรม";
  const leapSuffix = lunarDate.isLeapMonth ? " หลัง" : "";

  return `${side} ${dayStr} ค่ำ เดือน ${monthStr}${leapSuffix}`;
}

/**
 * Returns all Wan Phra (วันพระ) dates in a given Gregorian year and month.
 */
export function getWanPhraInMonth(year: number, month: number): LocalDate[] {
  const results: LocalDate[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const d = localDate(year, month, day);
    if (isWanPhra(d)) {
      results.push(d);
    }
  }

  return results;
}
