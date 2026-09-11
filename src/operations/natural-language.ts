import { ChroneraError } from "../errors/errors.js";
import { projectInstantToZonedFields } from "../runtime/timezone.js";
import {
  absoluteDayFromGregorianFields,
  gregorianFieldsFromAbsoluteDay,
} from "../core/absolute-day.js";
import {
  addDays,
  addMonths,
  addYears,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "./convenience.js";

import type { LocalDate, TimeZoneId } from "../public-types.js";

export interface ParseNaturalDateOptions {
  readonly locale?: string;
  readonly referenceDate?: LocalDate;
  readonly timeZone?: TimeZoneId;
}

export interface ParseNaturalDateResult {
  readonly date: LocalDate;
  readonly pattern: string;
}

function todayLocal(tz?: TimeZoneId): LocalDate {
  const zone =
    tz ??
    (typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC") ??
    "UTC";
  const instant = { kind: "instant" as const, epochMilliseconds: Date.now() };
  const z = projectInstantToZonedFields(instant, zone);
  return { kind: "local-date", year: z.year, month: z.month, day: z.day };
}

function absDay(d: LocalDate): number {
  return absoluteDayFromGregorianFields(d.year, d.month, d.day);
}

function fromAbs(n: number): LocalDate {
  const f = gregorianFieldsFromAbsoluteDay(n);
  return { kind: "local-date", year: f.year, month: f.month, day: f.day };
}

// absDay % 7 mapping (derived from absoluteDayFromGregorianFields):
// Thursday=0, Friday=1, Saturday=2, Sunday=3, Monday=4, Tuesday=5, Wednesday=6
const DOW_INDEX: Record<string, number> = {
  monday: 4,
  tuesday: 5,
  wednesday: 6,
  thursday: 0,
  friday: 1,
  saturday: 2,
  sunday: 3,
};

function dayOfWeekIndex(d: LocalDate): number {
  return absDay(d) % 7;
}

function nextWeekday(ref: LocalDate, t: number): LocalDate {
  const diff = (t - dayOfWeekIndex(ref) + 7) % 7 || 7;
  return fromAbs(absDay(ref) + diff);
}

function lastWeekday(ref: LocalDate, t: number): LocalDate {
  const diff = (dayOfWeekIndex(ref) - t + 7) % 7 || 7;
  return fromAbs(absDay(ref) - diff);
}

const LANG_TOKENS: Record<string, Record<string, string>> = {
  th: {
    วันนี้: "today",
    เมื่อวาน: "yesterday",
    เมื่อวานนี้: "yesterday",
    พรุ่งนี้: "tomorrow",
    มะรืน: "day after tomorrow",
    อาทิตย์หน้า: "next week",
    สัปดาห์หน้า: "next week",
    อาทิตย์ที่แล้ว: "last week",
    สัปดาห์ที่แล้ว: "last week",
    เดือนหน้า: "next month",
    เดือนที่แล้ว: "last month",
    ปีหน้า: "next year",
    ปีที่แล้ว: "last year",
    วันจันทร์: "monday",
    วันอังคาร: "tuesday",
    วันพุธ: "wednesday",
    วันพฤหัสบดี: "thursday",
    วันพฤหัส: "thursday",
    วันศุกร์: "friday",
    วันเสาร์: "saturday",
    วันอาทิตย์: "sunday",
    ต้นเดือน: "start of month",
    ปลายเดือน: "end of month",
    ต้นปี: "start of year",
    ปลายปี: "end of year",
  },
  ja: {
    今日: "today",
    本日: "today",
    昨日: "yesterday",
    明日: "tomorrow",
    明後日: "day after tomorrow",
    来週: "next week",
    先週: "last week",
    今週: "this week",
    来月: "next month",
    先月: "last month",
    今月: "this month",
    来年: "next year",
    去年: "last year",
    今年: "this year",
    月曜日: "monday",
    火曜日: "tuesday",
    水曜日: "wednesday",
    木曜日: "thursday",
    金曜日: "friday",
    土曜日: "saturday",
    日曜日: "sunday",
    月曜: "monday",
    火曜: "tuesday",
    水曜: "wednesday",
    木曜: "thursday",
    金曜: "friday",
    土曜: "saturday",
    日曜: "sunday",
  },
  zh: {
    今天: "today",
    今日: "today",
    昨天: "yesterday",
    昨日: "yesterday",
    明天: "tomorrow",
    明日: "tomorrow",
    后天: "day after tomorrow",
    後天: "day after tomorrow",
    下周: "next week",
    下週: "next week",
    上周: "last week",
    上週: "last week",
    下个月: "next month",
    下個月: "next month",
    上个月: "last month",
    上個月: "last month",
    明年: "next year",
    去年: "last year",
    星期一: "monday",
    星期二: "tuesday",
    星期三: "wednesday",
    星期四: "thursday",
    星期五: "friday",
    星期六: "saturday",
    星期日: "sunday",
    星期天: "sunday",
    周一: "monday",
    周二: "tuesday",
    周三: "wednesday",
    周四: "thursday",
    周五: "friday",
    周六: "saturday",
    周日: "sunday",
  },
  ko: {
    오늘: "today",
    어제: "yesterday",
    내일: "tomorrow",
    모레: "day after tomorrow",
    다음주: "next week",
    지난주: "last week",
    다음달: "next month",
    지난달: "last month",
    내년: "next year",
    작년: "last year",
    월요일: "monday",
    화요일: "tuesday",
    수요일: "wednesday",
    목요일: "thursday",
    금요일: "friday",
    토요일: "saturday",
    일요일: "sunday",
  },
  de: {
    heute: "today",
    gestern: "yesterday",
    morgen: "tomorrow",
    übermorgen: "day after tomorrow",
    "nächste woche": "next week",
    "letzte woche": "last week",
    "nächsten monat": "next month",
    "letzten monat": "last month",
    "nächstes jahr": "next year",
    "letztes jahr": "last year",
    montag: "monday",
    dienstag: "tuesday",
    mittwoch: "wednesday",
    donnerstag: "thursday",
    freitag: "friday",
    samstag: "saturday",
    sonntag: "sunday",
    "nächsten montag": "next monday",
    "nächsten dienstag": "next tuesday",
    "nächsten mittwoch": "next wednesday",
    "nächsten donnerstag": "next thursday",
    "nächsten freitag": "next friday",
  },
  fr: {
    "aujourd'hui": "today",
    hier: "yesterday",
    demain: "tomorrow",
    "après-demain": "day after tomorrow",
    "la semaine prochaine": "next week",
    "la semaine dernière": "last week",
    "le mois prochain": "next month",
    "le mois dernier": "last month",
    "l'année prochaine": "next year",
    "l'année dernière": "last year",
    lundi: "monday",
    mardi: "tuesday",
    mercredi: "wednesday",
    jeudi: "thursday",
    vendredi: "friday",
    samedi: "saturday",
    dimanche: "sunday",
    "lundi prochain": "next monday",
    "mardi prochain": "next tuesday",
  },
};

function normalize(input: string, locale: string): string {
  const lang = locale.split("-")[0]?.toLowerCase() ?? "en";
  const map = LANG_TOKENS[lang] ?? {};
  let s = input.trim().toLowerCase();
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const val = map[k];
    if (val !== undefined) s = s.replace(k.toLowerCase(), val);
  }
  return s.replace(/\s+/g, " ").trim();
}

type MatchResult = { date: LocalDate; pattern: string } | null;

function matchPattern(s: string, ref: LocalDate): MatchResult {
  if (s === "today") return { date: ref, pattern: "today" };
  if (s === "yesterday")
    return { date: fromAbs(absDay(ref) - 1), pattern: "yesterday" };
  if (s === "tomorrow")
    return { date: fromAbs(absDay(ref) + 1), pattern: "tomorrow" };
  if (s === "day after tomorrow")
    return { date: fromAbs(absDay(ref) + 2), pattern: "day after tomorrow" };
  if (s === "day before yesterday")
    return { date: fromAbs(absDay(ref) - 2), pattern: "day before yesterday" };

  if (s === "next week")
    return { date: fromAbs(absDay(ref) + 7), pattern: "next week" };
  if (s === "last week")
    return { date: fromAbs(absDay(ref) - 7), pattern: "last week" };
  if (s === "this week" || s === "start of this week") {
    return {
      date: fromAbs(absDay(ref) - dayOfWeekIndex(ref)),
      pattern: "start of this week",
    };
  }
  if (s === "end of this week") {
    return {
      date: fromAbs(absDay(ref) + (6 - dayOfWeekIndex(ref))),
      pattern: "end of this week",
    };
  }

  if (s === "next month")
    return {
      date: addMonths(ref, 1, "constrain") as LocalDate,
      pattern: "next month",
    };
  if (s === "last month")
    return {
      date: addMonths(ref, -1, "constrain") as LocalDate,
      pattern: "last month",
    };
  if (s === "this month" || s === "start of month")
    return { date: startOfMonth(ref) as LocalDate, pattern: "start of month" };
  if (s === "end of month")
    return { date: endOfMonth(ref) as LocalDate, pattern: "end of month" };

  if (s === "next year")
    return {
      date: addYears(ref, 1, "constrain") as LocalDate,
      pattern: "next year",
    };
  if (s === "last year")
    return {
      date: addYears(ref, -1, "constrain") as LocalDate,
      pattern: "last year",
    };
  if (s === "this year" || s === "start of year")
    return { date: startOfYear(ref) as LocalDate, pattern: "start of year" };
  if (s === "end of year")
    return { date: endOfYear(ref) as LocalDate, pattern: "end of year" };

  if (DOW_INDEX[s] !== undefined)
    return {
      date: nextWeekday(ref, DOW_INDEX[s] as number),
      pattern: `next ${s}`,
    };

  const nextDay =
    /^next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/.exec(s);
  if (nextDay?.[1])
    return {
      date: nextWeekday(ref, DOW_INDEX[nextDay[1]] as number),
      pattern: `next ${nextDay[1]}`,
    };

  const lastDay =
    /^last (monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/.exec(s);
  if (lastDay?.[1])
    return {
      date: lastWeekday(ref, DOW_INDEX[lastDay[1]] as number),
      pattern: `last ${lastDay[1]}`,
    };

  const thisDay =
    /^this (monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/.exec(s);
  if (thisDay?.[1]) {
    const t = DOW_INDEX[thisDay[1]] as number;
    const diff = (t - dayOfWeekIndex(ref) + 7) % 7;
    return { date: fromAbs(absDay(ref) + diff), pattern: `this ${thisDay[1]}` };
  }

  const inFuture =
    /^in (\d+) (day|days|week|weeks|month|months|year|years)$/.exec(s);
  if (inFuture?.[1] && inFuture[2]) {
    const n = parseInt(inFuture[1], 10);
    const u = inFuture[2].replace(/s$/, "");
    if (u === "day")
      return { date: addDays(ref, n) as LocalDate, pattern: `in ${n} days` };
    if (u === "week")
      return {
        date: addDays(ref, n * 7) as LocalDate,
        pattern: `in ${n} weeks`,
      };
    if (u === "month")
      return {
        date: addMonths(ref, n, "constrain") as LocalDate,
        pattern: `in ${n} months`,
      };
    if (u === "year")
      return {
        date: addYears(ref, n, "constrain") as LocalDate,
        pattern: `in ${n} years`,
      };
  }

  const ago = /^(\d+) (day|days|week|weeks|month|months|year|years) ago$/.exec(
    s,
  );
  if (ago?.[1] && ago[2]) {
    const n = parseInt(ago[1], 10);
    const u = ago[2].replace(/s$/, "");
    if (u === "day")
      return { date: addDays(ref, -n) as LocalDate, pattern: `${n} days ago` };
    if (u === "week")
      return {
        date: addDays(ref, -n * 7) as LocalDate,
        pattern: `${n} weeks ago`,
      };
    if (u === "month")
      return {
        date: addMonths(ref, -n, "constrain") as LocalDate,
        pattern: `${n} months ago`,
      };
    if (u === "year")
      return {
        date: addYears(ref, -n, "constrain") as LocalDate,
        pattern: `${n} years ago`,
      };
  }

  const fromNow =
    /^(\d+) (day|days|week|weeks|month|months|year|years) from now$/.exec(s);
  if (fromNow?.[1] && fromNow[2]) {
    const n = parseInt(fromNow[1], 10);
    const u = fromNow[2].replace(/s$/, "");
    if (u === "day")
      return {
        date: addDays(ref, n) as LocalDate,
        pattern: `${n} days from now`,
      };
    if (u === "week")
      return {
        date: addDays(ref, n * 7) as LocalDate,
        pattern: `${n} weeks from now`,
      };
    if (u === "month")
      return {
        date: addMonths(ref, n, "constrain") as LocalDate,
        pattern: `${n} months from now`,
      };
    if (u === "year")
      return {
        date: addYears(ref, n, "constrain") as LocalDate,
        pattern: `${n} years from now`,
      };
  }

  const boundary = /^(start|end) of (next|last|this) (month|year)$/.exec(s);
  if (boundary) {
    const edge = boundary[1] as "start" | "end";
    const rel = boundary[2] as "next" | "last" | "this";
    const unit = boundary[3] as "month" | "year";
    let base = ref as LocalDate;
    if (unit === "month") {
      if (rel === "next") base = addMonths(ref, 1, "constrain") as LocalDate;
      else if (rel === "last")
        base = addMonths(ref, -1, "constrain") as LocalDate;
      return {
        date: (edge === "start"
          ? startOfMonth(base)
          : endOfMonth(base)) as LocalDate,
        pattern: `${edge} of ${rel} month`,
      };
    }
    if (unit === "year") {
      if (rel === "next") base = addYears(ref, 1, "constrain") as LocalDate;
      else if (rel === "last")
        base = addYears(ref, -1, "constrain") as LocalDate;
      return {
        date: (edge === "start"
          ? startOfYear(base)
          : endOfYear(base)) as LocalDate,
        pattern: `${edge} of ${rel} year`,
      };
    }
  }

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso?.[1] && iso[2] && iso[3]) {
    return {
      date: { kind: "local-date", year: +iso[1], month: +iso[2], day: +iso[3] },
      pattern: "iso-date",
    };
  }

  return null;
}

export function parseNaturalDate(
  input: string,
  options?: ParseNaturalDateOptions,
): LocalDate {
  const ref = options?.referenceDate ?? todayLocal(options?.timeZone);
  const normalized = normalize(input, options?.locale ?? "en");
  const result = matchPattern(normalized, ref);
  if (!result) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Cannot parse natural language date: "${input}". ` +
        `Supported: today, yesterday, tomorrow, next/last week/month/year, ` +
        `in N days/weeks/months/years, N days ago, next/last <weekday>, YYYY-MM-DD.`,
    );
  }
  return result.date;
}

export function safeParseNaturalDate(
  input: string,
  options?: ParseNaturalDateOptions,
): LocalDate | null {
  try {
    return parseNaturalDate(input, options);
  } catch {
    return null;
  }
}

export function parseNaturalDateDebug(
  input: string,
  options?: ParseNaturalDateOptions,
): ParseNaturalDateResult {
  const ref = options?.referenceDate ?? todayLocal(options?.timeZone);
  const normalized = normalize(input, options?.locale ?? "en");
  const result = matchPattern(normalized, ref);
  if (!result)
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Cannot parse: "${input}".`,
    );
  return result;
}
