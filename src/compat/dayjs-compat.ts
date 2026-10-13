import { chronera, type Chronera, type ChroneraInput } from "../chronera.js";
import { convertDayjsPattern } from "./patterns.js";

export type DayjsUnit =
  | "year"
  | "years"
  | "y"
  | "month"
  | "months"
  | "M"
  | "week"
  | "weeks"
  | "w"
  | "day"
  | "days"
  | "d"
  | "hour"
  | "hours"
  | "h"
  | "minute"
  | "minutes"
  | "m"
  | "second"
  | "seconds"
  | "s"
  | "millisecond"
  | "milliseconds"
  | "ms";

export type OpUnitType = DayjsUnit;

/**
 * Normalizes unit string alias to standard unit name.
 */
function normalizeUnit(unit?: string): string {
  if (!unit) return "millisecond";
  const u = unit.toLowerCase();
  switch (u) {
    case "y":
    case "years":
      return "year";
    case "m":
      // In Day.js, uppercase M is month, lowercase m is minute. But when lowercase:
      return unit === "M" ? "month" : "minute";
    case "months":
      return "month";
    case "w":
    case "weeks":
      return "week";
    case "d":
    case "days":
      return "day";
    case "h":
    case "hours":
      return "hour";
    case "minutes":
      return "minute";
    case "s":
    case "seconds":
      return "second";
    case "ms":
    case "milliseconds":
      return "millisecond";
    default:
      return u;
  }
}

/**
 * Day.js compatibility wrapper backed by Chronera.
 * Enables zero-effort migration from Day.js or Moment codebases.
 */
export class DayjsCompat {
  readonly #chronera: Chronera;

  constructor(input?: ChroneraInput) {
    this.#chronera = chronera(input);
  }

  /**
   * Returns the underlying Chronera instance.
   */
  toChronera(): Chronera {
    return this.#chronera;
  }

  isValid(): boolean {
    try {
      const d = this.#chronera.toDate();
      return !Number.isNaN(d.getTime());
    } catch {
      return false;
    }
  }

  year(): number;
  year(value: number): DayjsCompat;
  year(value?: number): number | DayjsCompat {
    const d = this.#chronera.toDate();
    if (value === undefined) return d.getFullYear();
    d.setFullYear(value);
    return new DayjsCompat(d);
  }

  month(): number;
  month(value: number): DayjsCompat;
  month(value?: number): number | DayjsCompat {
    const d = this.#chronera.toDate();
    if (value === undefined) return d.getMonth(); // 0-indexed like Day.js
    d.setMonth(value);
    return new DayjsCompat(d);
  }

  date(): number;
  date(value: number): DayjsCompat;
  date(value?: number): number | DayjsCompat {
    const d = this.#chronera.toDate();
    if (value === undefined) return d.getDate();
    d.setDate(value);
    return new DayjsCompat(d);
  }

  day(): number;
  day(value: number): DayjsCompat;
  day(value?: number): number | DayjsCompat {
    const d = this.#chronera.toDate();
    if (value === undefined) return d.getDay(); // 0 = Sunday .. 6 = Saturday
    const diff = value - d.getDay();
    d.setDate(d.getDate() + diff);
    return new DayjsCompat(d);
  }

  hour(): number;
  hour(value: number): DayjsCompat;
  hour(value?: number): number | DayjsCompat {
    const d = this.#chronera.toDate();
    if (value === undefined) return d.getHours();
    d.setHours(value);
    return new DayjsCompat(d);
  }

  minute(): number;
  minute(value: number): DayjsCompat;
  minute(value?: number): number | DayjsCompat {
    const d = this.#chronera.toDate();
    if (value === undefined) return d.getMinutes();
    d.setMinutes(value);
    return new DayjsCompat(d);
  }

  second(): number;
  second(value: number): DayjsCompat;
  second(value?: number): number | DayjsCompat {
    const d = this.#chronera.toDate();
    if (value === undefined) return d.getSeconds();
    d.setSeconds(value);
    return new DayjsCompat(d);
  }

