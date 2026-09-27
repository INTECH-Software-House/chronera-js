/**
 * Chronera Scheduling Engine Subpath Barrel
 *
 * Provides enterprise scheduling capabilities:
 * - RFC 5545 Recurrence Rules (RRULE)
 * - RFC 5545 iCalendar (.ics) generation & parsing
 * - Standard 5-field Cron expression evaluation & humanization
 * - Interval arithmetic, splitting, and step iteration
 * - Recurring schedule builder
 * - Financial accounting periods
 * - Time-series bucketing & gap filling
 */

export {
  parseRRule,
  rruleToString,
  rruleToHuman,
} from "../operations/rrule.js";

export type {
  RRuleFrequency,
  RRuleWeekday,
  ByDayRule,
  RRuleOptions,
  RRuleJob,
} from "../operations/rrule.js";

export { generateICS, parseICS } from "../operations/icalendar.js";

export type {
  ICSOrganizer,
  ICSAttendee,
  ICSEventInput,
  ICSCalendarOptions,
  ParsedICSEvent,
  ParsedICSCalendar,
} from "../operations/icalendar.js";

export {
  parseCron,
  isCronMatch,
  cronNextRun,
  cronNextN,
  cronPrevRun,
  cronToHuman,
} from "../operations/cron.js";

export type { CronJob, CronFields } from "../operations/cron.js";

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
} from "../operations/interval.js";

export {
  recur,
  getOccurrences,
  isOccurrence,
} from "../operations/recurrence.js";

export type {
  RecurrenceFrequency,
  DayOfWeek,
  RecurrenceRule,
  RecurrenceBuilder,
  FrequencySelector,
  RecurrenceRuleBuilder,
} from "../operations/recurrence.js";

export {
  financialPeriods,
  priorYearSamePeriod,
  priorPeriod,
  isYTD,
} from "../operations/financial-periods.js";

export type {
  FinancialPeriodsOptions,
  FinancialPeriodsResult,
} from "../operations/financial-periods.js";

export { timeBuckets } from "../operations/time-buckets.js";

export type {
  TimeBucketGranularity,
  TimeBucketOptions,
  TimeBucketResult,
} from "../operations/time-buckets.js";
