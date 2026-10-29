import {
  isBankBusinessDay as _isBankBusinessDay,
  addBankBusinessDays as _addBankBusinessDays,
  diffInBankBusinessDays as _diffInBankBusinessDays,
} from "../operations/business-days.js";
import {
  isBankHoliday as _isBankHoliday,
  getBankHolidays as _getBankHolidays,
} from "../operations/holidays.js";
import {
  resolveThaiLocalDate,
  getThaiFiscalYear,
  getThaiFiscalQuarter,
  getThaiFiscalYearRange,
  getTaxFilingDeadline,
  getAllMonthlyTaxDeadlines,
  type ThaiDateInput,
  type ThaiFiscalYearInfo,
  type ThaiTaxForm,
  type TaxDeadlineOptions,
  type TaxFilingDeadlineResult,
} from "../operations/thai-fiscal.js";
import {
  calculateWorkShiftDuration,
  calculateNetBusinessMinutes,
  calculateSlaDeadline,
  calculateOvertime,
  calculateThaiOvertimePay,
  parseTimeToMinutes,
  formatMinutesToTime,
  type WorkShiftWindow,
  type WorkShiftDurationResult,
  type BreakInterval,
  type NetBusinessMinutesOptions,
  type NetBusinessMinutesResult,
  type SlaDeadlineResult,
  type WorkedInterval,
  type WorkSchedule,
  type OvertimeResult,
  type ThaiOvertimePayOptions,
  type ThaiOvertimePayResult,
} from "../operations/advanced-shifts.js";
import {
  getThaiLunarDate,
  isWanPhra,
  getWanPhraInMonth,
  formatThaiLunarDate,
  type ThaiLunarDate,
} from "../operations/thai-lunar.js";
import {
  adjustBusinessDate,
  calculateDayCountFraction,
  calculateAccruedInterest,
  calculatePaymentDueDate,
  type DayCountConvention,
  type BusinessDayConvention,
  type DayCountResult,
  type AccruedInterestOptions,
  type AccruedInterestResult,
  type CreditTermPreset,
  type CreditTermInput,
  type PaymentDueDateOptions,
  type PaymentDueDateResult,
} from "../operations/thai-banking.js";
import {
  getThaiSsoWageCeiling,
  calculateThaiSsoContribution,
  getSsoFilingDeadline,
  type ThaiSsoWageCeilingInfo,
  type ThaiSsoContributionOptions,
  type ThaiSsoContributionResult,
  type SsoDeadlineOptions,
  type SsoFilingDeadlineResult,
} from "../operations/thai-sso.js";
import {
  calculateProbationEndDate,
  calculateServiceTenure,
  calculateThaiSeverancePay,
  type ProbationOptions,
  type ProbationScheduleResult,
  type ServiceTenureOptions,
  type ServiceTenureResult,
  type ThaiSeveranceTierCode,
  type ThaiSeverancePayOptions,
  type ThaiSeverancePayResult,
} from "../operations/thai-labour.js";
import { thailandHolidays, thailandBankHolidays } from "../holidays/index.js";
import {
  formatDate,
  formatThaiOfficialPreset,
  formatThaiShortDatePreset,
  formatThaiSlashDatePreset,
} from "../format/index.js";
import type { PublicHoliday } from "../holidays/types.js";
import type { LocalDate } from "../public-types.js";

export {
  getThaiFiscalYear,
  getThaiFiscalQuarter,
  getThaiFiscalYearRange,
  getTaxFilingDeadline,
  getAllMonthlyTaxDeadlines,
  calculateWorkShiftDuration,
  calculateNetBusinessMinutes,
  calculateSlaDeadline,
  calculateOvertime,
  calculateThaiOvertimePay,
  parseTimeToMinutes,
  formatMinutesToTime,
  getThaiLunarDate,
  isWanPhra,
  getWanPhraInMonth,
  formatThaiLunarDate,
  adjustBusinessDate,
  calculateDayCountFraction,
  calculateAccruedInterest,
  calculatePaymentDueDate,
  getThaiSsoWageCeiling,
  calculateThaiSsoContribution,
  getSsoFilingDeadline,
  calculateProbationEndDate,
  calculateServiceTenure,
  calculateThaiSeverancePay,
  thailandHolidays,
  thailandBankHolidays,
  formatThaiOfficialPreset,
  formatThaiShortDatePreset,
  formatThaiSlashDatePreset,
};

