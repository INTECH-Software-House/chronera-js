import { localDate } from "../core/local-date.js";
import {
  instantFromDate,
  instantFromEpochMilliseconds,
} from "../core/instant.js";
import { parseGregorianMonthCode } from "../core/gregorian-math.js";
import { ChroneraError } from "../errors/errors.js";
import { parseLocalDate } from "../parse/parse-local-date.js";
import { parseInstant } from "../parse/parse-instant.js";
import { addDays } from "./convenience.js";
import { isBusinessDay, isBankBusinessDay } from "./business-days.js";
import { isIXDTF, parseIXDTF } from "./ixdtf.js";
import { getZonedFields } from "./zoned-operations.js";

import type { Chronera } from "../chronera.js";
import type { CalendarDate, LocalDate } from "../public-types.js";

export type ThaiDateInput =
  LocalDate | CalendarDate | Chronera | Date | string | number;

export interface ThaiFiscalYearInfo {
  readonly fiscalYearCE: number;
  readonly fiscalYearBE: number;
  readonly quarter: 1 | 2 | 3 | 4;
  readonly quarterBE: string;
  readonly startDate: LocalDate;
  readonly endDate: LocalDate;
  readonly quarterStartDate: LocalDate;
  readonly quarterEndDate: LocalDate;
}

export type ThaiTaxForm =
  "PND1" | "PND3" | "PND53" | "PP30" | "PND50" | "PND51";

export interface TaxDeadlineOptions {
  readonly eFiling?: boolean;
  readonly calendar?: "civil" | "bank";
}

export interface TaxFilingDeadlineResult {
  readonly taxForm: ThaiTaxForm;
  readonly taxYear: number;
  readonly taxPeriod: number;
  readonly standardDeadline: LocalDate;
  readonly adjustedDeadline: LocalDate;
  readonly isExtended: boolean;
  readonly extensionDays: number;
  readonly isEFiling: boolean;
  readonly description: string;
}

