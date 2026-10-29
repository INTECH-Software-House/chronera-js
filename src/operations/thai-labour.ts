import { daysInGregorianMonth } from "../core/gregorian-math.js";
import { ChroneraError } from "../errors/errors.js";
import { addDays, diffInDays } from "./convenience.js";
import { resolveThaiLocalDate, type ThaiDateInput } from "./thai-fiscal.js";

import type { LocalDate } from "../public-types.js";

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface ProbationOptions {
  /**
   * Probation duration in calendar days (counting `hireDate` as Day 1).
   * In Thai HR practice, standard probation is `119` days so evaluation completes
   * before statutory severance kicks in on Day 120 under Section 118(1).
   * Defaults to `119`.
   */
  readonly probationDays?: number;
  /**
   * Advance notice / evaluation lead time in calendar days before `probationEndDate`.
   * Defaults to `30` days.
   */
  readonly evaluationLeadDays?: number;
}

export interface ProbationScheduleResult {
  readonly hireDate: LocalDate;
  readonly probationDays: number;
  /**
   * The final day of the specified probation period (`hireDate + probationDays - 1`).
   */
  readonly probationEndDate: LocalDate;
  /**
   * Exact date of the 119th calendar day of employment (`hireDate + 118` days).
   * The final day on which employment can end without triggering Section 118(1) 30-day severance.
   */
  readonly day119Date: LocalDate;
  /**
   * Exact date of the 120th calendar day of employment (`hireDate + 119` days).
   * From this date onward, the employee is entitled to at least 30 days' severance pay under Section 118(1).
   */
  readonly day120SeveranceEligibleDate: LocalDate;
  /**
   * Recommended HR performance evaluation date (`probationEndDate - evaluationLeadDays`).
   */
  readonly recommendedEvaluationDate: LocalDate;
}

export interface ServiceTenureOptions {
  /**
   * Whether `terminationDate` is the employee's last working day (inclusive, counting both `hireDate` and `terminationDate`).
   * - `true` (default): Standard Thai Labour Law & HR convention where both start day and last working day are counted
   *   (e.g. `2026-01-01` through `2026-04-29` = 119 days; `2025-01-01` through `2025-12-31` = 1 year 0 months 0 days).
   * - `false`: Half-open interval `[hireDate, terminationDate)` where `terminationDate` is the first day no longer employed.
   */
  readonly inclusiveEndDate?: boolean;
}

export interface ServiceTenureResult {
  readonly hireDate: LocalDate;
  readonly terminationDate: LocalDate;
  readonly inclusiveEndDate: boolean;
  /** Complete calendar years of continuous service. */
  readonly years: number;
  /** Remaining complete calendar months of service (`0–11`). */
  readonly months: number;
  /** Remaining calendar days of service (`0–30`). */
  readonly days: number;
  /** Total continuous calendar days of service (including weekends, public holidays, and leaves). */
  readonly totalDays: number;
  /** `true` when `totalDays >= 120` (eligible for statutory severance under Section 118). */
  readonly isSeveranceEligible: boolean;
}

/**
 * Statutory severance pay tiers under Section 118 of the Thai Labour Protection Act
 * (พ.ร.บ. คุ้มครองแรงงาน มาตรา 118 แก้ไขเพิ่มเติม พ.ศ. 2562 — 6 ขั้น สูงสุด 400 วัน).
 */
export type ThaiSeveranceTierCode =
  | "NONE"
  | "DAYS_120_TO_1Y"
  | "YEARS_1_TO_3"
  | "YEARS_3_TO_6"
  | "YEARS_6_TO_10"
  | "YEARS_10_TO_20"
  | "YEARS_20_PLUS";