  millisecond(): number;
  millisecond(value: number): DayjsCompat;
  millisecond(value?: number): number | DayjsCompat {
    const d = this.#chronera.toDate();
    if (value === undefined) return d.getMilliseconds();
    d.setMilliseconds(value);
    return new DayjsCompat(d);
  }

  add(value: number, unit?: DayjsUnit): DayjsCompat {
    const u = normalizeUnit(unit);
    let next = this.#chronera;
    switch (u) {
      case "year":
        next = next.addYears(value);
        break;
      case "month":
        next = next.addMonths(value);
        break;
      case "week":
        next = next.addDays(value * 7);
        break;
      case "day":
        next = next.addDays(value);
        break;
      case "hour":
        next = next.addHours(value);
        break;
      case "minute":
        next = next.addMinutes(value);
        break;
      case "second":
        next = next.addSeconds(value);
        break;
      case "millisecond": {
        const ms = next.toInstant().epochMilliseconds + value;
        next = chronera(ms);
        break;
      }
      default:
        next = next.addDays(value);
        break;
    }
    return new DayjsCompat(next);
  }

  subtract(value: number, unit?: DayjsUnit): DayjsCompat {
    return this.add(-value, unit);
  }

  startOf(unit: DayjsUnit): DayjsCompat {
    const u = normalizeUnit(unit);
    const d = this.#chronera.toDate();
    switch (u) {
      case "year":
        d.setMonth(0, 1);
        d.setHours(0, 0, 0, 0);
        break;
      case "month":
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        break;
      case "week": {
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        d.setHours(0, 0, 0, 0);
        break;
      }
      case "day":
        d.setHours(0, 0, 0, 0);
        break;
      case "hour":
        d.setMinutes(0, 0, 0);
        break;
      case "minute":
        d.setSeconds(0, 0);
        break;
      case "second":
        d.setMilliseconds(0);
        break;
    }
    return new DayjsCompat(d);
  }

  endOf(unit: DayjsUnit): DayjsCompat {
    const u = normalizeUnit(unit);
    const d = this.#chronera.toDate();
    switch (u) {
      case "year":
        d.setMonth(11, 31);
        d.setHours(23, 59, 59, 999);
        break;
      case "month": {
        // Last day of month
        d.setMonth(d.getMonth() + 1, 0);
        d.setHours(23, 59, 59, 999);
        break;
      }
      case "week": {
        const day = d.getDay();
        d.setDate(d.getDate() + (6 - day));
        d.setHours(23, 59, 59, 999);
        break;
      }
      case "day":
        d.setHours(23, 59, 59, 999);
        break;
      case "hour":
        d.setMinutes(59, 59, 999);
        break;
      case "minute":
        d.setSeconds(59, 999);
        break;
      case "second":
        d.setMilliseconds(999);
        break;
    }
    return new DayjsCompat(d);
  }

  format(pattern?: string): string {
    if (!pattern) {
      return this.#chronera.toISOString();
    }
    const ldml = convertDayjsPattern(pattern);
    return this.#chronera.format(ldml);
  }

  diff(other: unknown, unit?: DayjsUnit, float: boolean = false): number {
    const otherCompat =
      other instanceof DayjsCompat
        ? other
        : new DayjsCompat(other as ChroneraInput);
    const ms1 = this.valueOf();
    const ms2 = otherCompat.valueOf();
    const diffMs = ms1 - ms2;
    const u = normalizeUnit(unit);

    let res: number;
    switch (u) {
      case "year": {
        const d1 = this.toDate();
        const d2 = otherCompat.toDate();
        const monthDiff =
          (d1.getFullYear() - d2.getFullYear()) * 12 +
          (d1.getMonth() - d2.getMonth());
        res = monthDiff / 12;
        break;
      }
      case "month": {
        const d1 = this.toDate();
        const d2 = otherCompat.toDate();
        res =
          (d1.getFullYear() - d2.getFullYear()) * 12 +
          (d1.getMonth() - d2.getMonth());
        break;
      }
      case "week":
        res = diffMs / (7 * 24 * 3600 * 1000);
        break;
      case "day":
        res = diffMs / (24 * 3600 * 1000);
        break;
      case "hour":
        res = diffMs / (3600 * 1000);
        break;
      case "minute":
        res = diffMs / (60 * 1000);
        break;
      case "second":
        res = diffMs / 1000;
        break;
      default:
        res = diffMs;
        break;
    }

    return float ? res : Math.trunc(res);
  }

