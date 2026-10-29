import { localDate } from "../core/local-date.js";
import { ChroneraError } from "../errors/errors.js";
import { addDays } from "./convenience.js";
import {
  addBankBusinessDays,
  addBusinessDays,
  isBankBusinessDay,
  isBusinessDay,
} from "./business-days.js";
import { resolveThaiLocalDate, type ThaiDateInput } from "./thai-fiscal.js";

import type { LocalDate } from "../public-types.js";

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface ThaiSsoWageCeilingInfo {
  readonly yearCE: number;
  readonly yearBE: number;
  readonly minWage: number;
  readonly maxWage: number;
  readonly standardRate: number;
  readonly maxMonthlyContribution: number;
  readonly section39WageBase: number;
  readonly section39Rate: number;
  readonly section39MonthlyContribution: number;
}

export interface ThaiSsoContributionOptions {
  /**
   * Monthly gross wage/salary in THB (used for Section 33).
   * Ignored when `section` is `39` (which uses the fixed 4,800 THB base).
   */
  readonly salary?: number;
  /**
   * Social Security Act section:
   * - `33`: Employed insured person (มาตรา 33 — stepped wage ceiling 15k / 17.5k / 20k / 23k).
   * - `39`: Voluntarily insured former employee (มาตรา 39 — fixed base 4,800 THB at 9% = 432 THB).
   * Defaults to `33`.
   */
  readonly section?: 33 | 39;
  /**
   * Effective year (CE or BE >= 2400) or date to determine the statutory stepped wage ceiling.
   * Defaults to `2026` (พ.ศ. 2569 -> 17,500 THB ceiling).
   */
  readonly yearOrDate?: number | ThaiDateInput;
  /**
   * Convenience alias for `yearOrDate` when passing a year number (CE or BE >= 2400).
   */
  readonly year?: number;
  /**
   * Convenience alias for `yearOrDate` when passing a date (`Date`, ISO string, `LocalDate`, `Chronera`).
   */
  readonly date?: ThaiDateInput;
  /**
   * Optional override for employee contribution rate (e.g. `0.03` during government relief periods).
   * Defaults to `0.05` (5%) for Section 33 and `0.09` (9%) for Section 39.
   */
  readonly employeeRate?: number;
  /**
   * Optional override for employer contribution rate.
   * Defaults to `0.05` (5%) for Section 33 and `0` for Section 39.
   */
  readonly employerRate?: number;
  /**
   * Rounding mode for contribution amounts:
   * - `"round"`: Standard SSO rule (>= 0.50 Baht rounds up to next integer Baht).
   * - `"exact"`: Keeps 2 decimal places (satang).
   * Defaults to `"round"`.
   */
  readonly rounding?: "round" | "exact";
}

export interface ThaiSsoContributionResult {
  readonly section: 33 | 39;
  readonly effectiveYearCE: number;
  readonly effectiveYearBE: number;
  readonly grossSalary: number;
  readonly minWageBase: number;
  readonly maxWageCeiling: number;
  readonly contributoryWage: number;
  readonly employeeRate: number;
  readonly employerRate: number;
  readonly employeeContribution: number;
  readonly employerContribution: number;
  readonly totalContribution: number;
}

export interface SsoDeadlineOptions {
  /**
   * Whether the employer remits contributions via SSO e-Submission / e-Payment
   * (grants +7 business days after the 15th of the following month).
   * Defaults to `false`.
   */
  readonly ePayment?: boolean;
  /**
   * Holiday calendar used to roll weekends/holidays (`"civil"` for `"TH"` or `"bank"` for `"TH-BOT"`).
   * Defaults to `"civil"`.
   */
  readonly calendar?: "civil" | "bank";
}

export interface SsoFilingDeadlineResult {
  readonly contributionYear: number;
  readonly contributionMonth: number;
  readonly standardDeadline: LocalDate;
  readonly adjustedStandardDeadline: LocalDate;
  readonly ePaymentDeadline: LocalDate;
  readonly effectiveDeadline: LocalDate;
  readonly isEPayment: boolean;
  readonly description: string;
}

