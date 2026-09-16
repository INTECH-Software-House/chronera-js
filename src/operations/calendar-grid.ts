import { ChroneraError } from "../errors/errors.js";
import { absoluteDayFromGregorianFields } from "../core/absolute-day.js";
import { daysInGregorianMonth } from "../core/gregorian-math.js";
import { getIsoWeekFromAbsoluteDay } from "../core/iso-week.js";
import { localDate } from "../core/local-date.js";
import type { LocalDate } from "../public-types.js";

export type WeekStartDay = "monday" | "sunday";
export type WeekdayHeaderFormat = "short" | "narrow" | "long";

export interface MonthGridOptions {
  readonly weekStartsOn?: WeekStartDay;
  readonly includePaddingDays?: boolean;
  readonly fixedSixWeeks?: boolean;
  readonly referenceDate?: LocalDate;
}

export interface CalendarGridCell {
  readonly date: LocalDate;
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  readonly isCurrentMonth: boolean;
  readonly isWeekend: boolean;
  readonly isToday: boolean;
  readonly weekNumber: number;
}

export interface MonthGridResult {
  readonly year: number;
  readonly month: number;
  readonly weeks: CalendarGridCell[][];
  readonly totalDays: number;
  readonly startPaddingCount: number;
  readonly endPaddingCount: number;
}

function getTodayLocalDate(): LocalDate {
  const now = new Date();
  return localDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function generateMonthGrid(
  year: number,
  month: number,
  options?: MonthGridOptions,
): MonthGridResult {
  if (year < 1 || year > 9999) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `Year must be between 1 and 9999; received ${year}.`,
    );
  }
  if (month < 1 || month > 12) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `Month must be between 1 and 12; received ${month}.`,
    );
  }

  const weekStartsOn = options?.weekStartsOn ?? "monday";
  const includePaddingDays = options?.includePaddingDays ?? true;
  const fixedSixWeeks = options?.fixedSixWeeks ?? false;
  const refDate = options?.referenceDate ?? getTodayLocalDate();

  const daysInCurMonth = daysInGregorianMonth(year, month);
  const firstDayAbs = absoluteDayFromGregorianFields(year, month, 1);
  const firstDayIsoDow = getIsoWeekFromAbsoluteDay(firstDayAbs).dayOfWeek; // 1=Mon..7=Sun

  // Calculate leading padding days
  // If weekStartsOn === 'monday': Mon=0, Tue=1, ..., Sun=6
  // If weekStartsOn === 'sunday': Sun=0, Mon=1, ..., Sat=6
  let startPaddingCount = 0;
  if (weekStartsOn === "monday") {
    startPaddingCount = firstDayIsoDow - 1; // Mon(1)->0, Sun(7)->6
  } else {
    startPaddingCount = firstDayIsoDow === 7 ? 0 : firstDayIsoDow; // Sun(7)->0, Mon(1)->1
  }

  const totalCurMonthCells = startPaddingCount + daysInCurMonth;
  let totalWeeks = Math.ceil(totalCurMonthCells / 7);
  if (fixedSixWeeks) {
    totalWeeks = 6;
  }
  const totalCellsNeeded = totalWeeks * 7;
  const endPaddingCount =
    totalCellsNeeded - (startPaddingCount + daysInCurMonth);

  const cells: CalendarGridCell[] = [];

  // 1. Leading padding cells (previous month)
  if (startPaddingCount > 0) {
    const { prev } = getAdjacentMonths(year, month);
    const prevMonthDays = daysInGregorianMonth(prev.year, prev.month);
    for (let i = startPaddingCount - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const absDay = absoluteDayFromGregorianFields(prev.year, prev.month, day);
      const isoInfo = getIsoWeekFromAbsoluteDay(absDay);
      const dayOfWeek = isoInfo.dayOfWeek === 7 ? 0 : isoInfo.dayOfWeek;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const cellDate = localDate(prev.year, prev.month, day);
      const isToday =
        cellDate.year === refDate.year &&
        cellDate.month === refDate.month &&
        cellDate.day === refDate.day;

      if (includePaddingDays) {
        cells.push({
          date: cellDate,
          year: prev.year,
          month: prev.month,
          day,
          dayOfWeek,
          isCurrentMonth: false,
          isWeekend,
          isToday,
          weekNumber: isoInfo.weekNumber,
        });
      } else {
        // Placeholder with null-like empty cell representation or edge-adjusted
        cells.push({
          date: cellDate,
          year: prev.year,
          month: prev.month,
          day,
          dayOfWeek,
          isCurrentMonth: false,
          isWeekend,
          isToday,
          weekNumber: isoInfo.weekNumber,
        });
      }
    }
  }

  // 2. Current month cells
  for (let day = 1; day <= daysInCurMonth; day++) {
    const absDay = absoluteDayFromGregorianFields(year, month, day);
    const isoInfo = getIsoWeekFromAbsoluteDay(absDay);
    const dayOfWeek = isoInfo.dayOfWeek === 7 ? 0 : isoInfo.dayOfWeek;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const cellDate = localDate(year, month, day);
    const isToday =
      cellDate.year === refDate.year &&
      cellDate.month === refDate.month &&
      cellDate.day === refDate.day;

    cells.push({
      date: cellDate,
      year,
      month,
      day,
      dayOfWeek,
      isCurrentMonth: true,
      isWeekend,
      isToday,
      weekNumber: isoInfo.weekNumber,
    });
  }

  // 3. Trailing padding cells (next month)
  if (endPaddingCount > 0) {
    const { next } = getAdjacentMonths(year, month);
    for (let day = 1; day <= endPaddingCount; day++) {
      const absDay = absoluteDayFromGregorianFields(next.year, next.month, day);
      const isoInfo = getIsoWeekFromAbsoluteDay(absDay);
      const dayOfWeek = isoInfo.dayOfWeek === 7 ? 0 : isoInfo.dayOfWeek;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const cellDate = localDate(next.year, next.month, day);
      const isToday =
        cellDate.year === refDate.year &&
        cellDate.month === refDate.month &&
        cellDate.day === refDate.day;

      cells.push({
        date: cellDate,
        year: next.year,
        month: next.month,
        day,
        dayOfWeek,
        isCurrentMonth: false,
        isWeekend,
        isToday,
        weekNumber: isoInfo.weekNumber,
      });
    }
  }

  // Chunk into weeks
  const weeks: CalendarGridCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return {
    year,
    month,
    weeks,
    totalDays: daysInCurMonth,
    startPaddingCount,
    endPaddingCount,
  };
}