export interface ThaiSeverancePayOptions {
  /** Employee's hire / start date (วันเริ่มงาน). */
  readonly hireDate: ThaiDateInput;
  /** Employee's last working day or termination date (วันสิ้นสุดสัญญาจ้าง / วันทำงานวันสุดท้าย). */
  readonly terminationDate: ThaiDateInput;
  /**
   * Monthly base salary in THB (เงินเดือนอัตราสุดท้าย).
   * Converted to daily wage via `monthlySalary / 30` per Section 68 of the Thai Labour Protection Act.
   */
  readonly monthlySalary?: number;
  /**
   * Explicit daily wage in THB (ค่าจ้างรายวันอัตราสุดท้าย).
   * Takes precedence over `monthlySalary / 30` when provided.
   */
  readonly dailyWage?: number;
  /**
   * Whether `terminationDate` is inclusive (last working day). Defaults to `true`.
   */
  readonly inclusiveEndDate?: boolean;
  /**
   * Under Thai Revenue Code Ministerial Regulation No. 126 (amended by No. 394 B.E. 2567),
   * statutory severance pay up to 400 days' wages (capped at 600,000 THB) is exempt from Personal Income Tax,
   * EXCEPT when paid due to retirement (เกษียณอายุ) or expiration of a fixed-term contract.
   * Set to `true` if termination is due to retirement so tax exemption is not applied.
   * Defaults to `false`.
   */
  readonly isRetirement?: boolean;
}

export interface ThaiSeverancePayResult {
  readonly tenure: ServiceTenureResult;
  readonly tier: ThaiSeveranceTierCode;
  readonly legalReference: string;
  /** Statutory severance entitlement in days of final wages (`0 | 30 | 90 | 180 | 240 | 300 | 400`). */
  readonly severanceDays: 0 | 30 | 90 | 180 | 240 | 300 | 400;
  /** Final daily wage rate in THB used for the calculation (rounded to 2 decimal places for display, exact in math). */
  readonly dailyWage: number;
  /** Total gross severance pay in THB (rounded to 2 decimal places). */
  readonly severanceAmount: number;
  /**
   * Amount exempt from Thai Personal Income Tax under Ministerial Regulation No. 394 (2567):
   * Up to 400 days' wages, not exceeding `600,000` THB (or `0` when `isRetirement: true`).
   */
  readonly taxExemptAmount: number;
  /**
   * Portion of severance pay subject to Thai Personal Income Tax (`severanceAmount - taxExemptAmount`).
   */
  readonly taxableAmount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculates Thai HR probation milestones, including the critical **119th day**
 * (final day before statutory severance pay attaches) and **120th day**
 * (first day of 30-day severance eligibility under Section 118(1) of the Thai Labour Protection Act).
 *
 * Note: Under Thai Labour Law, `hireDate` is counted as working **Day 1**.
 * Therefore:
 * - Day 119 = `hireDate + 118 calendar days`
 * - Day 120 = `hireDate + 119 calendar days`
 *
 * @example
 * ```ts
 * const schedule = calculateProbationEndDate("2026-01-01");
 * // schedule.day119Date -> 2026-04-29 (119th day)
 * // schedule.day120SeveranceEligibleDate -> 2026-04-30 (120th day)
 * ```
 */
export function calculateProbationEndDate(
  hireDateInput: ThaiDateInput,
  options?: ProbationOptions,
): ProbationScheduleResult {
  const hireDate = resolveThaiLocalDate(hireDateInput);
  const probationDays = options?.probationDays ?? 119;
  const evaluationLeadDays = options?.evaluationLeadDays ?? 30;

  if (!Number.isInteger(probationDays) || probationDays < 1) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `Probation days must be a positive integer; received ${probationDays}.`,
    );
  }
  if (!Number.isInteger(evaluationLeadDays) || evaluationLeadDays < 0) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `Evaluation lead days must be a non-negative integer; received ${evaluationLeadDays}.`,
    );
  }

  const probationEndDate = addDays(hireDate, probationDays - 1);
  const day119Date = addDays(hireDate, 118);
  const day120SeveranceEligibleDate = addDays(hireDate, 119);
  const recommendedEvaluationDate = addDays(
    probationEndDate,
    -evaluationLeadDays,
  );

  return {
    hireDate,
    probationDays,
    probationEndDate,
    day119Date,
    day120SeveranceEligibleDate,
    recommendedEvaluationDate,
  };
}

