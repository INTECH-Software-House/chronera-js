import { ChroneraError } from "../errors/errors.js";
import { instantFromEpochMilliseconds } from "../core/instant.js";
import { daysInGregorianMonth } from "../core/gregorian-math.js";
import type { Instant, LocalDate } from "../public-types.js";

export type TimeBucketGranularity =
  "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year";

export interface TimeBucketOptions<T> {
  readonly dateField:
    keyof T | ((item: T) => Date | Instant | LocalDate | string | number);
  readonly bucket: TimeBucketGranularity;
  readonly range?: readonly [
    start: Date | Instant | LocalDate,
    end: Date | Instant | LocalDate,
  ];
  readonly fillGaps?: boolean;
  readonly valueField?: keyof T | ((item: T) => number);
}

export interface TimeBucketResult<T> {
  readonly key: string;
  readonly label: string;
  readonly start: Instant;
  readonly end: Instant;
  readonly items: readonly T[];
  readonly count: number;
  readonly sum: number | null;
  readonly avg: number | null;
  readonly min: number | null;
  readonly max: number | null;
}

function toEpochMs(
  input: Date | Instant | LocalDate | string | number,
): number {
  if (typeof input === "number") return input;
  if (typeof input === "string") {
    const ms = Date.parse(input);
    if (isNaN(ms))
      throw new ChroneraError(
        "CHRONERA_PARSE_FAILED",
        `Cannot parse date string: "${input}"`,
      );
    return ms;
  }
  if (input instanceof Date) return input.getTime();
  if (typeof input === "object" && input !== null && "kind" in input) {
    if (input.kind === "instant") return (input as Instant).epochMilliseconds;
    if (input.kind === "local-date") {
      const ld = input as LocalDate;
      return Date.UTC(ld.year, ld.month - 1, ld.day, 0, 0, 0);
    }
  }
  throw new ChroneraError(
    "CHRONERA_INVALID_DATE",
    "Expected valid Date, Instant, or LocalDate",
  );
}

function pad(n: number, w = 2): string {
  return String(n).padStart(w, "0");
}

interface BucketBounds {
  readonly key: string;
  readonly label: string;
  readonly startMs: number;
  readonly endMs: number;
}

function getBucketBounds(
  epochMs: number,
  granularity: TimeBucketGranularity,
): BucketBounds {
  const d = new Date(epochMs);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth(); // 0..11
  const day = d.getUTCDate();
  const h = d.getUTCHours();
  const min = d.getUTCMinutes();

  switch (granularity) {
    case "minute": {
      const startMs = Date.UTC(y, m, day, h, min, 0, 0);
      const endMs = startMs + 60000 - 1;
      const key = `${y}-${pad(m + 1)}-${pad(day)}T${pad(h)}:${pad(min)}`;
      return { key, label: key, startMs, endMs };
    }
    case "hour": {
      const startMs = Date.UTC(y, m, day, h, 0, 0, 0);
      const endMs = startMs + 3600000 - 1;
      const key = `${y}-${pad(m + 1)}-${pad(day)}T${pad(h)}:00`;
      return { key, label: key, startMs, endMs };
    }
    case "day": {
      const startMs = Date.UTC(y, m, day, 0, 0, 0, 0);
      const endMs = startMs + 86400000 - 1;
      const key = `${y}-${pad(m + 1)}-${pad(day)}`;
      return { key, label: key, startMs, endMs };
    }
    case "week": {
      // Find Monday 00:00:00 UTC
      const dow = (d.getUTCDay() + 6) % 7; // Monday=0, Sunday=6
      const startMs = Date.UTC(y, m, day - dow, 0, 0, 0, 0);
      const endMs = startMs + 7 * 86400000 - 1;
      const startD = new Date(startMs);
      const key = `${startD.getUTCFullYear()}-W${pad(startD.getUTCMonth() + 1)}-${pad(startD.getUTCDate())}`;
      const label = `Week of ${startD.getUTCFullYear()}-${pad(startD.getUTCMonth() + 1)}-${pad(startD.getUTCDate())}`;
      return { key, label, startMs, endMs };
    }
    case "month": {
      const startMs = Date.UTC(y, m, 1, 0, 0, 0, 0);
      const daysInM = daysInGregorianMonth(y, m + 1);
      const endMs = Date.UTC(y, m, daysInM, 23, 59, 59, 999);
      const key = `${y}-${pad(m + 1)}`;
      return { key, label: key, startMs, endMs };
    }
    case "quarter": {
      const q = Math.floor(m / 3); // 0..3
      const startMonth = q * 3;
      const endMonth = startMonth + 2;
      const startMs = Date.UTC(y, startMonth, 1, 0, 0, 0, 0);
      const daysInEndM = daysInGregorianMonth(y, endMonth + 1);
      const endMs = Date.UTC(y, endMonth, daysInEndM, 23, 59, 59, 999);
      const key = `${y}-Q${q + 1}`;
      return { key, label: key, startMs, endMs };
    }
    case "year": {
      const startMs = Date.UTC(y, 0, 1, 0, 0, 0, 0);
      const endMs = Date.UTC(y, 11, 31, 23, 59, 59, 999);
      const key = `${y}`;
      return { key, label: key, startMs, endMs };
    }
  }
}