export function resolveThaiLocalDate(input: ThaiDateInput): LocalDate {
  if (input instanceof Date) {
    const inst = instantFromDate(input);
    const d = new Date(inst.epochMilliseconds);
    return localDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  if (typeof input === "number") {
    const inst = instantFromEpochMilliseconds(input);
    const d = new Date(inst.epochMilliseconds);
    return localDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (isIXDTF(trimmed)) {
      const f = getZonedFields(parseIXDTF(trimmed));
      return localDate(f.year, f.month, f.day);
    }
    if (
      trimmed.includes("T") ||
      trimmed.endsWith("Z") ||
      /[+-]\d{2}:?\d{2}$/.test(trimmed)
    ) {
      const inst = parseInstant(trimmed);
      const d = new Date(inst.epochMilliseconds);
      return localDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    }
    return parseLocalDate(trimmed);
  }
  if (typeof input === "object" && input !== null) {
    if (
      "toLocalDate" in input &&
      typeof (input as { toLocalDate?: unknown }).toLocalDate === "function"
    ) {
      return (input as { toLocalDate(): LocalDate }).toLocalDate();
    }
    if ("kind" in input && input.kind === "local-date") {
      return input as LocalDate;
    }
    if ("kind" in input && input.kind === "calendar-date") {
      const cd = input as CalendarDate;
      const m = cd.month ?? parseGregorianMonthCode(cd.monthCode);
      if (m === null) {
        throw new ChroneraError(
          "CHRONERA_INVALID_DATE",
          `Invalid month code for fiscal calculations: ${cd.monthCode}`,
        );
      }
      return localDate(cd.year, m, cd.day);
    }
  }
  throw new ChroneraError(
    "CHRONERA_INVALID_DATE",
    "Invalid input for fiscal calculations; expected LocalDate, CalendarDate, Chronera, Date, or ISO string.",
  );
}

const resolveLocalDate = resolveThaiLocalDate;

/**
 * Calculates Thai Government Fiscal Year (ปีงบประมาณแผ่นดิน) details for a given date.
 * The Thai fiscal year runs from October 1 to September 30.
 *
 * Example:
 * - 2026-10-15 -> Fiscal Year 2027 (พ.ศ. 2570), Quarter 1
 * - 2027-02-10 -> Fiscal Year 2027 (พ.ศ. 2570), Quarter 2
 */
export function getThaiFiscalYear(input: ThaiDateInput): ThaiFiscalYearInfo {
  const d = resolveLocalDate(input);
  const year = d.year;
  const month = d.month;

  let fiscalYearCE: number;
  let quarter: 1 | 2 | 3 | 4;
  let qStart: LocalDate;
  let qEnd: LocalDate;

  if (month >= 10) {
    fiscalYearCE = year + 1;
    quarter = 1;
    qStart = localDate(year, 10, 1);
    qEnd = localDate(year, 12, 31);
  } else if (month <= 3) {
    fiscalYearCE = year;
    quarter = 2;
    qStart = localDate(year, 1, 1);
    qEnd = localDate(year, 3, 31);
  } else if (month <= 6) {
    fiscalYearCE = year;
    quarter = 3;
    qStart = localDate(year, 4, 1);
    qEnd = localDate(year, 6, 30);
  } else {
    fiscalYearCE = year;
    quarter = 4;
    qStart = localDate(year, 7, 1);
    qEnd = localDate(year, 9, 30);
  }

  const fiscalYearBE = fiscalYearCE + 543;
  const startDate = localDate(fiscalYearCE - 1, 10, 1);
  const endDate = localDate(fiscalYearCE, 9, 30);

  return {
    fiscalYearCE,
    fiscalYearBE,
    quarter,
    quarterBE: `ไตรมาส ${quarter}`,
    startDate,
    endDate,
    quarterStartDate: qStart,
    quarterEndDate: qEnd,
  };
}

/**
 * Returns the Thai Government Fiscal Quarter (1 to 4) for a given date.
 * - Q1: Oct 1 – Dec 31
 * - Q2: Jan 1 – Mar 31
 * - Q3: Apr 1 – Jun 30
 * - Q4: Jul 1 – Sep 30
 */
export function getThaiFiscalQuarter(input: ThaiDateInput): 1 | 2 | 3 | 4 {
  return getThaiFiscalYear(input).quarter;
}

/**
 * Returns the start and end dates for a given Thai Government Fiscal Year (accepts CE or BE year).
 * E.g. Fiscal Year 2027 (or 2570 BE) runs from 2026-10-01 to 2027-09-30.
 */
export function getThaiFiscalYearRange(fiscalYear: number): {
  readonly fiscalYearCE: number;
  readonly fiscalYearBE: number;
  readonly startDate: LocalDate;
  readonly endDate: LocalDate;
} {
  const fiscalYearCE = fiscalYear > 2400 ? fiscalYear - 543 : fiscalYear;
  const fiscalYearBE = fiscalYearCE + 543;
  return {
    fiscalYearCE,
    fiscalYearBE,
    startDate: localDate(fiscalYearCE - 1, 10, 1),
    endDate: localDate(fiscalYearCE, 9, 30),
  };
}

/**
 * Computes the official Thai Revenue Department (กรมสรรพากร) tax filing deadline.
 * If the computed deadline falls on a weekend, civil public holiday, or bank holiday,
 * it automatically rolls forward to the next business day pursuant to Thai legal principles.
 */
export function getTaxFilingDeadline(
  taxForm: ThaiTaxForm,
  taxYear: number,
  taxPeriod: number,
  options: TaxDeadlineOptions = {},
): TaxFilingDeadlineResult {
  const isEFiling = options.eFiling ?? false;
  const calendarType = options.calendar ?? "civil";

  let standardDeadline: LocalDate;
  let description = "";

  switch (taxForm) {
    case "PND1":
    case "PND3":
    case "PND53": {
      // Monthly withholding tax on transactions of month `taxPeriod`
      // Paper due: 7th of following month. e-Filing due: 15th of following month (+8 days).
      let dueYear = taxYear;
      let dueMonth = taxPeriod + 1;
      if (dueMonth > 12) {
        dueMonth = 1;
        dueYear += 1;
      }
      const dueDay = isEFiling ? 15 : 7;
      standardDeadline = localDate(dueYear, dueMonth, dueDay);
      description = `${taxForm} (ภาษีหัก ณ ที่จ่าย ประจำเดือน ${taxPeriod}/${taxYear})`;
      break;
    }
    case "PP30": {
      // Monthly VAT on transactions of month `taxPeriod`
      // Paper due: 15th of following month. e-Filing due: 23rd of following month (+8 days).
      let dueYear = taxYear;
      let dueMonth = taxPeriod + 1;
      if (dueMonth > 12) {
        dueMonth = 1;
        dueYear += 1;
      }
      const dueDay = isEFiling ? 23 : 15;
      standardDeadline = localDate(dueYear, dueMonth, dueDay);
      description = `ภ.พ. 30 (ภาษีมูลค่าเพิ่ม ประจำเดือน ${taxPeriod}/${taxYear})`;
      break;
    }
    case "PND50": {
      // Annual Corporate Income Tax: due within 150 days of accounting closing (default Dec 31).
      // Paper due: 150 days after Dec 31. e-Filing: +8 days.
      const yearEnd = localDate(taxYear, 12, 31);
      const paperDue = addDays(yearEnd, 150);
      standardDeadline = isEFiling ? addDays(paperDue, 8) : paperDue;
      description = `ภ.ง.ด. 50 (ภาษีเงินได้นิติบุคคลประจำปี รอบบัญชีสิ้นสุด ${taxYear})`;
      break;
    }
    case "PND51": {
      // Half-Year Corporate Income Tax: due within 2 months after end of first 6 months (June 30).
      // Paper due: Aug 31. e-Filing: +8 days (Sep 8).
      standardDeadline = isEFiling
        ? localDate(taxYear, 9, 8)
        : localDate(taxYear, 8, 31);
      description = `ภ.ง.ด. 51 (ภาษีเงินได้นิติบุคคลครึ่งรอบปี ${taxYear})`;
      break;
    }
  }

  // Next business day roll check
  let adjustedDeadline = standardDeadline;
  const isBiz = (d: LocalDate): boolean => {
    return calendarType === "bank"
      ? isBankBusinessDay(d, "TH-BOT")
      : isBusinessDay(d, { holidays: "TH" });
  };

  let extensionDays = 0;
  while (!isBiz(adjustedDeadline)) {
    adjustedDeadline = addDays(adjustedDeadline, 1);
    extensionDays++;
  }

  return {
    taxForm,
    taxYear,
    taxPeriod,
    standardDeadline,
    adjustedDeadline,
    isExtended: extensionDays > 0,
    extensionDays,
    isEFiling,
    description,
  };
}

/**
 * Returns all monthly tax deadlines (PND1, PND3, PND53, PP30) for a specific tax month.
 */
export function getAllMonthlyTaxDeadlines(
  taxYear: number,
  taxMonth: number,
  options: TaxDeadlineOptions = {},
): TaxFilingDeadlineResult[] {
  const forms: ThaiTaxForm[] = ["PND1", "PND3", "PND53", "PP30"];
  return forms.map((form) =>
    getTaxFilingDeadline(form, taxYear, taxMonth, options),
  );
}
