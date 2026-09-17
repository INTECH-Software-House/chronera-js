import { ChroneraError } from "../errors/errors.js";
import {
  instantFromDate,
  instantFromEpochMilliseconds,
} from "../core/instant.js";
import {
  absoluteDayFromGregorianFields,
  gregorianFieldsFromAbsoluteDay,
} from "../core/absolute-day.js";
import { daysInGregorianMonth } from "../core/gregorian-math.js";
import { getIsoDayOfWeek } from "../core/iso-week.js";
import type { Instant, LocalDate } from "../public-types.js";

export type RRuleFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type RRuleWeekday = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";

export interface ByDayRule {
  readonly day: RRuleWeekday;
  readonly nth?: number | undefined; // e.g. 1 for 1st Monday, -1 for last Friday
}

export interface RRuleOptions {
  readonly freq: RRuleFrequency;
  readonly interval?: number | undefined;
  readonly count?: number | undefined;
  readonly until?: Instant | Date | string | undefined;
  readonly byDay?: readonly (RRuleWeekday | ByDayRule)[] | undefined;
  readonly byMonth?: readonly number[] | undefined;
  readonly byMonthDay?: readonly number[] | undefined;
  readonly bySetPos?: readonly number[] | undefined;
  readonly wkst?: RRuleWeekday | undefined;
  readonly dtstart?: Instant | Date | LocalDate | undefined;
}

export interface RRuleJob {
  readonly options: RRuleOptions;
  readonly dtstart: Instant;
  next(from?: Date | Instant | LocalDate): Instant | null;
  nextN(from: Date | Instant | LocalDate, n: number): Instant[];
  all(limit?: number): Instant[];
  matches(date: Date | Instant | LocalDate): boolean;
  toString(): string;
  toHuman(locale?: "th" | "en"): string;
}

const WEEKDAY_TO_DOW: Record<RRuleWeekday, number> = {
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
  SU: 7,
};

const DOW_TO_WEEKDAY: Record<number, RRuleWeekday> = {
  1: "MO",
  2: "TU",
  3: "WE",
  4: "TH",
  5: "FR",
  6: "SA",
  7: "SU",
};

function toInstant(input?: Date | Instant | LocalDate | null): Instant {
  if (!input) return instantFromDate(new Date());
  if (input instanceof Date) return instantFromDate(input);
  if (
    typeof input === "object" &&
    input !== null &&
    "kind" in input &&
    (input as { readonly kind: unknown }).kind === "instant"
  ) {
    return input as Instant;
  }
  if (
    typeof input === "object" &&
    input !== null &&
    "kind" in input &&
    (input as { readonly kind: unknown }).kind === "local-date"
  ) {
    const ld = input as LocalDate;
    return instantFromEpochMilliseconds(
      Date.UTC(ld.year, ld.month - 1, ld.day, 0, 0, 0),
    );
  }
  throw new ChroneraError(
    "CHRONERA_INVALID_INSTANT",
    "Invalid Instant, Date or LocalDate",
  );
}

function parseUntil(val: string): Instant {
  const m = val.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?$/);
  if (!m) {
    throw new ChroneraError(
      "CHRONERA_PARSE_FAILED",
      `Invalid UNTIL date in RRULE: "${val}"`,
    );
  }
  const y = parseInt(m[1]!, 10);
  const mo = parseInt(m[2]!, 10);
  const d = parseInt(m[3]!, 10);
  const h = m[4] ? parseInt(m[4], 10) : 23;
  const mi = m[5] ? parseInt(m[5], 10) : 59;
  const s = m[6] ? parseInt(m[6], 10) : 59;
  return instantFromEpochMilliseconds(Date.UTC(y, mo - 1, d, h, mi, s));
}

function parseByDayItem(item: string): ByDayRule {
  const m = item.trim().match(/^([+-]?\d+)?(MO|TU|WE|TH|FR|SA|SU)$/i);
  if (!m) {
    throw new ChroneraError(
      "CHRONERA_PARSE_FAILED",
      `Invalid BYDAY item in RRULE: "${item}"`,
    );
  }
  const day = m[2]!.toUpperCase() as RRuleWeekday;
  const nth = m[1] ? parseInt(m[1], 10) : undefined;
  return { day, nth };
}

