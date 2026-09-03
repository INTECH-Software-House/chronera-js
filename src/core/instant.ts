import { ChroneraError } from "../errors/errors.js";
import { requireInteger } from "./integer.js";

import type { Instant } from "../public-types.js";

export const MIN_EPOCH_MILLISECONDS = -62135596800000;
export const MAX_EPOCH_MILLISECONDS = 253402300799999;

export function instantFromEpochMilliseconds(
  epochMilliseconds: number,
): Instant {
  requireInteger("epochMilliseconds", epochMilliseconds);

  if (
    epochMilliseconds < MIN_EPOCH_MILLISECONDS ||
    epochMilliseconds > MAX_EPOCH_MILLISECONDS
  ) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `Epoch milliseconds must be between ${MIN_EPOCH_MILLISECONDS} and ${MAX_EPOCH_MILLISECONDS}; received ${epochMilliseconds}.`,
    );
  }

  return {
    kind: "instant",
    epochMilliseconds,
  };
}

export function instantFromDate(date: Date): Instant {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new ChroneraError(
      "CHRONERA_INVALID_INSTANT",
      "Expected a valid Date object.",
    );
  }

  return instantFromEpochMilliseconds(date.getTime());
}

export function instantFromEpochSeconds(epochSeconds: number): Instant {
  requireInteger("epochSeconds", epochSeconds);
  return instantFromEpochMilliseconds(epochSeconds * 1000);
}
