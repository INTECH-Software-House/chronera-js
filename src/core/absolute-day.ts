import { ChroneraError } from "../errors/errors.js";

export const MIN_ABSOLUTE_DAY = -719162;
export const MAX_ABSOLUTE_DAY = 2932896;

const DAY_OFFSET = 719468;

export function absoluteDayFromGregorianFields(
  year: number,
  month: number,
  day: number,
): number {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y >= 0 ? y / 400 : (y - 399) / 400);
  const yoe = y - era * 400;
  const doy =
    Math.floor((153 * (month > 2 ? month - 3 : month + 9) + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  const absoluteDay = era * 146097 + doe - DAY_OFFSET;

  if (absoluteDay < MIN_ABSOLUTE_DAY || absoluteDay > MAX_ABSOLUTE_DAY) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `Date ${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} is outside supported absolute day range [${MIN_ABSOLUTE_DAY}, ${MAX_ABSOLUTE_DAY}].`,
    );
  }

  return absoluteDay;
}

export function gregorianFieldsFromAbsoluteDay(absoluteDay: number): {
  year: number;
  month: number;
  day: number;
} {
  if (
    !Number.isSafeInteger(absoluteDay) ||
    absoluteDay < MIN_ABSOLUTE_DAY ||
    absoluteDay > MAX_ABSOLUTE_DAY
  ) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `Absolute day ${absoluteDay} is outside supported range [${MIN_ABSOLUTE_DAY}, ${MAX_ABSOLUTE_DAY}].`,
    );
  }

  const z = absoluteDay + DAY_OFFSET;
  const era = Math.floor(z >= 0 ? z / 146097 : (z - 146096) / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor(
    (doe -
      Math.floor(doe / 1460) +
      Math.floor(doe / 36524) -
      Math.floor(doe / 146096)) /
      365,
  );
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp < 10 ? mp + 3 : mp - 9;
  const year = month <= 2 ? y + 1 : y;

  return { year, month, day };
}
