export { chronera, Chronera } from "./chronera.js";
export type { ChroneraInput } from "./chronera.js";
export { createChronera } from "./create-chronera.js";

export { parseRRule, rruleToString, rruleToHuman } from "./operations/rrule.js";

export type {
  RRuleFrequency,
  RRuleWeekday,
  ByDayRule,
  RRuleOptions,
  RRuleJob,
} from "./operations/rrule.js";

export { generateICS, parseICS } from "./operations/icalendar.js";

export type {
  ICSOrganizer,
  ICSAttendee,
  ICSEventInput,
  ICSCalendarOptions,
  ParsedICSEvent,
  ParsedICSCalendar,
} from "./operations/icalendar.js";

export {
  financialPeriods,
  priorYearSamePeriod,
  priorPeriod,
  isYTD,
} from "./operations/financial-periods.js";

export type {
  FinancialPeriodsOptions,
  FinancialPeriodsResult,
} from "./operations/financial-periods.js";

export { timeBuckets } from "./operations/time-buckets.js";

export type {
  TimeBucketGranularity,
  TimeBucketOptions,
  TimeBucketResult,
} from "./operations/time-buckets.js";

export {
  parseCron,
  isCronMatch,
  cronNextRun,
  cronNextN,
  cronPrevRun,
  cronToHuman,
} from "./operations/cron.js";

export type { CronJob, CronFields } from "./operations/cron.js";

export {
  generateMonthGrid,
  getMonthMatrix,
  generateYearGrid,
  getAdjacentMonths,
  getWeekDaysHeader,
} from "./operations/calendar-grid.js";

export type {
  WeekStartDay,
  WeekdayHeaderFormat,
  MonthGridOptions,
  CalendarGridCell,
  MonthGridResult,
} from "./operations/calendar-grid.js";

export {
  worldClock,
  findOverlapHours,
  isDSTAtInstant,
  getNextDSTTransition,
} from "./operations/world-clock.js";

export type {
  WorldClockEntry,
  MeetingParticipant,
  MeetingWindow,
  DSTTransition,
} from "./operations/world-clock.js";

export {
  parseNaturalDate,
  safeParseNaturalDate,
  parseNaturalDateDebug,
} from "./operations/natural-language.js";

export type {
  ParseNaturalDateOptions,
  ParseNaturalDateResult,
} from "./operations/natural-language.js";

export {
  calculateAge,
  nextBirthday,
  daysUntilBirthday,
  isBirthday,
  isMilestoneAge,
  countdown,
  timeElapsed,
} from "./operations/age-countdown.js";

export type {
  AgeResult,
  CountdownResult,
  ElapsedResult,
} from "./operations/age-countdown.js";

export {
  bucketDates,
  bucketByDay,
  bucketByWeek,
  bucketByMonth,
  bucketByQuarter,
  bucketByYear,
  histogram,
  sortDates,
  minDate,
  maxDate,
  nearestDate,
  uniqueDates,
} from "./operations/time-series.js";

export type {
  BucketUnit,
  BucketKey,
  HistogramEntry,
} from "./operations/time-series.js";

export {
  compareInstants,
  compareLocalDates,
  sameAbsoluteDate,
  sameCalendarDate,
} from "./operations/compare.js";