/**
 * Computes exact employee service tenure (`years`, `months`, `days`, and `totalDays`)
 * under Thai Labour Law conventions.
 *
 * By default (`inclusiveEndDate: true`), both `hireDate` and `terminationDate` (last working day)
 * are counted as worked days. For example:
 * - `2025-01-01` to `2025-12-31` (inclusive) = `1 year, 0 months, 0 days` (`365` total days).
 * - `2026-01-01` to `2026-04-29` (inclusive) = `0 years, 3 months, 29 days` (`119` total days).
 * - `2026-01-01` to `2026-04-30` (inclusive) = `0 years, 4 months, 0 days` (`120` total days).
 */
export function calculateServiceTenure(
  hireDateInput: ThaiDateInput,
  terminationDateInput: ThaiDateInput,
  options?: ServiceTenureOptions,
): ServiceTenureResult {
  const hireDate = resolveThaiLocalDate(hireDateInput);
  const terminationDate = resolveThaiLocalDate(terminationDateInput);
  const inclusiveEndDate = options?.inclusiveEndDate ?? true;

  const rawDiffDays = diffInDays(terminationDate, hireDate);
  const totalDays = inclusiveEndDate ? rawDiffDays + 1 : rawDiffDays;

  if (totalDays < 0) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `Termination date (${terminationDate.year}-${String(terminationDate.month).padStart(2, "0")}-${String(terminationDate.day).padStart(2, "0")}) cannot precede hire date (${hireDate.year}-${String(hireDate.month).padStart(2, "0")}-${String(hireDate.day).padStart(2, "0")}).`,
    );
  }

  // Convert inclusive end date into an exclusive anniversary comparison date (`effectiveEnd = terminationDate + 1 day`)
  const effectiveEnd = inclusiveEndDate
    ? addDays(terminationDate, 1)
    : terminationDate;

  let years = effectiveEnd.year - hireDate.year;
  let months = effectiveEnd.month - hireDate.month;
  let days = effectiveEnd.day - hireDate.day;

  if (days < 0) {
    months -= 1;
    // Borrow days from the month immediately preceding effectiveEnd
    const prevMonth = effectiveEnd.month === 1 ? 12 : effectiveEnd.month - 1;
    const prevMonthYear =
      effectiveEnd.month === 1 ? effectiveEnd.year - 1 : effectiveEnd.year;
    const prevMonthMaxDays = daysInGregorianMonth(prevMonthYear, prevMonth);
    // Clamp hireDate.day if hireDate was on the 31st/30th and prevMonth has fewer days
    const clampedStartDay = Math.min(hireDate.day, prevMonthMaxDays);
    days = prevMonthMaxDays - clampedStartDay + effectiveEnd.day;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return {
    hireDate,
    terminationDate,
    inclusiveEndDate,
    years,
    months,
    days,
    totalDays,
    isSeveranceEligible: totalDays >= 120,
  };
}

/**
 * Calculates statutory severance pay (ค่าชดเชยเลิกจ้าง) under **Section 118 of the Thai Labour Protection Act**
 * across all **6 tiers (up to 400 days)**, plus Personal Income Tax exemption under Ministerial Regulation No. 394 (B.E. 2567).
 *
 * Statutory Tiers (Section 118):
 * 1. `< 120 days`: `0` days
 * 2. `120 days` to `< 1 year`: `30` days — มาตรา 118(1)
 * 3. `1 year` to `< 3 years`: `90` days — มาตรา 118(2)
 * 4. `3 years` to `< 6 years`: `180` days — มาตรา 118(3)
 * 5. `6 years` to `< 10 years`: `240` days — มาตรา 118(4)
 * 6. `10 years` to `< 20 years`: `300` days — มาตรา 118(5)
 * 7. `>= 20 years`: `400` days — มาตรา 118(6)
 *
 * @example
 * ```ts
 * const res = calculateThaiSeverancePay({
 *   hireDate: "2015-01-01",
 *   terminationDate: "2026-06-30",
 *   monthlySalary: 45_000,
 * });
 * // res.severanceDays -> 300 (11 years 6 months -> Tier 10-20 years)
 * // res.severanceAmount -> 450,000 THB (exempt up to 600,000 THB)
 * ```
 */