export function parseRRule(
  expression: string,
  dtstartInput?: Date | Instant | LocalDate,
): RRuleJob {
  if (!expression || typeof expression !== "string") {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      "RRULE string must be a non-empty string",
    );
  }

  let cleaned = expression.trim();
  if (cleaned.startsWith("RRULE:")) {
    cleaned = cleaned.slice(6).trim();
  }

  const parts = cleaned.split(";");
  let freq: RRuleFrequency | undefined;
  let interval = 1;
  let count: number | undefined;
  let until: Instant | undefined;
  let byDay: ByDayRule[] | undefined;
  let byMonth: number[] | undefined;
  let byMonthDay: number[] | undefined;
  let bySetPos: number[] | undefined;
  let wkst: RRuleWeekday = "MO";

  for (const part of parts) {
    if (!part) continue;
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim().toUpperCase();
    const value = part.slice(eq + 1).trim();

    switch (key) {
      case "FREQ": {
        const f = value.toUpperCase();
        if (
          f !== "DAILY" &&
          f !== "WEEKLY" &&
          f !== "MONTHLY" &&
          f !== "YEARLY"
        ) {
          throw new ChroneraError(
            "CHRONERA_INVALID_DATE",
            `Unsupported FREQ in RRULE: "${value}"`,
          );
        }
        freq = f as RRuleFrequency;
        break;
      }
      case "INTERVAL": {
        const iv = parseInt(value, 10);
        if (isNaN(iv) || iv <= 0) {
          throw new ChroneraError(
            "CHRONERA_OUT_OF_RANGE",
            `Invalid INTERVAL in RRULE: "${value}"`,
          );
        }
        interval = iv;
        break;
      }
      case "COUNT": {
        const c = parseInt(value, 10);
        if (isNaN(c) || c <= 0) {
          throw new ChroneraError(
            "CHRONERA_OUT_OF_RANGE",
            `Invalid COUNT in RRULE: "${value}"`,
          );
        }
        count = c;
        break;
      }
      case "UNTIL":
        until = parseUntil(value);
        break;
      case "BYDAY":
        byDay = value.split(",").map(parseByDayItem);
        break;
      case "BYMONTH":
        byMonth = value.split(",").map((v) => {
          const n = parseInt(v, 10);
          if (isNaN(n) || n < 1 || n > 12) {
            throw new ChroneraError(
              "CHRONERA_OUT_OF_RANGE",
              `Invalid BYMONTH in RRULE: "${v}"`,
            );
          }
          return n;
        });
        break;
      case "BYMONTHDAY":
        byMonthDay = value.split(",").map((v) => {
          const n = parseInt(v, 10);
          if (isNaN(n) || n < -31 || n > 31 || n === 0) {
            throw new ChroneraError(
              "CHRONERA_OUT_OF_RANGE",
              `Invalid BYMONTHDAY in RRULE: "${v}"`,
            );
          }
          return n;
        });
        break;
      case "BYSETPOS":
        bySetPos = value.split(",").map((v) => parseInt(v, 10));
        break;
      case "WKST":
        wkst = value.toUpperCase() as RRuleWeekday;
        break;
    }
  }

  if (!freq) {
    throw new ChroneraError("CHRONERA_PARSE_FAILED", "RRULE must specify FREQ");
  }

  const dtstart = toInstant(dtstartInput);

  const options: RRuleOptions = {
    freq,
    interval,
    count,
    until,
    byDay,
    byMonth,
    byMonthDay,
    bySetPos,
    wkst,
    dtstart,
  };

  return createRRuleJob(options, dtstart);
}