function advanceBucketMs(
  currentStartMs: number,
  granularity: TimeBucketGranularity,
): number {
  const d = new Date(currentStartMs);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();

  switch (granularity) {
    case "minute":
      return currentStartMs + 60000;
    case "hour":
      return currentStartMs + 3600000;
    case "day":
      return currentStartMs + 86400000;
    case "week":
      return currentStartMs + 7 * 86400000;
    case "month": {
      const nextM = m + 1;
      const nextY = y + Math.floor(nextM / 12);
      return Date.UTC(nextY, nextM % 12, 1, 0, 0, 0, 0);
    }
    case "quarter": {
      const nextM = m + 3;
      const nextY = y + Math.floor(nextM / 12);
      return Date.UTC(nextY, nextM % 12, 1, 0, 0, 0, 0);
    }
    case "year":
      return Date.UTC(y + 1, 0, 1, 0, 0, 0, 0);
  }
}

export function timeBuckets<T>(
  items: readonly T[],
  options: TimeBucketOptions<T>,
): TimeBucketResult<T>[] {
  if (!options || !options.bucket) {
    throw new ChroneraError(
      "CHRONERA_INCOMPATIBLE_OPTION",
      "timeBuckets requires bucket granularity",
    );
  }

  const getDateMs = (item: T): number => {
    if (typeof options.dateField === "function") {
      return toEpochMs(options.dateField(item));
    }
    const val = item[options.dateField] as
      Date | Instant | LocalDate | string | number;
    return toEpochMs(val);
  };

  const getValue = (item: T): number | null => {
    if (!options.valueField) return null;
    if (typeof options.valueField === "function") {
      const v = options.valueField(item);
      return typeof v === "number" && !isNaN(v) ? v : null;
    }
    const raw = item[options.valueField];
    return typeof raw === "number" && !isNaN(raw) ? raw : null;
  };

  // Group items by bucket key
  const bucketMap = new Map<string, { bounds: BucketBounds; items: T[] }>();

  let minEpoch = Infinity;
  let maxEpoch = -Infinity;

  for (const item of items) {
    const epochMs = getDateMs(item);
    if (epochMs < minEpoch) minEpoch = epochMs;
    if (epochMs > maxEpoch) maxEpoch = epochMs;

    const bounds = getBucketBounds(epochMs, options.bucket);
    if (!bucketMap.has(bounds.key)) {
      bucketMap.set(bounds.key, { bounds, items: [] });
    }
    bucketMap.get(bounds.key)!.items.push(item);
  }

  // Handle Gap Filling
  if (options.fillGaps) {
    let startSpanMs: number;
    let endSpanMs: number;

    if (options.range) {
      startSpanMs = toEpochMs(options.range[0]);
      endSpanMs = toEpochMs(options.range[1]);
    } else if (items.length > 0) {
      startSpanMs = minEpoch;
      endSpanMs = maxEpoch;
    } else {
      startSpanMs = Date.now();
      endSpanMs = startSpanMs;
    }

    if (startSpanMs <= endSpanMs) {
      let curMs = getBucketBounds(startSpanMs, options.bucket).startMs;
      const endBoundMs = getBucketBounds(endSpanMs, options.bucket).endMs;

      let safety = 0;
      while (curMs <= endBoundMs && safety < 5000) {
        const bounds = getBucketBounds(curMs, options.bucket);
        if (!bucketMap.has(bounds.key)) {
          bucketMap.set(bounds.key, { bounds, items: [] });
        }
        curMs = advanceBucketMs(curMs, options.bucket);
        safety++;
      }
    }
  }

  // Sort chronological
  const sorted = [...bucketMap.values()].sort(
    (a, b) => a.bounds.startMs - b.bounds.startMs,
  );

  return sorted.map(({ bounds, items: bItems }) => {
    const count = bItems.length;
    let sum: number | null = null;
    let avg: number | null = null;
    let min: number | null = null;
    let max: number | null = null;

    if (options.valueField) {
      let total = 0;
      let valCount = 0;
      let curMin = Infinity;
      let curMax = -Infinity;

      for (const it of bItems) {
        const v = getValue(it);
        if (v !== null) {
          total += v;
          valCount++;
          if (v < curMin) curMin = v;
          if (v > curMax) curMax = v;
        }
      }

      if (valCount > 0) {
        sum = total;
        avg = total / valCount;
        min = curMin;
        max = curMax;
      } else if (options.fillGaps && count === 0) {
        sum = 0;
        avg = 0;
      }
    }

    return {
      key: bounds.key,
      label: bounds.label,
      start: instantFromEpochMilliseconds(bounds.startMs),
      end: instantFromEpochMilliseconds(bounds.endMs),
      items: bItems,
      count,
      sum,
      avg,
      min,
      max,
    };
  });
}
