import { ChroneraError } from "../errors/errors.js";
import { requireInteger } from "./integer.js";

import type { LocalTime } from "../public-types.js";

export function localTime(
  hour: number,
  minute: number,
  second: number = 0,
  millisecond: number = 0,
): LocalTime {
  requireInteger("hour", hour);
  requireInteger("minute", minute);
  requireInteger("second", second);
  requireInteger("millisecond", millisecond);

  if (hour < 0 || hour > 23) {
    throw new ChroneraError(
      "CHRONERA_INVALID_TIME",
      `Hour must be between 0 and 23; received ${hour}.`,
    );
  }

  if (minute < 0 || minute > 59) {
    throw new ChroneraError(
      "CHRONERA_INVALID_TIME",
      `Minute must be between 0 and 59; received ${minute}.`,
    );
  }

  if (second < 0 || second > 59) {
    throw new ChroneraError(
      "CHRONERA_INVALID_TIME",
      `Second must be between 0 and 59; received ${second}.`,
    );
  }

  if (millisecond < 0 || millisecond > 999) {
    throw new ChroneraError(
      "CHRONERA_INVALID_TIME",
      `Millisecond must be between 0 and 999; received ${millisecond}.`,
    );
  }

  return {
    kind: "local-time",
    hour,
    minute,
    second,
    millisecond,
  };
}