function createRRuleJob(options: RRuleOptions, dtstart: Instant): RRuleJob {
  const untilMs =
    options.until instanceof Date
      ? options.until.getTime()
      : typeof options.until === "object" &&
          options.until !== null &&
          "epochMilliseconds" in options.until
        ? (options.until as Instant).epochMilliseconds
        : typeof options.until === "string"
          ? parseUntil(options.until).epochMilliseconds
          : Infinity;

  const countLimit = options.count ?? Infinity;
  const interval = options.interval ?? 1;

  function generateCandidates(startInst: Instant, maxCount: number): Instant[] {
    const results: Instant[] = [];
    const startDate = new Date(startInst.epochMilliseconds);
    const startYear = startDate.getUTCFullYear();
    const startMonth = startDate.getUTCMonth() + 1;
    const startDay = startDate.getUTCDate();
    const startH = startDate.getUTCHours();
    const startM = startDate.getUTCMinutes();
    const startS = startDate.getUTCSeconds();

    const curAbsoluteDay = absoluteDayFromGregorianFields(
      startYear,
      startMonth,
      startDay,
    );
    let totalGenerated = 0;
    const safetyCap = Math.min(maxCount, 2000);

    if (options.freq === "DAILY") {
      let stepCount = 0;
      while (totalGenerated < safetyCap) {
        const abs = curAbsoluteDay + stepCount * interval;
        const g = gregorianFieldsFromAbsoluteDay(abs);
        const inst = instantFromEpochMilliseconds(
          Date.UTC(g.year, g.month - 1, g.day, startH, startM, startS),
        );
        if (inst.epochMilliseconds > untilMs) break;
        if (results.length >= countLimit) break;
        results.push(inst);
        totalGenerated++;
        stepCount++;
      }
    } else if (options.freq === "WEEKLY") {
      const curDOW = getIsoDayOfWeek(curAbsoluteDay);
      const byDays =
        options.byDay && options.byDay.length > 0
          ? options.byDay.map((d) => (typeof d === "string" ? d : d.day))
          : [DOW_TO_WEEKDAY[curDOW]!];

      const byDayTargetDOWs = new Set(byDays.map((d) => WEEKDAY_TO_DOW[d]));

      const wkstDOW = WEEKDAY_TO_DOW[options.wkst ?? "MO"];
      const offsetToWkst = (curDOW - wkstDOW + 7) % 7;
      const weekStartAbs = curAbsoluteDay - offsetToWkst;

      let weekIdx = 0;
      while (totalGenerated < safetyCap && results.length < countLimit) {
        const baseWeekAbs = weekStartAbs + weekIdx * interval * 7;
        for (let d = 0; d < 7; d++) {
          const dayAbs = baseWeekAbs + d;
          if (dayAbs < curAbsoluteDay) continue;
          const g = gregorianFieldsFromAbsoluteDay(dayAbs);
          const dow = getIsoDayOfWeek(dayAbs);
          if (byDayTargetDOWs.has(dow)) {
            const inst = instantFromEpochMilliseconds(
              Date.UTC(g.year, g.month - 1, g.day, startH, startM, startS),
            );
            if (inst.epochMilliseconds > untilMs) return results;
            if (results.length >= countLimit) return results;
            results.push(inst);
            totalGenerated++;
            if (totalGenerated >= safetyCap) return results;
          }
        }
        weekIdx++;
      }
    } else if (options.freq === "MONTHLY") {
      let mOffset = 0;
      while (totalGenerated < safetyCap && results.length < countLimit) {
        const totalMonths = startMonth - 1 + mOffset * interval;
        const targetYear = startYear + Math.floor(totalMonths / 12);
        const targetMonth = (totalMonths % 12) + 1;
        const daysInM = daysInGregorianMonth(targetYear, targetMonth);

        if (options.byDay && options.byDay.length > 0) {
          for (const rawDay of options.byDay) {
            const dRule = typeof rawDay === "string" ? { day: rawDay } : rawDay;
            const targetDOW = WEEKDAY_TO_DOW[dRule.day];
            const matchingDays: number[] = [];
            for (let day = 1; day <= daysInM; day++) {
              const abs = absoluteDayFromGregorianFields(
                targetYear,
                targetMonth,
                day,
              );
              const dow = getIsoDayOfWeek(abs);
              if (dow === targetDOW) {
                matchingDays.push(day);
              }
            }

            let resolvedDay: number | undefined;
            if (dRule.nth !== undefined) {
              if (dRule.nth > 0) {
                resolvedDay = matchingDays[dRule.nth - 1];
              } else if (dRule.nth < 0) {
                resolvedDay = matchingDays[matchingDays.length + dRule.nth];
              }
            } else {
              for (const mDay of matchingDays) {
                const abs = absoluteDayFromGregorianFields(
                  targetYear,
                  targetMonth,
                  mDay,
                );
                if (abs < curAbsoluteDay) continue;
                const inst = instantFromEpochMilliseconds(
                  Date.UTC(
                    targetYear,
                    targetMonth - 1,
                    mDay,
                    startH,
                    startM,
                    startS,
                  ),
                );
                if (inst.epochMilliseconds > untilMs) return results;
                if (results.length >= countLimit) return results;
                results.push(inst);
                totalGenerated++;
              }
              continue;
            }

            if (resolvedDay !== undefined) {
              const abs = absoluteDayFromGregorianFields(
                targetYear,
                targetMonth,
                resolvedDay,
              );
              if (abs >= curAbsoluteDay) {
                const inst = instantFromEpochMilliseconds(
                  Date.UTC(
                    targetYear,
                    targetMonth - 1,
                    resolvedDay,
                    startH,
                    startM,
                    startS,
                  ),
                );
                if (inst.epochMilliseconds > untilMs) return results;
                if (results.length >= countLimit) return results;
                results.push(inst);
                totalGenerated++;
              }
            }
          }
        } else {
          const targetDays =
            options.byMonthDay && options.byMonthDay.length > 0
              ? options.byMonthDay.map((d) => (d < 0 ? daysInM + 1 + d : d))
              : [Math.min(startDay, daysInM)];

          for (const day of targetDays) {
            if (day >= 1 && day <= daysInM) {
              const abs = absoluteDayFromGregorianFields(
                targetYear,
                targetMonth,
                day,
              );
              if (abs >= curAbsoluteDay) {
                const inst = instantFromEpochMilliseconds(
                  Date.UTC(
                    targetYear,
                    targetMonth - 1,
                    day,
                    startH,
                    startM,
                    startS,
                  ),
                );
                if (inst.epochMilliseconds > untilMs) return results;
                if (results.length >= countLimit) return results;
                results.push(inst);
                totalGenerated++;
              }
            }
          }
        }
        mOffset++;
      }
    } else if (options.freq === "YEARLY") {
      let yOffset = 0;
      const targetMonths =
        options.byMonth && options.byMonth.length > 0
          ? options.byMonth
          : [startMonth];

      while (totalGenerated < safetyCap && results.length < countLimit) {
        const targetYear = startYear + yOffset * interval;
        for (const tMonth of targetMonths) {
          const daysInM = daysInGregorianMonth(targetYear, tMonth);
          const tDay = Math.min(startDay, daysInM);
          const abs = absoluteDayFromGregorianFields(targetYear, tMonth, tDay);
          if (abs >= curAbsoluteDay) {
            const inst = instantFromEpochMilliseconds(
              Date.UTC(targetYear, tMonth - 1, tDay, startH, startM, startS),
            );
            if (inst.epochMilliseconds > untilMs) return results;
            if (results.length >= countLimit) return results;
            results.push(inst);
            totalGenerated++;
          }
        }
        yOffset++;
      }
    }

    return results;
  }

  return {
    options,
    dtstart,
    next(from?: Date | Instant | LocalDate): Instant | null {
      const targetFrom = from ? toInstant(from) : instantFromDate(new Date());
      const fromMs = targetFrom.epochMilliseconds;
      const list = generateCandidates(dtstart, 500);
      for (const inst of list) {
        if (inst.epochMilliseconds > fromMs) {
          return inst;
        }
      }
      return null;
    },
    nextN(from: Date | Instant | LocalDate, n: number): Instant[] {
      if (n <= 0) return [];
      const targetFrom = toInstant(from);
      const fromMs = targetFrom.epochMilliseconds;
      const list = generateCandidates(dtstart, Math.max(n * 4, 100));
      const res: Instant[] = [];
      for (const inst of list) {
        if (inst.epochMilliseconds > fromMs) {
          res.push(inst);
          if (res.length >= n) break;
        }
      }
      return res;
    },
    all(limit = 500): Instant[] {
      return generateCandidates(dtstart, Math.min(limit, countLimit));
    },
    matches(date: Date | Instant | LocalDate): boolean {
      const target = toInstant(date);
      const tMs = target.epochMilliseconds;
      const list = generateCandidates(dtstart, 500);
      return list.some((item) => item.epochMilliseconds === tMs);
    },
    toString(): string {
      return rruleToString(options);
    },
    toHuman(locale: "th" | "en" = "en"): string {
      return rruleToHuman(options, locale);
    },
  };
}

