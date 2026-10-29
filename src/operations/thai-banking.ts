import { localDate } from "../core/local-date.js";
import { isGregorianLeapYear } from "../core/gregorian-math.js";
import { ChroneraError } from "../errors/errors.js";
import { addDays, addMonths, diffInDays, endOfMonth } from "./convenience.js";
import { isBankBusinessDay, isBusinessDay } from "./business-days.js";
import { resolveThaiLocalDate, type ThaiDateInput } from "./thai-fiscal.js";

import type { CountryCode } from "../holidays/types.js";
import type { LocalDate } from "../public-types.js";

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

/**
 * Financial Day-Count Conventions used in Thai commercial banking (BOT) and international bond markets:
 * - `"ACT/365"` (or `"ACT/365F"`): Actual/365 Fixed — Standard Thai commercial bank convention for loans & deposits.
 * - `"ACT/360"`: Actual/360 — Money market and commercial paper convention.
 * - `"ACT/ACT"`: Actual/Actual (ISDA) — Government bond & debenture convention (splits leap-year days / 366 and normal-year days / 365).
 * - `"30/360"`: 30/360 Bond Basis (US/ICMA) — Assumes 30-day months and 360-day year.
 */
export type DayCountConvention =
  "ACT/365" | "ACT/365F" | "ACT/360" | "ACT/ACT" | "30/360";

/**
 * Business Day Roll Conventions for financial settlement and maturity dates:
 * - `"following"`: Roll forward to the next business day.
 * - `"modified-following"`: Roll forward to the next business day unless it crosses into the next calendar month, in which case roll backward to the last business day of the same month.
 * - `"preceding"`: Roll backward to the previous business day.
 * - `"unadjusted"`: Do not adjust for holidays or weekends.
 */
export type BusinessDayConvention =
  "following" | "modified-following" | "preceding" | "unadjusted";

export interface DayCountResult {
  readonly startDate: LocalDate;
  readonly endDate: LocalDate;
  readonly days: number;
  readonly denominator: 365 | 360 | "ISDA";
  readonly yearFraction: number;
  readonly convention: DayCountConvention;
}

export interface AccruedInterestOptions {
  /** Principal amount (e.g. in THB). */
  readonly principal: number;
  /**
   * Annual interest rate as a decimal (e.g. `0.05` for 5% p.a.).
   * Must be >= 0.
   */
  readonly annualRate: number;
  /** Accrual start date (inclusive). */
  readonly startDate: ThaiDateInput;
  /** Accrual end date (exclusive). */
  readonly endDate: ThaiDateInput;
  /** Day-count convention. Defaults to `"ACT/365"` (Bank of Thailand standard). */
  readonly convention?: DayCountConvention;
  /**
   * Optional withholding tax rate as a decimal (e.g. `0.15` for 15% WHT on deposit interest, or `0.01` for 1% corporate WHT).
   * Defaults to `0`.
   */
  readonly withholdingTaxRate?: number;
}

export interface AccruedInterestResult extends DayCountResult {
  readonly principal: number;
  readonly annualRate: number;
  readonly grossInterest: number;
  readonly withholdingTax: number;
  readonly netInterest: number;
}

export type CreditTermPreset =
  | "NET7"
  | "NET15"
  | "NET30"
  | "NET45"
  | "NET60"
  | "NET90"
  | "EOM"
  | "EOM+15"
  | "EOM+30"
  | "EOM+45"
  | "EOM+60";

export type CreditTermInput =
  | CreditTermPreset
  | { readonly type: "NET"; readonly days: number }
  | { readonly type: "EOM"; readonly plusDays?: number };

export interface PaymentDueDateOptions {
  /**
   * Optional monthly billing cut-off day (1–28).
   * If the invoice day is strictly after `billingCutOffDay`, the billing baseline rolls to the 1st of the next month.
   */
  readonly billingCutOffDay?: number;
  /**
   * Business day roll convention when the due date falls on a weekend or holiday.
   * Defaults to `"following"`.
   */
  readonly rollConvention?: BusinessDayConvention;
  /**
   * Holiday calendar identifier (`"TH-BOT"` for Bank of Thailand, `"TH"` for civil, or country code).
   * Defaults to `"TH-BOT"`.
   */
  readonly calendar?: string;
}

export interface PaymentDueDateResult {
  readonly invoiceDate: LocalDate;
  readonly billingBaseDate: LocalDate;
  readonly rawDueDate: LocalDate;
  readonly adjustedDueDate: LocalDate;
  readonly isAdjusted: boolean;
  readonly creditDays: number;
  readonly termDescription: string;
}

// ---------------------------------------------------------------------------
// Business Day Roll Convention Engine
// ---------------------------------------------------------------------------

function checkOpenDay(date: LocalDate, calendar: string): boolean {
  if (calendar === "TH-BOT" || calendar === "TH-BANK") {
    return isBankBusinessDay(date, "TH-BOT");
  }
  return isBusinessDay(date, { holidays: calendar as CountryCode });
}