// ---------------------------------------------------------------------------
// Stepped Wage Ceiling & SSO Contribution Engine
// ---------------------------------------------------------------------------

function resolveEffectiveYearCE(yearOrDate?: number | ThaiDateInput): number {
  if (yearOrDate === undefined) {
    return 2026;
  }
  if (typeof yearOrDate === "number" && Number.isInteger(yearOrDate)) {
    if (yearOrDate >= 2400) {
      return yearOrDate - 543;
    }
    if (yearOrDate >= 1900 && yearOrDate <= 9999) {
      return yearOrDate;
    }
  }
  return resolveThaiLocalDate(yearOrDate).year;
}

/**
 * Returns the official Thai Social Security Office (สำนักงานประกันสังคม) stepped wage ceiling
 * and contribution parameters for a given year (CE or BE) or date:
 * - `<= 2025` (<= พ.ศ. 2568): Max ceiling `15,000` THB (Max 750 THB/month at 5%)
 * - `2026–2028` (พ.ศ. 2569–2571): Max ceiling `17,500` THB (Max 875 THB/month at 5%)
 * - `2029–2031` (พ.ศ. 2572–2574): Max ceiling `20,000` THB (Max 1,000 THB/month at 5%)
 * - `>= 2032` (>= พ.ศ. 2575): Max ceiling `23,000` THB (Max 1,150 THB/month at 5%)
 */
export function getThaiSsoWageCeiling(
  yearOrDate?: number | ThaiDateInput,
): ThaiSsoWageCeilingInfo {
  const yearCE = resolveEffectiveYearCE(yearOrDate);
  const yearBE = yearCE + 543;

  let maxWage: number;
  if (yearCE <= 2025) {
    maxWage = 15000;
  } else if (yearCE <= 2028) {
    maxWage = 17500;
  } else if (yearCE <= 2031) {
    maxWage = 20000;
  } else {
    maxWage = 23000;
  }

  const minWage = 1650;
  const standardRate = 0.05;
  const maxMonthlyContribution = Math.round(maxWage * standardRate);

  return {
    yearCE,
    yearBE,
    minWage,
    maxWage,
    standardRate,
    maxMonthlyContribution,
    section39WageBase: 4800,
    section39Rate: 0.09,
    section39MonthlyContribution: 432,
  };
}

function roundSsoAmount(amount: number, mode: "round" | "exact"): number {
  if (mode === "exact") {
    return Math.round(amount * 100) / 100;
  }
  return Math.round(amount);
}

/**
 * Calculates monthly Thai Social Security (ประกันสังคม มาตรา 33 และ มาตรา 39) contributions
 * for both employee and employer, automatically applying the statutory stepped wage ceiling.
 */
