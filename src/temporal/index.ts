import { chronera, type Chronera } from "../chronera.js";
import {
  isTemporalSupported,
  isTemporalObject,
  toTemporalPlainDate,
  toTemporalPlainTime,
  toTemporalPlainDateTime,
  toTemporalInstant,
  toTemporalZonedDateTime,
  toTemporalDuration,
  fromTemporalPlainDate,
  fromTemporalPlainTime,
  fromTemporalPlainDateTime,
  fromTemporalInstant,
  fromTemporalZonedDateTime,
  fromTemporalDuration,
  type TemporalPlainDateLike,
  type TemporalPlainTimeLike,
  type TemporalPlainDateTimeLike,
  type TemporalInstantLike,
  type TemporalZonedDateTimeLike,
  type TemporalDurationLike,
  type AnyTemporalLike,
  type TemporalNamespaceLike,
  type ToTemporalOptions,
  type TemporalDateInput,
  type TemporalTimeInput,
} from "../operations/temporal.js";

/**
 * Converts any TC39 `Temporal` date/time object (`PlainDate`, `PlainDateTime`, `PlainTime`, `Instant`, `ZonedDateTime`)
 * or ISO / RFC 9557 IXDTF string into a fluent `Chronera` instance.
 */
export function fromTemporal(
  input:
    | TemporalPlainDateLike
    | TemporalPlainTimeLike
    | TemporalPlainDateTimeLike
    | TemporalInstantLike
    | TemporalZonedDateTimeLike
    | string,
): Chronera {
  return chronera(input);
}

export {
  isTemporalSupported,
  isTemporalObject,
  toTemporalPlainDate,
  toTemporalPlainTime,
  toTemporalPlainDateTime,
  toTemporalInstant,
  toTemporalZonedDateTime,
  toTemporalDuration,
  fromTemporalPlainDate,
  fromTemporalPlainTime,
  fromTemporalPlainDateTime,
  fromTemporalInstant,
  fromTemporalZonedDateTime,
  fromTemporalDuration,
};

export type {
  TemporalPlainDateLike,
  TemporalPlainTimeLike,
  TemporalPlainDateTimeLike,
  TemporalInstantLike,
  TemporalZonedDateTimeLike,
  TemporalDurationLike,
  AnyTemporalLike,
  TemporalNamespaceLike,
  ToTemporalOptions,
  TemporalDateInput,
  TemporalTimeInput,
};

/**
 * Unified TC39 `Temporal` Interop Bridge namespace.
 */
export const temporal = {
  /** Checks whether a native TC39 `Temporal` runtime is available on `globalThis.Temporal`. */
  isSupported: isTemporalSupported,
  /** Type guard checking if a value is a `Temporal` object or structural `Temporal*Like`. */
  isTemporalObject,
  /** Converts input into `Temporal.PlainDate` (or structural `TemporalPlainDateLike`). */
  toPlainDate: toTemporalPlainDate,
  /** Converts input into `Temporal.PlainTime` (or structural `TemporalPlainTimeLike`). */
  toPlainTime: toTemporalPlainTime,
  /** Converts input into `Temporal.PlainDateTime` (or structural `TemporalPlainDateTimeLike`). */
  toPlainDateTime: toTemporalPlainDateTime,
  /** Converts input into `Temporal.Instant` (or structural `TemporalInstantLike`). */
  toInstant: toTemporalInstant,
  /** Converts input into `Temporal.ZonedDateTime` (or structural `TemporalZonedDateTimeLike`). */
  toZonedDateTime: toTemporalZonedDateTime,
  /** Converts input into `Temporal.Duration` (or structural `TemporalDurationLike`). */
  toDuration: toTemporalDuration,
  /** Converts `Temporal.PlainDate` into Chronera `LocalDate`. */
  fromPlainDate: fromTemporalPlainDate,
  /** Converts `Temporal.PlainTime` into Chronera `LocalTime`. */
  fromPlainTime: fromTemporalPlainTime,
  /** Converts `Temporal.PlainDateTime` into Chronera `LocalDateTime`. */
  fromPlainDateTime: fromTemporalPlainDateTime,
  /** Converts `Temporal.Instant` into Chronera `Instant`. */
  fromInstant: fromTemporalInstant,
  /** Converts `Temporal.ZonedDateTime` into Chronera `ZonedDateTime`. */
  fromZonedDateTime: fromTemporalZonedDateTime,
  /** Converts `Temporal.Duration` into Chronera `Duration`. */
  fromDuration: fromTemporalDuration,
  /** Converts any `Temporal` date/time object into a fluent `Chronera` instance. */
  from: fromTemporal,
} as const;
