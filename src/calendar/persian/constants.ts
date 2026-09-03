import { MAX_ABSOLUTE_DAY } from "../../core/absolute-day.js";
import type { CalendarIdentity } from "../types.js";

// Epoch: 1 Farvardin 1 AP = 622-03-22 CE. Absolute day: -492267
export const PERSIAN_EPOCH_ABSOLUTE_DAY = -492267;

export const PERSIAN_IDENTITY: CalendarIdentity = {
  id: "persian",
  algorithm: "chronera-persian-v1",
  deterministic: true,
  validRange: {
    first: PERSIAN_EPOCH_ABSOLUTE_DAY,
    last: MAX_ABSOLUTE_DAY,
  },
  validFrom: { kind: "local-date", year: 622, month: 3, day: 22 },
  validTo: { kind: "local-date", year: 9999, month: 12, day: 31 },
};

export const PERSIAN_MONTH_NAMES = [
  "Farvardin",
  "Ordibehesht",
  "Khordad",
  "Tir",
  "Mordad",
  "Shahrivar",
  "Mehr",
  "Aban",
  "Azar",
  "Dey",
  "Bahman",
  "Esfand",
] as const;

export const PERSIAN_MONTH_NAMES_FA = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;