  isSame(other: unknown, unit?: DayjsUnit): boolean {
    const otherCompat =
      other instanceof DayjsCompat
        ? other
        : new DayjsCompat(other as ChroneraInput);
    if (!unit || normalizeUnit(unit) === "millisecond") {
      return this.valueOf() === otherCompat.valueOf();
    }
    return this.startOf(unit).valueOf() === otherCompat.startOf(unit).valueOf();
  }

  isBefore(other: unknown, unit?: DayjsUnit): boolean {
    const otherCompat =
      other instanceof DayjsCompat
        ? other
        : new DayjsCompat(other as ChroneraInput);
    if (!unit || normalizeUnit(unit) === "millisecond") {
      return this.valueOf() < otherCompat.valueOf();
    }
    return this.endOf(unit).valueOf() < otherCompat.startOf(unit).valueOf();
  }

  isAfter(other: unknown, unit?: DayjsUnit): boolean {
    const otherCompat =
      other instanceof DayjsCompat
        ? other
        : new DayjsCompat(other as ChroneraInput);
    if (!unit || normalizeUnit(unit) === "millisecond") {
      return this.valueOf() > otherCompat.valueOf();
    }
    return this.startOf(unit).valueOf() > otherCompat.endOf(unit).valueOf();
  }

  isSameOrBefore(other: unknown, unit?: DayjsUnit): boolean {
    return this.isSame(other, unit) || this.isBefore(other, unit);
  }

  isSameOrAfter(other: unknown, unit?: DayjsUnit): boolean {
    return this.isSame(other, unit) || this.isAfter(other, unit);
  }

  isBetween(
    a: unknown,
    b: unknown,
    unit?: DayjsUnit,
    inclusivity: "()" | "[]" | "[)" | "(]" = "()",
  ): boolean {
    const isStartInclusive = inclusivity[0] === "[";
    const isEndInclusive = inclusivity[1] === "]";
    const startCondition = isStartInclusive
      ? this.isSameOrAfter(a, unit)
      : this.isAfter(a, unit);
    const endCondition = isEndInclusive
      ? this.isSameOrBefore(b, unit)
      : this.isBefore(b, unit);
    return startCondition && endCondition;
  }

  toDate(): Date {
    return this.#chronera.toDate();
  }

  toISOString(): string {
    return this.#chronera.toISOString();
  }

  toJSON(): string {
    return this.toISOString();
  }

  valueOf(): number {
    return this.#chronera.toInstant().epochMilliseconds;
  }

  unix(): number {
    return Math.floor(this.valueOf() / 1000);
  }

  clone(): DayjsCompat {
    return new DayjsCompat(this.#chronera);
  }

  toString(): string {
    return this.toISOString();
  }
}

/**
 * Drop-in factory for Day.js codebases.
 *
 * @example
 * ```ts
 * import { dayjs } from "@intech-software/chronera/compat";
 *
 * const formatted = dayjs("2026-10-13")
 *   .add(3, "day")
 *   .format("YYYY-MM-DD HH:mm");
 * ```
 */
export function dayjs(input?: ChroneraInput): DayjsCompat {
  return new DayjsCompat(input);
}

/**
 * Alias for `dayjs(input)`.
 */
export const dayjsCompat = dayjs;