export {
  getAbsoluteDay,
  isBefore,
  isAfter,
  isEqual,
  isSameDay,
  isBetween,
  isToday,
  addDays,
  subtractDays,
  addMonths,
  subtractMonths,
  addYears,
  subtractYears,
  diffInDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "./operations/convenience.js";

export {
  startOfDay,
  endOfDay,
  isPast,
  isFuture,
  addHours,
  subtractHours,
  addMinutes,
  subtractMinutes,
  addSeconds,
  subtractSeconds,
} from "./operations/time-convenience.js";

export {
  isWeekend,
  isWeekday,
  isBusinessDay,
  addBusinessDays,
  subtractBusinessDays,
  diffInBusinessDays,
  isBankBusinessDay,
  addBankBusinessDays,
  diffInBankBusinessDays,
  createCorporateCalendar,
} from "./operations/business-days.js";

export {
  isBusinessHour,
  addBusinessHours,
  subtractBusinessHours,
  diffInBusinessHours,
  nextBusinessShift,
  startOfBusinessDay,
  endOfBusinessDay,
} from "./operations/business-hours.js";

export {
  isPublicHoliday,
  getPublicHolidays,
  getHolidayDetails,
  getHolidayDetailsAll,
  isBankHoliday,
  getBankHolidays,
} from "./operations/holidays.js";

export {
  timeAgo,
  formatDistance,
  formatDistanceToNow,
} from "./operations/relative-time.js";

export type {
  TimeAgoOptions,
  FormatDistanceOptions,
  RelativeTimeUnit,
} from "./operations/relative-time.js";

export {
  registerHolidayCalendar,
  getHolidayCalendar,
  resolveAnnualHolidays,
  calculateEasterSunday,
  calculateGoodFriday,
  calculateEasterMonday,
  calculateAscensionDay,
  calculateWhitMonday,
  BUILT_IN_HOLIDAYS,
  thailandHolidays,
  thailandBankHolidays,
  japanHolidays,
  saudiArabiaHolidays,
  uaeHolidays,
  iranHolidays,
  taiwanHolidays,
  indiaHolidays,
  singaporeHolidays,
  unitedStatesHolidays,
  unitedKingdomHolidays,
  germanyHolidays,
  franceHolidays,
  australiaHolidays,
  chinaHolidays,
  hongKongHolidays,
} from "./holidays/index.js";

export type {
  CountryCode,
  PublicHoliday,
  HolidayCalendar,
  HolidayRule,
  HolidayOptions,
  ObservedRollRule,
  HolidayTarget,
  CorporateCalendarConfig,
} from "./holidays/types.js";

export type { BusinessDaysOptions } from "./operations/business-days.js";
export type {
  ShiftWindow,
  BusinessSchedule,
  NormalizedShift,
  BusinessTimeInput,
  NextBusinessShiftOptions,
  NextBusinessShiftResult,
} from "./operations/business-hours.js";

export {
  formatInTimeZone,
  getTimeZoneOffset,
  isSameTimeZone,
} from "./operations/timezone.js";

export { convertCalendarDate } from "./operations/convert-calendar-date.js";

export {
  daysInMonth,
  getCalendarCapabilities,
  isLeapYear,
  isValidCalendarDate,
} from "./operations/validate.js";

export { getIsoWeek, formatIsoWeek } from "./operations/iso-week.js";

export {
  getDayOfYear,
  getDayOfYearWithRegistry,
  formatOrdinalDate,
} from "./operations/day-of-year.js";

export {
  toJulianDayNumber,
  toModifiedJulianDay,
  localDateFromJulianDayNumber,
  localDateFromModifiedJulianDay,
} from "./operations/julian-day.js";

export { getQuarter, getFiscalYear } from "./operations/fiscal.js";

export {
  formatDate,
  formatDateRange,
  formatDateTime,
  formatRelative,
  formatTime,
  formatWithPattern,
  formatRfc2822,
  formatJapaneseOfficialPreset,
  formatJapaneseOfficialWithWeekdayPreset,
  formatTaiwanOfficialPreset,
  formatThaiOfficialPreset,
  formatArabicGregorianPreset,
  formatArabicHijriPreset,
  formatChineseShortPreset,
  formatChineseStandardPreset,
  formatChineseWithWeekdayPreset,
  formatFrenchLongPreset,
  formatFrenchStandardPreset,
  formatFrenchWithWeekdayPreset,
  formatGermanDinStandardPreset,
  formatGermanLongPreset,
  formatGermanWithWeekdayPreset,
  formatJapaneseEraShortPreset,
  formatJapaneseSeirekiPreset,
  formatSpanishLongPreset,
  formatSpanishStandardPreset,
  formatSpanishWithWeekdayPreset,
  formatThaiShortDatePreset,
  formatThaiSlashDatePreset,
  formatUkLongPreset,
  formatUkStandardPreset,
  formatUkWithWeekdayPreset,
  formatUsLongPreset,
  formatUsStandardPreset,
  formatUsWithWeekdayPreset,
} from "./format/index.js";

export {
  parseInstant,
  parseLocalDate,
  safeParseInstant,
  safeParseLocalDate,
} from "./parse/index.js";

export {
  instantFromDate,
  instantFromEpochMilliseconds,
  instantFromEpochSeconds,
} from "./core/instant.js";

export { getRuntimeCapabilities } from "./runtime/capabilities.js";

export { calendarDate } from "./core/calendar-date.js";

export { localDate, createLocalDate } from "./core/local-date.js";

export { localTime } from "./core/local-time.js";

export { localDateTime } from "./core/local-date-time.js";

export { zonedDateTime } from "./core/zoned-date-time.js";

export {
  createZonedDateTime,
  getZonedFields,
  withTimeZone,
  withCalendar,
  addZonedDuration,
  subtractZonedDuration,
  diffZoned,
  formatZonedDateTime,
  zonedDateTimeToLocalDate,
  zonedDateTimeToLocalTime,
  zonedDateTimeToLocalDateTime,
  zonedDateTimeToInstant,
} from "./operations/zoned-operations.js";

export type {
  DisambiguationOption,
  ZonedDateTimeFields,
  ZonedFields,
  CreateZonedOptions,
} from "./public-types.js";

export { isIXDTF, parseIXDTF, formatIXDTF } from "./operations/ixdtf.js";

export type {
  ParseIXDTFOptions,
  FormatIXDTFOptions,
} from "./operations/ixdtf.js";

export { dateRange } from "./core/range.js";

export {
  ChroneraError,
  ChroneraParseError,
  ChroneraRangeError,
  ChroneraUnsupportedError,
} from "./errors/index.js";

export {
  rangeContains,
  rangeOverlaps,
  rangeIntersection,
  rangeUnion,
  rangeLengthInDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  splitByDay,
  splitByWeek,
  splitByMonth,
} from "./operations/interval.js";

export {
  parseDuration,
  durationToISO,
  durationToHuman,
  addDuration,
  subtractDuration,
  diffAsDuration,
  addDurations,
  scaleDuration,
  durationTotalDays,
} from "./operations/duration-ops.js";

export {
  recur,
  getOccurrences,
  isOccurrence,
} from "./operations/recurrence.js";

export type {
  RecurrenceFrequency,
  DayOfWeek,
  RecurrenceRule,
  RecurrenceBuilder,
  FrequencySelector,
  RecurrenceRuleBuilder,
} from "./operations/recurrence.js";

export type {
  BuiltInCalendarId,
  CalendarPlugin,
  CalendarCapabilities,
  CalendarConversionMetadata,
  CalendarConversionResult,
  CalendarDate,
  CalendarId,
  ChroneraErrorCode,
  ChroneraConfig,
  ChroneraInstance,
  ChroneraIssue,
  Comparison,
  ConvertCalendarOptions,
  DateOrCalendarDate,
  DateRange,
  DayOfYearFields,
  Duration,
  EraId,
  FiscalFields,
  FiscalOptions,
  FormatDateBaseOptions,
  FormatDateInput,
  FormatDateOptions,
  FormatDateRangeOptions,
  FormatDateTimeOptions,
  FormatInTimeZoneOptions,
  FormatRelativeOptions,
  FormatTimeOptions,
  Instant,
  IntervalInclusivity,
  IsoWeekFields,
  LocalDate,
  LocalDateTime,
  LocalTime,
  LocaleId,
  MonthCode,
  NumberingSystemId,
  PatternFormatOptions,
  ParseInstantOptions,
  ParseLocalDateOptions,
  PresetName,
  QuarterNumber,
  ResolvedChroneraOptions,
  Rfc2822Options,
  RuntimeCapabilities,
  SafeParseResult,
  SameTimeZoneOptions,
  TimeZoneId,
  TimeZoneOffsetFormat,
  TimeOrDateTimeOrInstant,
  ZonedDateTime,
} from "./public-types.js";

export {
  convertDayjsPattern,
  isDayjsPattern,
  formatDayjs,
} from "./compat/index.js";

export {
  standardChronera,
  standardLocalDate,
  standardInstant,
  standardZonedDateTime,
} from "./standard/index.js";

export type {
  StandardSchemaV1,
  StandardChroneraOptions,
  StandardIssue,
  StandardResult,
} from "./standard/index.js";

export type { DateLike } from "./chronera.js";

import { chronera as _chronera } from "./chronera.js";
import {
  isBankBusinessDay as _isBankBusinessDay,
  addBankBusinessDays as _addBankBusinessDays,
  diffInBankBusinessDays as _diffInBankBusinessDays,
} from "./operations/business-days.js";
import {
  isBankHoliday as _isBankHoliday,
  getBankHolidays as _getBankHolidays,
} from "./operations/holidays.js";
import {
  getThaiFiscalYear,
  getThaiFiscalQuarter,
  getThaiFiscalYearRange,
  getTaxFilingDeadline,
  getAllMonthlyTaxDeadlines,
  type ThaiDateInput,
} from "./operations/thai-fiscal.js";
import {
  calculateWorkShiftDuration,
  calculateNetBusinessMinutes,
  calculateSlaDeadline,
  calculateOvertime,
  calculateThaiOvertimePay,
  parseTimeToMinutes,
  formatMinutesToTime,
} from "./operations/advanced-shifts.js";
import {
  getThaiLunarDate,
  isWanPhra,
  getWanPhraInMonth,
  formatThaiLunarDate,
} from "./operations/thai-lunar.js";
import type { PublicHoliday } from "./holidays/types.js";
import type { LocalDate } from "./public-types.js";

export {
  getThaiFiscalYear,
  getThaiFiscalQuarter,
  getThaiFiscalYearRange,
  getTaxFilingDeadline,
  getAllMonthlyTaxDeadlines,
};

export type {
  ThaiDateInput,
  ThaiFiscalYearInfo,
  ThaiTaxForm,
  TaxDeadlineOptions,
  TaxFilingDeadlineResult,
} from "./operations/thai-fiscal.js";

export {
  calculateWorkShiftDuration,
  calculateNetBusinessMinutes,
  calculateSlaDeadline,
  calculateOvertime,
  calculateThaiOvertimePay,
  parseTimeToMinutes,
  formatMinutesToTime,
};

export type {
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
} from "./operations/advanced-shifts.js";

export { getThaiLunarDate, isWanPhra, getWanPhraInMonth, formatThaiLunarDate };

export type { ThaiLunarDate } from "./operations/thai-lunar.js";

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
    _isBankHoliday(_chronera(date).toLocalDate(), "TH-BOT"),
  /** Returns all official Bank of Thailand (ธปท.) holidays for a given Gregorian year. */
  getBankHolidays: (year: number): readonly PublicHoliday[] =>
    _getBankHolidays(year, "TH-BOT"),
  /** Checks if a date is an open financial settlement business day under Bank of Thailand rules. */
  isBankBusinessDay: (date: ThaiDateInput): boolean =>
    _isBankBusinessDay(_chronera(date).toLocalDate(), "TH-BOT"),
  /** Adds financial settlement business days according to Bank of Thailand calendar. */
  addBankBusinessDays: (date: ThaiDateInput, amount: number): LocalDate =>
    _addBankBusinessDays(_chronera(date).toLocalDate(), amount, "TH-BOT"),
  /** Computes difference in financial settlement business days according to Bank of Thailand calendar. */
  diffInBankBusinessDays: (
    startDate: ThaiDateInput,
    endDate: ThaiDateInput,
  ): number =>
    _diffInBankBusinessDays(
      _chronera(startDate).toLocalDate(),
      _chronera(endDate).toLocalDate(),
      "TH-BOT",
    ),
} as const;

export { chroneraToJsonSchema } from "./operations/json-schema.js";

export type {
  JsonSchemaOptions,
  ChroneraJsonSchemaType,
} from "./operations/json-schema.js";