export function calculateThaiSsoContribution(
  options: ThaiSsoContributionOptions,
): ThaiSsoContributionResult {
  const section = options.section ?? 33;
  const rounding = options.rounding ?? "round";
  const ceilingInfo = getThaiSsoWageCeiling(
    options.yearOrDate ?? options.year ?? options.date,
  );

  if (section === 39) {
    const wageBase = ceilingInfo.section39WageBase;
    const empRate = options.employeeRate ?? ceilingInfo.section39Rate;
    const emprRate = options.employerRate ?? 0;
    const empContrib = roundSsoAmount(wageBase * empRate, rounding);
    const emprContrib = roundSsoAmount(wageBase * emprRate, rounding);

    return {
      section: 39,
      effectiveYearCE: ceilingInfo.yearCE,
      effectiveYearBE: ceilingInfo.yearBE,
      grossSalary: wageBase,
      minWageBase: wageBase,
      maxWageCeiling: wageBase,
      contributoryWage: wageBase,
      employeeRate: empRate,
      employerRate: emprRate,
      employeeContribution: empContrib,
      employerContribution: emprContrib,
      totalContribution: roundSsoAmount(empContrib + emprContrib, rounding),
    };
  }

  const salary = options.salary ?? 0;
  if (!Number.isFinite(salary) || salary < 0) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      "Salary must be a non-negative finite number.",
    );
  }

  const empRate = options.employeeRate ?? ceilingInfo.standardRate;
  const emprRate = options.employerRate ?? ceilingInfo.standardRate;

  if (salary === 0) {
    return {
      section: 33,
      effectiveYearCE: ceilingInfo.yearCE,
      effectiveYearBE: ceilingInfo.yearBE,
      grossSalary: 0,
      minWageBase: ceilingInfo.minWage,
      maxWageCeiling: ceilingInfo.maxWage,
      contributoryWage: 0,
      employeeRate: empRate,
      employerRate: emprRate,
      employeeContribution: 0,
      employerContribution: 0,
      totalContribution: 0,
    };
  }

  const contributoryWage = Math.min(
    ceilingInfo.maxWage,
    Math.max(ceilingInfo.minWage, salary),
  );
  const empContrib = roundSsoAmount(contributoryWage * empRate, rounding);
  const emprContrib = roundSsoAmount(contributoryWage * emprRate, rounding);

  return {
    section: 33,
    effectiveYearCE: ceilingInfo.yearCE,
    effectiveYearBE: ceilingInfo.yearBE,
    grossSalary: salary,
    minWageBase: ceilingInfo.minWage,
    maxWageCeiling: ceilingInfo.maxWage,
    contributoryWage,
    employeeRate: empRate,
    employerRate: emprRate,
    employeeContribution: empContrib,
    employerContribution: emprContrib,
    totalContribution: roundSsoAmount(empContrib + emprContrib, rounding),
  };
}

// ---------------------------------------------------------------------------
// SSO Form (สปส. 1-10) Monthly Filing Deadline Engine
// ---------------------------------------------------------------------------

function isThaiOpenDay(date: LocalDate, calendar: "civil" | "bank"): boolean {
  if (calendar === "bank") {
    return isBankBusinessDay(date, "TH-BOT");
  }
  return isBusinessDay(date, { holidays: "TH" });
}

function rollForwardOpenDay(
  date: LocalDate,
  calendar: "civil" | "bank",
): LocalDate {
  let curr = date;
  while (!isThaiOpenDay(curr, calendar)) {
    curr = addDays(curr, 1);
  }
  return curr;
}

/**
 * Computes the official Thai Social Security Office (สปส. 1-10) monthly remittance deadline:
 * - Standard paper/counter deadline: **15th of the following month** (rolled forward if falling on a weekend/holiday).
 * - e-Payment extension (`ePayment: true`): **+7 business days** after the 15th of the following month.
 */
export function getSsoFilingDeadline(
  year: number,
  month: number,
  options?: SsoDeadlineOptions,
): SsoFilingDeadlineResult {
  const normalizedYear = year >= 2400 ? year - 543 : year;
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `SSO contribution month must be between 1 and 12; received ${month}.`,
    );
  }

  const isEPayment = options?.ePayment ?? false;
  const calendar = options?.calendar ?? "civil";

  const filingYear = month === 12 ? normalizedYear + 1 : normalizedYear;
  const filingMonth = month === 12 ? 1 : month + 1;

  const standardDeadline = localDate(filingYear, filingMonth, 15);
  const adjustedStandardDeadline = rollForwardOpenDay(
    standardDeadline,
    calendar,
  );

  // SSO e-Payment grants +7 working/business days from the 15th of the following month
  const ePaymentDeadline =
    calendar === "bank"
      ? addBankBusinessDays(standardDeadline, 7, "TH-BOT")
      : addBusinessDays(standardDeadline, 7, { holidays: "TH" });

  const effectiveDeadline = isEPayment
    ? ePaymentDeadline
    : adjustedStandardDeadline;

  return {
    contributionYear: normalizedYear,
    contributionMonth: month,
    standardDeadline,
    adjustedStandardDeadline,
    ePaymentDeadline,
    effectiveDeadline,
    isEPayment,
    description: isEPayment
      ? "สปส. 1-10 (นำส่งเงินสมทบประกันสังคมผ่าน e-Payment +7 วันทำการ)"
      : "สปส. 1-10 (นำส่งเงินสมทบประกันสังคมภายในวันที่ 15 ของเดือนถัดไป)",
  };
}