export function calculateThaiSeverancePay(
  options: ThaiSeverancePayOptions,
): ThaiSeverancePayResult {
  const {
    hireDate,
    terminationDate,
    monthlySalary,
    dailyWage: explicitDailyWage,
    inclusiveEndDate = true,
    isRetirement = false,
  } = options;

  if (
    monthlySalary !== undefined &&
    (!Number.isFinite(monthlySalary) || monthlySalary < 0)
  ) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `Monthly salary must be a non-negative number; received ${monthlySalary}.`,
    );
  }
  if (
    explicitDailyWage !== undefined &&
    (!Number.isFinite(explicitDailyWage) || explicitDailyWage < 0)
  ) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `Daily wage must be a non-negative number; received ${explicitDailyWage}.`,
    );
  }

  const tenure = calculateServiceTenure(hireDate, terminationDate, {
    inclusiveEndDate,
  });

  let tier: ThaiSeveranceTierCode;
  let severanceDays: 0 | 30 | 90 | 180 | 240 | 300 | 400;
  let legalReference: string;

  if (tenure.totalDays < 120) {
    tier = "NONE";
    severanceDays = 0;
    legalReference =
      "พ.ร.บ. คุ้มครองแรงงาน มาตรา 118: อายุงานไม่ครบ 120 วัน (ไม่มีสิทธิได้รับค่าชดเชย)";
  } else if (tenure.years < 1) {
    tier = "DAYS_120_TO_1Y";
    severanceDays = 30;
    legalReference =
      "พ.ร.บ. คุ้มครองแรงงาน มาตรา 118(1): อายุงานครบ 120 วัน แต่ไม่ครบ 1 ปี (ค่าจ้าง 30 วัน)";
  } else if (tenure.years < 3) {
    tier = "YEARS_1_TO_3";
    severanceDays = 90;
    legalReference =
      "พ.ร.บ. คุ้มครองแรงงาน มาตรา 118(2): อายุงานครบ 1 ปี แต่ไม่ครบ 3 ปี (ค่าจ้าง 90 วัน)";
  } else if (tenure.years < 6) {
    tier = "YEARS_3_TO_6";
    severanceDays = 180;
    legalReference =
      "พ.ร.บ. คุ้มครองแรงงาน มาตรา 118(3): อายุงานครบ 3 ปี แต่ไม่ครบ 6 ปี (ค่าจ้าง 180 วัน)";
  } else if (tenure.years < 10) {
    tier = "YEARS_6_TO_10";
    severanceDays = 240;
    legalReference =
      "พ.ร.บ. คุ้มครองแรงงาน มาตรา 118(4): อายุงานครบ 6 ปี แต่ไม่ครบ 10 ปี (ค่าจ้าง 240 วัน)";
  } else if (tenure.years < 20) {
    tier = "YEARS_10_TO_20";
    severanceDays = 300;
    legalReference =
      "พ.ร.บ. คุ้มครองแรงงาน มาตรา 118(5): อายุงานครบ 10 ปี แต่ไม่ครบ 20 ปี (ค่าจ้าง 300 วัน)";
  } else {
    tier = "YEARS_20_PLUS";
    severanceDays = 400;
    legalReference =
      "พ.ร.บ. คุ้มครองแรงงาน มาตรา 118(6): อายุงานครบ 20 ปีบริบูรณ์ขึ้นไป (ค่าจ้าง 400 วัน)";
  }

  const rawDailyWage =
    explicitDailyWage !== undefined
      ? explicitDailyWage
      : (monthlySalary ?? 0) / 30;
  const dailyWage = roundCurrency(rawDailyWage);
  const severanceAmount = roundCurrency(rawDailyWage * severanceDays);

  // Ministerial Regulation No. 126 (amended by No. 394 B.E. 2567):
  // Statutory severance up to 400 days' wages, capped at 600,000 THB, is exempt from Personal Income Tax
  // (excluding retirement or fixed-term contract completion).
  const maxExemptByCap = 600_000;
  const taxExemptAmount = isRetirement
    ? 0
    : roundCurrency(Math.min(severanceAmount, maxExemptByCap));
  const taxableAmount = roundCurrency(
    Math.max(0, severanceAmount - taxExemptAmount),
  );

  return {
    tenure,
    tier,
    legalReference,
    severanceDays,
    dailyWage,
    severanceAmount,
    taxExemptAmount,
    taxableAmount,
  };
}
