import { ChroneraError } from "../errors/errors.js";

import type { LocalDate, LocalDateTime, LocalTime } from "../public-types.js";

export function localDateTime(date: LocalDate, time: LocalTime): LocalDateTime {
  if (!date || date.kind !== "local-date") {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      "Expected a valid LocalDate.",
    );
  }

  if (!time || time.kind !== "local-time") {
    throw new ChroneraError(
      "CHRONERA_INVALID_TIME",
      "Expected a valid LocalTime.",
    );
  }

  return {
    kind: "local-date-time",
    date,
    time,
  };
}
