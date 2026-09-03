import {
  absoluteDayFromGregorianFields,
  gregorianFieldsFromAbsoluteDay,
} from "../../core/absolute-day.js";

/**
 * Converts Persian (Solar Hijri / Jalali) year, month, day to Gregorian year, month, day.
 */
export function persianToGregorianFields(
  jy: number,
  jm: number,
  jd: number,
): { year: number; month: number; day: number } {
  let gy = jy <= 979 ? 621 : 1600;
  let adjJy = jy - (jy <= 979 ? 0 : 979);
  let days =
    365 * adjJy +
    Math.floor(adjJy / 33) * 8 +
    Math.floor(((adjJy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

  gy += 400 * Math.floor(days / 146097);
  days %= 146097;

  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }

  gy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let gd = days + 1;
  const isLeapGreg = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  const sal_a = [
    0,
    31,
    isLeapGreg ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  let gm = 0;
  for (gm = 0; gm < 13 && gd > sal_a[gm]!; gm++) {
    gd -= sal_a[gm]!;
  }

  return { year: gy, month: gm, day: gd };
}

/**
 * Converts Gregorian year, month, day to Persian (Solar Hijri / Jalali) year, month, day.
 */
export function gregorianToPersianFields(
  gy: number,
  gm: number,
  gd: number,
): { year: number; month: number; day: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1]!;

  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;

  jy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }

  return { year: jy, month: jm, day: jd };
}

export function persianToAbsoluteDay(
  year: number,
  month: number,
  day: number,
): number {
  const g = persianToGregorianFields(year, month, day);
  return absoluteDayFromGregorianFields(g.year, g.month, g.day);
}

export function absoluteDayToPersian(absoluteDay: number): {
  year: number;
  month: number;
  day: number;
} {
  const g = gregorianFieldsFromAbsoluteDay(absoluteDay);
  return gregorianToPersianFields(g.year, g.month, g.day);
}

export function isPersianLeapYear(year: number): boolean {
  const day1 = persianToAbsoluteDay(year, 1, 1);
  const dayNext = persianToAbsoluteDay(year + 1, 1, 1);
  return dayNext - day1 === 366;
}

export function daysInPersianMonth(year: number, month: number): number {
  if (month < 1 || month > 12) {
    return 0;
  }
  if (month <= 6) {
    return 31;
  }
  if (month <= 11) {
    return 30;
  }
  return isPersianLeapYear(year) ? 30 : 29;
}