export function getMonthMatrix(
  year: number,
  month: number,
  options?: MonthGridOptions,
): CalendarGridCell[][] {
  return generateMonthGrid(year, month, options).weeks;
}

export function generateYearGrid(
  year: number,
  options?: MonthGridOptions,
): MonthGridResult[] {
  const result: MonthGridResult[] = [];
  for (let m = 1; m <= 12; m++) {
    result.push(generateMonthGrid(year, m, options));
  }
  return result;
}

export function getAdjacentMonths(
  year: number,
  month: number,
): {
  prev: { year: number; month: number };
  next: { year: number; month: number };
} {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return {
    prev: { year: prevYear, month: prevMonth },
    next: { year: nextYear, month: nextMonth },
  };
}

/**
 * Returns localized weekday header labels (e.g. ['จ.', 'อ.', ...])
 */
export function getWeekDaysHeader(
  locale = "en",
  format: WeekdayHeaderFormat = "short",
  weekStartsOn: WeekStartDay = "monday",
): string[] {
  const dtf = new Intl.DateTimeFormat(locale, { weekday: format });
  // Reference known week: 2026-09-07 is Monday, 2026-09-13 is Sunday
  // Sunday = 2026-09-06 (or 2026-09-13)
  const mondayDates: Date[] = [
    new Date(Date.UTC(2026, 8, 7)), // Mon
    new Date(Date.UTC(2026, 8, 8)), // Tue
    new Date(Date.UTC(2026, 8, 9)), // Wed
    new Date(Date.UTC(2026, 8, 10)), // Thu
    new Date(Date.UTC(2026, 8, 11)), // Fri
    new Date(Date.UTC(2026, 8, 12)), // Sat
    new Date(Date.UTC(2026, 8, 13)), // Sun
  ];

  const sundayDates: Date[] = [
    new Date(Date.UTC(2026, 8, 13)), // Sun
    new Date(Date.UTC(2026, 8, 7)), // Mon
    new Date(Date.UTC(2026, 8, 8)), // Tue
    new Date(Date.UTC(2026, 8, 9)), // Wed
    new Date(Date.UTC(2026, 8, 10)), // Thu
    new Date(Date.UTC(2026, 8, 11)), // Fri
    new Date(Date.UTC(2026, 8, 12)), // Sat
  ];

  const dates = weekStartsOn === "sunday" ? sundayDates : mondayDates;
  return dates.map((d) => dtf.format(d));
}
