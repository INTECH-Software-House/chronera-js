export interface JapaneseEraDefinition {
  readonly id: string;
  readonly kanji: string;
  readonly romaji: string;
  readonly startYear: number;
  readonly startMonth: number;
  readonly startDay: number;
  readonly startAbsoluteDay: number;
  readonly offset: number; // gregorianYear - offset = eraYear
}

import { MAX_ABSOLUTE_DAY } from "../../core/absolute-day.js";
import type { CalendarIdentity } from "../types.js";

export const JAPANESE_IDENTITY: CalendarIdentity = {
  id: "japanese",
  algorithm: "chronera-japanese-v1",
  deterministic: true,
  validRange: {
    first: -36997, // 1868-09-08 (Meiji 1)
    last: MAX_ABSOLUTE_DAY,
  },
  validFrom: { kind: "local-date", year: 1868, month: 9, day: 8 },
  validTo: { kind: "local-date", year: 9999, month: 12, day: 31 },
};

export const JAPANESE_ERAS: readonly JapaneseEraDefinition[] = [
  {
    id: "reiwa",
    kanji: "令和",
    romaji: "Reiwa",
    startYear: 2019,
    startMonth: 5,
    startDay: 1,
    startAbsoluteDay: 18017,
    offset: 2018,
  },
  {
    id: "heisei",
    kanji: "平成",
    romaji: "Heisei",
    startYear: 1989,
    startMonth: 1,
    startDay: 8,
    startAbsoluteDay: 6947,
    offset: 1988,
  },
  {
    id: "showa",
    kanji: "昭和",
    romaji: "Showa",
    startYear: 1926,
    startMonth: 12,
    startDay: 25,
    startAbsoluteDay: -15713,
    offset: 1925,
  },
  {
    id: "taisho",
    kanji: "大正",
    romaji: "Taisho",
    startYear: 1912,
    startMonth: 7,
    startDay: 30,
    startAbsoluteDay: -20974,
    offset: 1911,
  },
  {
    id: "meiji",
    kanji: "明治",
    romaji: "Meiji",
    startYear: 1868,
    startMonth: 9,
    startDay: 8,
    startAbsoluteDay: -36997,
    offset: 1867,
  },
] as const;

export const JAPANESE_WEEKDAY_NAMES = [
  "日曜日", // Sunday
  "月曜日", // Monday
  "火曜日", // Tuesday
  "水曜日", // Wednesday
  "木曜日", // Thursday
  "金曜日", // Friday
  "土曜日", // Saturday
] as const;

export const JAPANESE_WEEKDAY_SHORT = [
  "日",
  "月",
  "火",
  "水",
  "木",
  "金",
  "土",
] as const;

export const ERA_BY_ID = new Map<string, JapaneseEraDefinition>(
  JAPANESE_ERAS.map((e) => [e.id, e]),
);

export const ERA_BY_KANJI = new Map<string, JapaneseEraDefinition>(
  JAPANESE_ERAS.map((e) => [e.kanji, e]),
);