export type {
  ThaiDateInput,
  ThaiFiscalYearInfo,
  ThaiTaxForm,
  TaxDeadlineOptions,
  TaxFilingDeadlineResult,
  WorkShiftWindow,
  WorkShiftDurationResult,
  BreakInterval,
  NetBusinessMinutesOptions,
  NetBusinessMinutesResult,
  SlaDeadlineResult,
  WorkedInterval,
  WorkSchedule,
  OvertimeResult,
  ThaiOvertimePayOptions,
  ThaiOvertimePayResult,
  ThaiLunarDate,
  DayCountConvention,
  BusinessDayConvention,
  DayCountResult,
  AccruedInterestOptions,
  AccruedInterestResult,
  CreditTermPreset,
  CreditTermInput,
  PaymentDueDateOptions,
  PaymentDueDateResult,
  ThaiSsoWageCeilingInfo,
  ThaiSsoContributionOptions,
  ThaiSsoContributionResult,
  SsoDeadlineOptions,
  SsoFilingDeadlineResult,
  ProbationOptions,
  ProbationScheduleResult,
  ServiceTenureOptions,
  ServiceTenureResult,
  ThaiSeveranceTierCode,
  ThaiSeverancePayOptions,
  ThaiSeverancePayResult,
};

/**
 * Unified Thai Enterprise Suite namespace for Fiscal Year, Revenue Department Tax Deadlines,
 * Labour Law Overtime (OT) & Shift SLA, Buddhist Lunar Phase (Wan Phra), and Bank of Thailand (BOT) settlement.
 */