/**
 * Adjusts a date according to financial Business Day Conventions (`"following"`, `"modified-following"`, `"preceding"`, `"unadjusted"`).
 *
 * Defaults to `"modified-following"` under the Bank of Thailand (`"TH-BOT"`) settlement calendar.
 */
export function adjustBusinessDate(
  input: ThaiDateInput,
  convention: BusinessDayConvention = "modified-following",
  calendar: string = "TH-BOT",
): LocalDate {
  const start = resolveThaiLocalDate(input);
  if (convention === "unadjusted" || checkOpenDay(start, calendar)) {
    return start;
  }

  if (convention === "following") {
    let curr = start;
    while (!checkOpenDay(curr, calendar)) {
      curr = addDays(curr, 1);
    }
    return curr;
  }

  if (convention === "preceding") {
    let curr = start;
    while (!checkOpenDay(curr, calendar)) {
      curr = addDays(curr, -1);
    }
    return curr;
  }

  // "modified-following": roll forward unless it crosses into the next calendar month
  let forward = start;
  while (!checkOpenDay(forward, calendar)) {
    forward = addDays(forward, 1);
  }
  if (forward.month === start.month && forward.year === start.year) {
    return forward;
  }

  let backward = start;
  while (!checkOpenDay(backward, calendar)) {
    backward = addDays(backward, -1);
  }
  return backward;
}

// ---------------------------------------------------------------------------
// Financial Day-Count & Interest Accrual Engine
// ---------------------------------------------------------------------------

function calculate30_360Days(start: LocalDate, end: LocalDate): number {
  const d1 = start.day === 31 ? 30 : start.day;
  const d2 = end.day === 31 && d1 === 30 ? 30 : end.day;
  return (
    360 * (end.year - start.year) + 30 * (end.month - start.month) + (d2 - d1)
  );
}

function calculateActActIsdaFraction(start: LocalDate, end: LocalDate): number {
  if (start.year === end.year) {
    const days = diffInDays(end, start);
    const denom = isGregorianLeapYear(start.year) ? 366 : 365;
    return days / denom;
  }

  let fraction = 0;
  for (let y = start.year; y <= end.year; y++) {
    const segStart = y === start.year ? start : localDate(y, 1, 1);
    const segEnd = y === end.year ? end : localDate(y + 1, 1, 1);
    const segDays = diffInDays(segEnd, segStart);
    const denom = isGregorianLeapYear(y) ? 366 : 365;
    fraction += segDays / denom;
  }
  return fraction;
}

/**
 * Calculates the financial day count and year fraction between two dates according to
 * `"ACT/365"` (Thai banking standard), `"ACT/360"`, `"ACT/ACT"` (ISDA), or `"30/360"`.
 */
export function calculateDayCountFraction(
  startDateInput: ThaiDateInput,
  endDateInput: ThaiDateInput,
  convention: DayCountConvention = "ACT/365",
): DayCountResult {
  const startDate = resolveThaiLocalDate(startDateInput);
  const endDate = resolveThaiLocalDate(endDateInput);

  const actualDays = diffInDays(endDate, startDate);
  if (actualDays < 0) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `End date (${endDate.year}-${endDate.month}-${endDate.day}) must not be before start date (${startDate.year}-${startDate.month}-${startDate.day}).`,
    );
  }

  switch (convention) {
    case "ACT/365":
    case "ACT/365F":
      return {
        startDate,
        endDate,
        days: actualDays,
        denominator: 365,
        yearFraction: actualDays / 365,
        convention,
      };

    case "ACT/360":
      return {
        startDate,
        endDate,
        days: actualDays,
        denominator: 360,
        yearFraction: actualDays / 360,
        convention,
      };

    case "ACT/ACT":
      return {
        startDate,
        endDate,
        days: actualDays,
        denominator: "ISDA",
        yearFraction: calculateActActIsdaFraction(startDate, endDate),
        convention,
      };

    case "30/360": {
      const days30 = calculate30_360Days(startDate, endDate);
      return {
        startDate,
        endDate,
        days: days30,
        denominator: 360,
        yearFraction: days30 / 360,
        convention,
      };
    }
  }
}

/**
 * Computes accrued interest (gross, withholding tax, and net interest in THB)
 * for loans, deposits, or bonds using standard financial day-count conventions.
 */
