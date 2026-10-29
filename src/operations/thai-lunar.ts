import { localDate } from "../core/local-date.js";
import { toJulianDayNumber } from "./julian-day.js";
import { resolveThaiLocalDate, type ThaiDateInput } from "./thai-fiscal.js";

import type { LocalDate } from "../public-types.js";

export interface ThaiLunarDate {
  /** true = ข้างขึ้น (Waxing), false = ข้างแรม (Waning) */
  readonly isWaxing: boolean;
  /** ค่ำ (1 - 15) */
  readonly phaseDay: number;
  /** เดือนทางจันทรคติไทย (1 - 12) */
  readonly lunarMonth: number;
  /** เป็นปีอธิกมาส (เดือน 8 สองหน) หรือไม่ */
  readonly isLeapMonth: boolean;
  /** ตรงกับวันพระหรือไม่ (ขึ้น 8, ขึ้น 15, แรม 8, แรม 14/15) */
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

const resolveLocalDate = resolveThaiLocalDate;

/**
 * Calculates Thai Buddhist Lunar Calendar (ปฏิทินจันทรคติไทย) details,
 * phase (ข้างขึ้น-ข้างแรม ๑-๑๕ ค่ำ), and Wan Phra (วันพระ) detection.
 */
export function getThaiLunarDate(input: ThaiDateInput): ThaiLunarDate {
  const d = resolveLocalDate(input);
  const jdn = toJulianDayNumber(d);

  // Synodic phase calculation (0.0 = New Moon, 0.5 = Full Moon, 1.0 = Next New Moon)
  const daysSinceEpoch = jdn - REFERENCE_NEW_MOON_JDN;
  let phase = (daysSinceEpoch / SYNODIC_MONTH) % 1;
  if (phase < 0) phase += 1;

  // Illumination percentage (0% at new moon, 100% at full moon)
  const illumination =
    Math.round(0.5 * (1 - Math.cos(2 * Math.PI * phase)) * 100) / 100;

  // Map to 30 lunar days (ขึ้น 1-15 ค่ำ, แรม 1-15 ค่ำ)
  const lunarDayInMonth = Math.floor(phase * 30) + 1;
  const isWaxing = lunarDayInMonth <= 15;
  const phaseDay = isWaxing ? lunarDayInMonth : lunarDayInMonth - 15;

  let lunarMonth = (d.month + 1) % 12;
  if (lunarMonth === 0) lunarMonth = 12;

  // Determine standard Moon Phase name
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

  // Wan Phra detection:
  // 1. ขึ้น 8 ค่ำ
  // 2. ขึ้น 15 ค่ำ (วันเพ็ญ)
  // 3. แรม 8 ค่ำ
  // 4. แรม 14 หรือ 15 ค่ำ (วันดับ)
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
  } else {
    if (phaseDay === 8) {
      isWanPhra = true;
      wanPhraTitle = "วันพระ (แรม ๘ ค่ำ)";
    } else if (phaseDay === 14 || phaseDay === 15) {
      isWanPhra = true;
      wanPhraTitle = `วันพระ (วันดับ แรม ${phaseDay === 14 ? "๑๔" : "๑๕"} ค่ำ)`;
    }
  }

  return {
    isWaxing,
    phaseDay,
    lunarMonth,
    isLeapMonth: false,
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
 * Formats Thai Lunar date into traditional phrase (e.g. "ขึ้น ๑๕ ค่ำ เดือน ๘" or "แรม ๘ ค่ำ เดือน ๓").
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

  return `${side} ${dayStr} ค่ำ เดือน ${monthStr}`;
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