export const thai = {
  /** Calculates Thai Government Fiscal Year (1 Oct – 30 Sep) and Buddhist Era details. */
  fiscalYear: getThaiFiscalYear,
  /** Returns the Thai Government Fiscal Quarter (1 to 4). */
  fiscalQuarter: getThaiFiscalQuarter,
  /** Returns the start and end dates for a given Thai Government Fiscal Year (CE or BE). */
  fiscalYearRange: getThaiFiscalYearRange,
  /** Computes official Revenue Department tax filing deadline (PND1, PND3, PND53, PP30, PND50, PND51). */
  taxDeadline: getTaxFilingDeadline,
  /** Computes all monthly withholding & VAT filing deadlines for a given year and month. */
  allMonthlyTaxDeadlines: getAllMonthlyTaxDeadlines,
  /** Classifies worked intervals into 1.0x, 1.5x, 2.0x, and 3.0x overtime hours per Thai Labour Law. */
  overtime: calculateOvertime,
  /** Calculates both overtime hours breakdown and monetary compensation (THB) per Thai Labour Law. */
  overtimePay: calculateThaiOvertimePay,
  /** Calculates net working business minutes deducting lunch/tea breaks, weekends, and holidays. */
  netBusinessMinutes: calculateNetBusinessMinutes,
  /** Calculates exact SLA completion date and time given required net working minutes. */
  slaDeadline: calculateSlaDeadline,
  /** Computes gross, break, and net working duration for a single shift window. */
  workShiftDuration: calculateWorkShiftDuration,
  /** Calculates Thai Buddhist Lunar Calendar phase (ข้างขึ้น/ข้างแรม 1-15 ค่ำ) and Wan Phra status. */
  lunar: getThaiLunarDate,
  /** Returns true if the given date is a Thai Buddhist Holy Day (วันพระ). */
  isWanPhra,
  /** Returns all Wan Phra dates in a given Gregorian year and month. */
  wanPhraInMonth: getWanPhraInMonth,
  /** Formats a Thai lunar date or input date into traditional Thai phrase (e.g. "ขึ้น ๑๕ ค่ำ เดือน ๑๑"). */
  formatLunar: formatThaiLunarDate,
  /** Checks if a date is an official Bank of Thailand (ธปท.) financial holiday. */
  isBankHoliday: (date: ThaiDateInput): boolean =>
    _isBankHoliday(resolveThaiLocalDate(date), "TH-BOT"),
  /** Returns all official Bank of Thailand (ธปท.) holidays for a given Gregorian year. */
  getBankHolidays: (year: number): readonly PublicHoliday[] =>
    _getBankHolidays(year, "TH-BOT"),
  /** Checks if a date is an open financial settlement business day under Bank of Thailand rules. */
  isBankBusinessDay: (date: ThaiDateInput): boolean =>
    _isBankBusinessDay(resolveThaiLocalDate(date), "TH-BOT"),
  /** Adds financial settlement business days according to Bank of Thailand calendar. */
  addBankBusinessDays: (date: ThaiDateInput, amount: number): LocalDate =>
    _addBankBusinessDays(resolveThaiLocalDate(date), amount, "TH-BOT"),
  /** Computes difference in financial settlement business days according to Bank of Thailand calendar. */
  diffInBankBusinessDays: (
    startDate: ThaiDateInput,
    endDate: ThaiDateInput,
  ): number =>
    _diffInBankBusinessDays(
      resolveThaiLocalDate(startDate),
      resolveThaiLocalDate(endDate),
      "TH-BOT",
    ),
  /** Formats date using official Thai government preset (e.g. "วันที่ 18 ตุลาคม พ.ศ. 2569"). */
  formatOfficial: (
    date: ThaiDateInput,
    options?: { thaiDigits?: boolean; withWeekday?: boolean },
  ): string =>
    formatDate(resolveThaiLocalDate(date), {
      locale: "th-TH",
      calendar: "buddhist",
      preset: options?.withWeekday
        ? "thai-official-date-with-weekday"
        : "thai-official-date",
      numberingSystem: options?.thaiDigits ? "thai" : "latn",
    }),
  /** Formats date using short Thai preset (e.g. "18 ต.ค. 2569"). */
  formatShortDate: (
    date: ThaiDateInput,
    options?: { thaiDigits?: boolean },
  ): string =>
    formatDate(resolveThaiLocalDate(date), {
      locale: "th-TH",
      calendar: "buddhist",
      preset: "thai-short-date",
      numberingSystem: options?.thaiDigits ? "thai" : "latn",
    }),
  /** Formats date using Thai slash preset (e.g. "18/10/2569"). */
  formatSlashDate: (
    date: ThaiDateInput,
    options?: { thaiDigits?: boolean },
  ): string =>
    formatDate(resolveThaiLocalDate(date), {
      locale: "th-TH",
      calendar: "buddhist",
      preset: "thai-slash-date",
      numberingSystem: options?.thaiDigits ? "thai" : "latn",
    }),
  /** Adjusts date using financial Business Day Conventions ("following", "modified-following", "preceding", "unadjusted"). */
  adjustBusinessDate,
  /** Calculates financial day-count fraction ("ACT/365", "ACT/360", "ACT/ACT", "30/360"). */
  dayCountFraction: calculateDayCountFraction,
  /** Calculates accrued interest (gross, withholding tax, net) in THB using standard day-count conventions. */
  accruedInterest: calculateAccruedInterest,
  /** Computes AP/AR commercial payment due date ("NET30", "NET60", "EOM", "EOM+30") with billing cut-off and BOT holiday rolling. */
  paymentDueDate: calculatePaymentDueDate,
  /** Returns official Thai Social Security (ประกันสังคม) stepped wage ceiling (15k / 17.5k / 20k / 23k) for a given year or date. */
  ssoWageCeiling: getThaiSsoWageCeiling,
  /** Calculates monthly Thai Social Security (มาตรา 33 / มาตรา 39) employee & employer contributions. */
  ssoContribution: calculateThaiSsoContribution,
  /** Computes official SSO monthly filing deadline (สปส. 1-10: 15th of following month + e-Payment 7 business days). */
  ssoDeadline: getSsoFilingDeadline,
  /** Computes HR probation milestones (119th day cutoff before severance, 120th day severance eligibility, evaluation date). */
  probation: calculateProbationEndDate,
  /** Computes exact continuous employee service tenure (`years`, `months`, `days`, `totalDays`) under Thai Labour Law. */
  serviceTenure: calculateServiceTenure,
  /** Computes statutory severance pay across all 6 tiers of Section 118 (30 to 400 days) + 600,000 THB tax exemption. */
  severancePay: calculateThaiSeverancePay,
} as const;
