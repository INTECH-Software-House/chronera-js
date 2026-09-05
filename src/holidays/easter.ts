import { createLocalDate } from "../core/local-date.js";
import { addDays } from "../operations/convenience.js";

import type { LocalDate } from "../public-types.js";

/**
 * Calculates Easter Sunday for any Gregorian year using the anonymous Meeus/Jones/Butcher algorithm.
 * 100% deterministic integer arithmetic with zero external dependencies.
 * Reference: Jean Meeus, Astronomical Algorithms (1991), p. 67.
 */
export function calculateEasterSunday(year: number): LocalDate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return createLocalDate(year, month, day);
}

/**
 * Returns Good Friday for the specified year (Easter Sunday - 2 days).
 */
export function calculateGoodFriday(year: number): LocalDate {
  return addDays(calculateEasterSunday(year), -2);
}

/**
 * Returns Easter Monday for the specified year (Easter Sunday + 1 day).
 */
export function calculateEasterMonday(year: number): LocalDate {
  return addDays(calculateEasterSunday(year), 1);
}

/**
 * Returns Ascension Day for the specified year (Easter Sunday + 39 days).
 */
export function calculateAscensionDay(year: number): LocalDate {
  return addDays(calculateEasterSunday(year), 39);
}

/**
 * Returns Whit Monday / Pentecost Monday for the specified year (Easter Sunday + 50 days).
 */
export function calculateWhitMonday(year: number): LocalDate {
  return addDays(calculateEasterSunday(year), 50);
}
