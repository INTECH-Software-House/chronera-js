import { ChroneraError } from "../errors/errors.js";
import { localDate } from "../core/local-date.js";
import { dateRange } from "../core/range.js";
import { daysInGregorianMonth } from "../core/gregorian-math.js";
import {
  absoluteDayFromGregorianFields,
  gregorianFieldsFromAbsoluteDay,
} from "../core/absolute-day.js";
import type { DateRange, Instant, LocalDate } from "../public-types.js";

export interface FinancialPeriodsOptions {
  /**
   * The month (1-12) when the fiscal year starts.
   * - 1: Calendar Year (default)
   * - 4: United Kingdom, Japan, India (Apr 1)
   * - 7: Australia (Jul 1)
   * - 10: United States Federal, Thailand Government (Oct 1)
   */
  readonly fiscalYearStartMonth?: number;
}

export interface FinancialPeriodsResult {
  readonly mtd: DateRange<LocalDate>;
  readonly qtd: DateRange<LocalDate>;
  readonly ytd: DateRange<LocalDate>;
  readonly ltm: DateRange<LocalDate>;
  readonly currentMonth: DateRange<LocalDate>;
  readonly previousMonth: DateRange<LocalDate>;
  readonly currentQuarter: DateRange<LocalDate>;
  readonly previousQuarter: DateRange<LocalDate>;
  readonly currentFiscalYear: DateRange<LocalDate>;
  readonly previousFiscalYear: DateRange<LocalDate>;
  readonly fiscalQuarterNumber: 1 | 2 | 3 | 4;
  readonly fiscalYear: number;
}

function toLocalDate(input?: Date | Instant | LocalDate | null): LocalDate {
  if (!input) {
    const d = new Date();
    return localDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }
  if (input instanceof Date) {
    return localDate(
      input.getFullYear(),
      input.getMonth() + 1,
      input.getDate(),
    );
  }
  if (typeof input === "object" && input !== null && "kind" in input) {
    if (input.kind === "local-date") return input as LocalDate;
    if (input.kind === "instant") {
      const d = new Date((input as Instant).epochMilliseconds);
      return localDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    }
  }
  throw new ChroneraError(
    "CHRONERA_INVALID_DATE",
    "Expected valid Date, Instant, or LocalDate",
  );
}

export function financialPeriods(
  referenceDateInput?: Date | Instant | LocalDate,
  options?: FinancialPeriodsOptions,
): FinancialPeriodsResult {
  const ref = toLocalDate(referenceDateInput);
  const startMonth = options?.fiscalYearStartMonth ?? 1;

  if (startMonth < 1 || startMonth > 12) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `fiscalYearStartMonth must be between 1 and 12, received ${startMonth}`,
    );
  }

  const curYear = ref.year;
  const curMonth = ref.month;
  const curDay = ref.day;

  // 1. MTD: from 1st of month to ref
  const mtdStart = localDate(curYear, curMonth, 1);
  const mtd = dateRange(mtdStart, ref);

  // Full current month
  const daysInCurM = daysInGregorianMonth(curYear, curMonth);
  const currentMonth = dateRange(
    mtdStart,
    localDate(curYear, curMonth, daysInCurM),
  );

  // Full previous month
  const prevMonthYear = curMonth === 1 ? curYear - 1 : curYear;
  const prevMonthNum = curMonth === 1 ? 12 : curMonth - 1;
  const daysInPrevM = daysInGregorianMonth(prevMonthYear, prevMonthNum);
  const previousMonth = dateRange(
    localDate(prevMonthYear, prevMonthNum, 1),
    localDate(prevMonthYear, prevMonthNum, daysInPrevM),
  );

  // 2. Fiscal Year & Quarters
  // Determine fiscal year start
  let fiscalYearStartYear: number;
  if (startMonth === 1) {
    fiscalYearStartYear = curYear;
  } else if (curMonth >= startMonth) {
    fiscalYearStartYear = curYear;
  } else {
    fiscalYearStartYear = curYear - 1;
  }

  const fiscalYearStartDate = localDate(fiscalYearStartYear, startMonth, 1);
  const fiscalYearEndYear = fiscalYearStartYear + 1;
  const fiscalYearEndMonth = startMonth === 1 ? 12 : startMonth - 1;
  const daysInFyEndMonth = daysInGregorianMonth(
    startMonth === 1 ? fiscalYearStartYear : fiscalYearEndYear,
    fiscalYearEndMonth,
  );
  const fiscalYearEndDate = localDate(
    startMonth === 1 ? fiscalYearStartYear : fiscalYearEndYear,
    fiscalYearEndMonth,
    daysInFyEndMonth,
  );

  const fiscalYear = startMonth === 1 ? curYear : fiscalYearStartYear + 1;
  const currentFiscalYear = dateRange(fiscalYearStartDate, fiscalYearEndDate);

  // Previous Fiscal Year
  const prevFyStartYear = fiscalYearStartYear - 1;
  const prevFyStartDate = localDate(prevFyStartYear, startMonth, 1);
  const prevFyEndYear = fiscalYearStartYear;
  const prevFyEndDate = localDate(
    startMonth === 1 ? prevFyStartYear : prevFyEndYear,
    fiscalYearEndMonth,
    daysInGregorianMonth(
      startMonth === 1 ? prevFyStartYear : prevFyEndYear,
      fiscalYearEndMonth,
    ),
  );
  const previousFiscalYear = dateRange(prevFyStartDate, prevFyEndDate);

  // YTD: from fiscal year start date to ref
  const ytd = dateRange(fiscalYearStartDate, ref);

  // Fiscal Quarter determination (Q1..Q4)
  const monthOffset = (curMonth - startMonth + 12) % 12; // 0..11
  const quarterIndex = Math.floor(monthOffset / 3); // 0..3
  const fiscalQuarterNumber = (quarterIndex + 1) as 1 | 2 | 3 | 4;

  const qStartMonthOffset = quarterIndex * 3;
  const qStartMonthRaw = startMonth + qStartMonthOffset;
  const qStartYear =
    fiscalYearStartYear + Math.floor((qStartMonthRaw - 1) / 12);
  const qStartMonth = ((qStartMonthRaw - 1) % 12) + 1;
  const qtdStartDate = localDate(qStartYear, qStartMonth, 1);

  // QTD: from quarter start to ref
  const qtd = dateRange(qtdStartDate, ref);

  // Full Current Quarter
  const qEndMonthRaw = qStartMonthRaw + 2;
  const qEndYear = fiscalYearStartYear + Math.floor((qEndMonthRaw - 1) / 12);
  const qEndMonth = ((qEndMonthRaw - 1) % 12) + 1;
  const daysInQEnd = daysInGregorianMonth(qEndYear, qEndMonth);
  const currentQuarter = dateRange(
    qtdStartDate,
    localDate(qEndYear, qEndMonth, daysInQEnd),
  );

  // Full Previous Quarter
  const prevQIndex = (quarterIndex + 3) % 4;
  const prevQStartMonthOffset = prevQIndex * 3;
  const prevQStartYearBase =
    quarterIndex === 0 ? fiscalYearStartYear - 1 : fiscalYearStartYear;
  const prevQStartMonthRaw = startMonth + prevQStartMonthOffset;
  const prevQStartYear =
    prevQStartYearBase + Math.floor((prevQStartMonthRaw - 1) / 12);
  const prevQStartMonth = ((prevQStartMonthRaw - 1) % 12) + 1;
  const prevQEndMonthRaw = prevQStartMonthRaw + 2;
  const prevQEndYear =
    prevQStartYearBase + Math.floor((prevQEndMonthRaw - 1) / 12);
  const prevQEndMonth = ((prevQEndMonthRaw - 1) % 12) + 1;
  const daysInPrevQEnd = daysInGregorianMonth(prevQEndYear, prevQEndMonth);
  const previousQuarter = dateRange(
    localDate(prevQStartYear, prevQStartMonth, 1),
    localDate(prevQEndYear, prevQEndMonth, daysInPrevQEnd),
  );

  // 3. LTM (Last Twelve Months): from 1 year prior to ref
  const ltmYear = curYear - 1;
  const ltmDaysInMonth = daysInGregorianMonth(ltmYear, curMonth);
  const ltmDay = Math.min(curDay, ltmDaysInMonth);
  const ltmStartDate = localDate(ltmYear, curMonth, ltmDay);
  const ltm = dateRange(ltmStartDate, ref);

  return {
    mtd,
    qtd,
    ytd,
    ltm,
    currentMonth,
    previousMonth,
    currentQuarter,
    previousQuarter,
    currentFiscalYear,
    previousFiscalYear,
    fiscalQuarterNumber,
    fiscalYear,
  };
}

