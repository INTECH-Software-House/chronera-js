import { chronera, Chronera, type ChroneraInput } from "../chronera.js";
import { convertDayjsPattern, isDayjsPattern } from "./patterns.js";
import {
  dayjs,
  dayjsCompat,
  DayjsCompat,
  type DayjsUnit,
  type OpUnitType,
} from "./dayjs-compat.js";

export {
  dayjs,
  dayjsCompat,
  DayjsCompat,
  convertDayjsPattern,
  isDayjsPattern,
  type DayjsUnit,
  type OpUnitType,
};

/**
 * Formats a date using Day.js / Moment pattern syntax.
 *
 * @example
 * ```ts
 * formatDayjs("2026-10-13", "YYYY-MM-DD HH:mm:ss"); // "2026-10-13 00:00:00"
 * ```
 */
export function formatDayjs(input: ChroneraInput, pattern: string): string {
  const ldml = convertDayjsPattern(pattern);
  return chronera(input).format(ldml);
}

/**
 * Converts a Day.js instance or Day.js-like object to an immutable `Chronera` instance.
 */
export function fromDayjs(dayjsInstance: unknown): Chronera {
  if (!dayjsInstance) {
    return chronera();
  }
  if (dayjsInstance instanceof Chronera) {
    return dayjsInstance;
  }
  if (dayjsInstance instanceof DayjsCompat) {
    return dayjsInstance.toChronera();
  }
  if (
    typeof dayjsInstance === "object" &&
    dayjsInstance !== null &&
    "toDate" in dayjsInstance &&
    typeof (dayjsInstance as { toDate: () => unknown }).toDate === "function"
  ) {
    const d = (dayjsInstance as { toDate: () => unknown }).toDate();
    return chronera(d as Date);
  }
  return chronera(dayjsInstance as ChroneraInput);
}

/**
 * Converts a Moment instance or Moment-like object to an immutable `Chronera` instance.
 */
export function fromMoment(momentInstance: unknown): Chronera {
  return fromDayjs(momentInstance);
}

/**
 * Converts a Chronera instance to a Day.js object using the provided `dayjs` factory function.
 *
 * @example
 * ```ts
 * import originalDayjs from "dayjs";
 * const d = toDayjs(chroneraDate, originalDayjs);
 * ```
 */
export function toDayjs<T>(
  input: ChroneraInput,
  dayjsFactory: (d: Date) => T,
): T {
  const d = chronera(input).toDate();
  return dayjsFactory(d);
}

/**
 * Converts a Chronera instance to a Moment object using the provided `moment` factory function.
 *
 * @example
 * ```ts
 * import moment from "moment";
 * const m = toMoment(chroneraDate, moment);
 * ```
 */
export function toMoment<T>(
  input: ChroneraInput,
  momentFactory: (d: Date) => T,
): T {
  const d = chronera(input).toDate();
  return momentFactory(d);
}

/**
 * Day.js plugin that adds `.toChronera()` method to any Day.js instance.
 *
 * @example
 * ```ts
 * import dayjs from "dayjs";
 * import { chroneraDayjsPlugin } from "@intech-software/chronera/compat";
 * dayjs.extend(chroneraDayjsPlugin);
 *
 * const c = dayjs("2026-10-13").toChronera();
 * ```
 */
export function chroneraDayjsPlugin(
  _option: unknown,
  dayjsClass: { prototype: Record<string, unknown> },
): void {
  if (dayjsClass && dayjsClass.prototype) {
    dayjsClass.prototype.toChronera = function (this: {
      toDate(): Date;
    }): Chronera {
      return chronera(this.toDate());
    };
  }
}
