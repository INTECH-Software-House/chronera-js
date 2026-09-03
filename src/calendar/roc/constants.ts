import { MAX_ABSOLUTE_DAY } from "../../core/absolute-day.js";
import type { CalendarIdentity } from "../types.js";

export const ROC_OFFSET = 1911;

// 1912-01-01 (Minguo 1)
export const ROC_START_ABSOLUTE_DAY = -21185;

export const ROC_IDENTITY: CalendarIdentity = {
  id: "roc",
  algorithm: "chronera-roc-v1",
  deterministic: true,
  validRange: {
    first: ROC_START_ABSOLUTE_DAY,
    last: MAX_ABSOLUTE_DAY,
  },
  validFrom: { kind: "local-date", year: 1912, month: 1, day: 1 },
  validTo: { kind: "local-date", year: 9999, month: 12, day: 31 },
};

export const TAIWAN_WEEKDAY_NAMES = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
] as const;

export const TAIWAN_WEEKDAY_SHORT = [
  "日",
  "一",
  "二",
  "三",
  "四",
  "五",
  "六",
] as const;