export function rruleToString(options: RRuleOptions): string {
  const parts: string[] = [`FREQ=${options.freq}`];

  if (options.interval && options.interval > 1) {
    parts.push(`INTERVAL=${options.interval}`);
  }
  if (options.count !== undefined) {
    parts.push(`COUNT=${options.count}`);
  }
  if (options.until !== undefined) {
    const uInst =
      typeof options.until === "string"
        ? options.until
        : (() => {
            const inst = toInstant(options.until as Date | Instant);
            const d = new Date(inst.epochMilliseconds);
            const y = d.getUTCFullYear();
            const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
            const day = String(d.getUTCDate()).padStart(2, "0");
            const h = String(d.getUTCHours()).padStart(2, "0");
            const mi = String(d.getUTCMinutes()).padStart(2, "0");
            const s = String(d.getUTCSeconds()).padStart(2, "0");
            return `${y}${mo}${day}T${h}${mi}${s}Z`;
          })();
    parts.push(`UNTIL=${uInst}`);
  }
  if (options.byDay && options.byDay.length > 0) {
    const days = options.byDay
      .map((d) => (typeof d === "string" ? d : `${d.nth ?? ""}${d.day}`))
      .join(",");
    parts.push(`BYDAY=${days}`);
  }
  if (options.byMonth && options.byMonth.length > 0) {
    parts.push(`BYMONTH=${options.byMonth.join(",")}`);
  }
  if (options.byMonthDay && options.byMonthDay.length > 0) {
    parts.push(`BYMONTHDAY=${options.byMonthDay.join(",")}`);
  }
  if (options.bySetPos && options.bySetPos.length > 0) {
    parts.push(`BYSETPOS=${options.bySetPos.join(",")}`);
  }
  if (options.wkst && options.wkst !== "MO") {
    parts.push(`WKST=${options.wkst}`);
  }

  return `RRULE:${parts.join(";")}`;
}