/**
 * Returns the exact same period from the prior year (YoY comparison).
 * Handles leap years (Feb 29 -> Feb 28).
 */
export function priorYearSamePeriod(
  range: DateRange<LocalDate>,
): DateRange<LocalDate> {
  const s = range.start;
  const e = range.end;

  const startYear = s.year - 1;
  const startDay = Math.min(s.day, daysInGregorianMonth(startYear, s.month));
  const newStart = localDate(startYear, s.month, startDay);

  const endYear = e.year - 1;
  const endDay = Math.min(e.day, daysInGregorianMonth(endYear, e.month));
  const newEnd = localDate(endYear, e.month, endDay);

  return dateRange(newStart, newEnd, range.startInclusive, range.endInclusive);
}

/**
 * Returns the immediately preceding period of equal length (Sequential comparison, e.g. prior N days).
 */
export function priorPeriod(range: DateRange<LocalDate>): DateRange<LocalDate> {
  const startAbs = absoluteDayFromGregorianFields(
    range.start.year,
    range.start.month,
    range.start.day,
  );
  const endAbs = absoluteDayFromGregorianFields(
    range.end.year,
    range.end.month,
    range.end.day,
  );
  const lengthDays = endAbs - startAbs;

  const newEndAbs = startAbs - 1;
  const newStartAbs = newEndAbs - lengthDays;

  const sFields = gregorianFieldsFromAbsoluteDay(newStartAbs);
  const eFields = gregorianFieldsFromAbsoluteDay(newEndAbs);

  return dateRange(
    localDate(sFields.year, sFields.month, sFields.day),
    localDate(eFields.year, eFields.month, eFields.day),
    range.startInclusive,
    range.endInclusive,
  );
}

/**
 * Checks whether a given date falls within the Year-to-Date (YTD) window of a reference date.
 */
export function isYTD(
  date: LocalDate | Date | Instant,
  referenceDateInput?: Date | Instant | LocalDate,
  options?: FinancialPeriodsOptions,
): boolean {
  const target = toLocalDate(date);
  const periods = financialPeriods(referenceDateInput, options);
  const targetAbs = absoluteDayFromGregorianFields(
    target.year,
    target.month,
    target.day,
  );
  const ytdStartAbs = absoluteDayFromGregorianFields(
    periods.ytd.start.year,
    periods.ytd.start.month,
    periods.ytd.start.day,
  );
  const ytdEndAbs = absoluteDayFromGregorianFields(
    periods.ytd.end.year,
    periods.ytd.end.month,
    periods.ytd.end.day,
  );

  return targetAbs >= ytdStartAbs && targetAbs <= ytdEndAbs;
}
