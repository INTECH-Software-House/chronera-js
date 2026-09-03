import { ChroneraError } from "../errors/errors.js";

export function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const COMMON_YEAR_MONTH_DAYS = [
  0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
] as const;

export function daysInGregorianMonth(year: number, month: number): number {
  if (month < 1 || month > 12) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Gregorian month must be between 1 and 12; received ${month}.`,
    );
  }

  if (month === 2 && isGregorianLeapYear(year)) {
    return 29;
  }

  const days = COMMON_YEAR_MONTH_DAYS[month];
  if (days === undefined) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Invalid Gregorian month ${month}.`,
    );
  }

  return days;
}

export function parseGregorianMonthCode(monthCode: string): number {
  if (!/^M(0[1-9]|1[0-2])$/.test(monthCode)) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Invalid Gregorian month code: "${monthCode}". Expected format M01 through M12.`,
    );
  }
  return Number.parseInt(monthCode.slice(1), 10);
}

export function formatGregorianMonthCode(month: number): `M${string}` {
  return `M${String(month).padStart(2, "0")}`;
}