const TH_DAYS: Record<RRuleWeekday, string> = {
  MO: "จันทร์",
  TU: "อังคาร",
  WE: "พุธ",
  TH: "พฤหัสบดี",
  FR: "ศุกร์",
  SA: "เสาร์",
  SU: "อาทิตย์",
};

const EN_DAYS: Record<RRuleWeekday, string> = {
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
  SA: "Saturday",
  SU: "Sunday",
};

export function rruleToHuman(
  rrule: string | RRuleOptions,
  locale: "th" | "en" = "en",
): string {
  const opts: RRuleOptions =
    typeof rrule === "string" ? parseRRule(rrule).options : rrule;
  const isTh = locale === "th";
  const interval = opts.interval ?? 1;

  let base = "";

  if (opts.freq === "DAILY") {
    if (interval === 1) {
      base = isTh ? "ทุกวัน" : "Every day";
    } else {
      base = isTh ? `ทุกๆ ${interval} วัน` : `Every ${interval} days`;
    }
  } else if (opts.freq === "WEEKLY") {
    const days =
      opts.byDay && opts.byDay.length > 0
        ? opts.byDay.map((d) => {
            const w = typeof d === "string" ? d : d.day;
            return isTh ? TH_DAYS[w] : EN_DAYS[w];
          })
        : [];

    if (interval === 1) {
      if (days.length > 0) {
        base = isTh
          ? `ทุกวัน${days.join(" ")}`
          : `Every week on ${days.join(", ")}`;
      } else {
        base = isTh ? "ทุกสัปดาห์" : "Every week";
      }
    } else {
      if (days.length > 0) {
        base = isTh
          ? `ทุกๆ ${interval} สัปดาห์ ในวัน${days.join(" ")}`
          : `Every ${interval} weeks on ${days.join(", ")}`;
      } else {
        base = isTh ? `ทุกๆ ${interval} สัปดาห์` : `Every ${interval} weeks`;
      }
    }
  } else if (opts.freq === "MONTHLY") {
    if (opts.byDay && opts.byDay.length > 0) {
      const dRule =
        typeof opts.byDay[0] === "string"
          ? { day: opts.byDay[0] as RRuleWeekday }
          : opts.byDay[0]!;
      const dayName = isTh ? TH_DAYS[dRule.day] : EN_DAYS[dRule.day];
      const nthStr =
        dRule.nth === 1
          ? isTh
            ? "แรก"
            : "first"
          : dRule.nth === 2
            ? isTh
              ? "ที่สอง"
              : "second"
            : dRule.nth === 3
              ? isTh
                ? "ที่สาม"
                : "third"
              : dRule.nth === -1
                ? isTh
                  ? "สุดท้าย"
                  : "last"
                : isTh
                  ? `ที่ ${dRule.nth}`
                  : `${dRule.nth}th`;

      base = isTh
        ? `ทุกเดือนในวัน${dayName}${nthStr}`
        : `Monthly on the ${nthStr} ${dayName}`;
    } else if (opts.byMonthDay && opts.byMonthDay.length > 0) {
      const dayNum = opts.byMonthDay[0];
      base = isTh ? `ทุกเดือนในวันที่ ${dayNum}` : `Monthly on day ${dayNum}`;
    } else {
      base = isTh
        ? interval === 1
          ? "ทุกเดือน"
          : `ทุกๆ ${interval} เดือน`
        : interval === 1
          ? "Every month"
          : `Every ${interval} months`;
    }
  } else if (opts.freq === "YEARLY") {
    base = isTh
      ? interval === 1
        ? "ทุกปี"
        : `ทุกๆ ${interval} ปี`
      : interval === 1
        ? "Every year"
        : `Every ${interval} years`;
  }

  if (opts.count) {
    base += isTh ? ` ทั้งหมด ${opts.count} ครั้ง` : `, ${opts.count} times`;
  }

  return base;
}