export function calculateAccruedInterest(
  options: AccruedInterestOptions,
): AccruedInterestResult {
  const {
    principal,
    annualRate,
    startDate,
    endDate,
    convention = "ACT/365",
    withholdingTaxRate = 0,
  } = options;

  if (!Number.isFinite(principal) || principal < 0) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      "Principal amount must be a non-negative finite number.",
    );
  }
  if (!Number.isFinite(annualRate) || annualRate < 0) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      "Annual interest rate must be a non-negative finite number.",
    );
  }
  if (
    !Number.isFinite(withholdingTaxRate) ||
    withholdingTaxRate < 0 ||
    withholdingTaxRate > 1
  ) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      "Withholding tax rate must be between 0 and 1.",
    );
  }

  const dc = calculateDayCountFraction(startDate, endDate, convention);
  const rawGross = principal * annualRate * dc.yearFraction;
  const grossInterest = Math.round(rawGross * 100) / 100;
  const withholdingTax =
    Math.round(grossInterest * withholdingTaxRate * 100) / 100;
  const netInterest = Math.round((grossInterest - withholdingTax) * 100) / 100;

  return {
    ...dc,
    principal,
    annualRate,
    grossInterest,
    withholdingTax,
    netInterest,
  };
}

// ---------------------------------------------------------------------------
// Commercial Credit Terms & Payment Due Date Engine
// ---------------------------------------------------------------------------

function normalizeCreditTerm(term: CreditTermInput): {
  readonly type: "NET" | "EOM";
  readonly days: number;
  readonly description: string;
} {
  if (typeof term === "string") {
    const upper = term.trim().toUpperCase();
    if (upper === "EOM") {
      return { type: "EOM", days: 0, description: "End of Month (EOM)" };
    }
    const eomMatch = /^EOM\+(\d+)$/.exec(upper);
    if (eomMatch) {
      const d = Number.parseInt(eomMatch[1]!, 10);
      return {
        type: "EOM",
        days: d,
        description: `End of Month + ${d} days (EOM+${d})`,
      };
    }
    const netMatch = /^NET\s*(\d+)$/.exec(upper);
    if (netMatch) {
      const d = Number.parseInt(netMatch[1]!, 10);
      return { type: "NET", days: d, description: `Net ${d} days` };
    }
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Unsupported credit term string: "${term}". Expected "NET30", "EOM", "EOM+30", etc.`,
    );
  }

  if (term.type === "NET") {
    if (!Number.isInteger(term.days) || term.days < 0) {
      throw new ChroneraError(
        "CHRONERA_OUT_OF_RANGE",
        "NET credit term days must be a non-negative integer.",
      );
    }
    return {
      type: "NET",
      days: term.days,
      description: `Net ${term.days} days`,
    };
  }

  const plusDays = term.plusDays ?? 0;
  if (!Number.isInteger(plusDays) || plusDays < 0) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      "EOM plusDays must be a non-negative integer.",
    );
  }
  return {
    type: "EOM",
    days: plusDays,
    description:
      plusDays > 0
        ? `End of Month + ${plusDays} days (EOM+${plusDays})`
        : "End of Month (EOM)",
  };
}

/**
 * Calculates commercial AP/AR payment due dates supporting `"NET30"`, `"NET60"`, `"EOM"`, `"EOM+30"`,
 * optional monthly billing cut-off days, and automatic Bank of Thailand (`"TH-BOT"`) business day rolling.
 */
export function calculatePaymentDueDate(
  invoiceDateInput: ThaiDateInput,
  term: CreditTermInput,
  options?: PaymentDueDateOptions,
): PaymentDueDateResult {
  const invoiceDate = resolveThaiLocalDate(invoiceDateInput);
  const normalized = normalizeCreditTerm(term);
  const rollConvention = options?.rollConvention ?? "following";
  const calendar = options?.calendar ?? "TH-BOT";

  let billingBaseDate = invoiceDate;
  if (options?.billingCutOffDay !== undefined) {
    const cutOff = options.billingCutOffDay;
    if (!Number.isInteger(cutOff) || cutOff < 1 || cutOff > 28) {
      throw new ChroneraError(
        "CHRONERA_OUT_OF_RANGE",
        "billingCutOffDay must be an integer between 1 and 28.",
      );
    }
    if (invoiceDate.day > cutOff) {
      const nextMonth = addMonths(
        localDate(invoiceDate.year, invoiceDate.month, 1),
        1,
      );
      billingBaseDate = localDate(nextMonth.year, nextMonth.month, 1);
    }
  }

  let rawDueDate: LocalDate;
  if (normalized.type === "NET") {
    rawDueDate = addDays(billingBaseDate, normalized.days);
  } else {
    const eomDate = endOfMonth(billingBaseDate);
    rawDueDate =
      normalized.days > 0 ? addDays(eomDate, normalized.days) : eomDate;
  }

  const adjustedDueDate = adjustBusinessDate(
    rawDueDate,
    rollConvention,
    calendar,
  );
  const isAdjusted =
    adjustedDueDate.year !== rawDueDate.year ||
    adjustedDueDate.month !== rawDueDate.month ||
    adjustedDueDate.day !== rawDueDate.day;

  const creditDays = diffInDays(adjustedDueDate, invoiceDate);

  return {
    invoiceDate,
    billingBaseDate,
    rawDueDate,
    adjustedDueDate,
    isAdjusted,
    creditDays,
    termDescription: normalized.description,
  };
}
