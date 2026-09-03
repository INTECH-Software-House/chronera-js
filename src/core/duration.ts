import { ChroneraError } from "../errors/errors.js";
import { requireInteger } from "./integer.js";

import type { Duration } from "../public-types.js";

export function duration(init: Duration): Duration {
  let hasPositive = false;
  let hasNegative = false;

  const fields: (keyof Duration)[] = [
    "years",
    "months",
    "weeks",
    "days",
    "hours",
    "minutes",
    "seconds",
    "milliseconds",
  ];

  for (const field of fields) {
    const val = init[field];
    if (val !== undefined) {
      requireInteger(field, val);
      if (val > 0) hasPositive = true;
      if (val < 0) hasNegative = true;
    }
  }

  if (hasPositive && hasNegative) {
    throw new ChroneraError(
      "CHRONERA_INCOMPATIBLE_OPTION",
      "Mixed-sign duration fields are not supported.",
    );
  }

  return { ...init };
}
