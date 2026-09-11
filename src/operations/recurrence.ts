import {
  addDays,
  addMonths,
  addYears,
  getAbsoluteDay,
  isAfter,
} from "./convenience.js";

import type { DateOrCalendarDate } from "../public-types.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface RecurrenceRule {
  readonly frequency: RecurrenceFrequency;
  readonly interval: number;
  readonly daysOfWeek?: DayOfWeek[];
  readonly until?: DateOrCalendarDate;
  readonly count?: number;
}

// ---------------------------------------------------------------------------
// Builder Interfaces
// ---------------------------------------------------------------------------

export interface RecurrenceBuilder {
  every(n: number): FrequencySelector;
}

export interface FrequencySelector {
  days(): RecurrenceRuleBuilder;
  weeks(): RecurrenceRuleBuilder;
  months(): RecurrenceRuleBuilder;
  years(): RecurrenceRuleBuilder;
}

export interface RecurrenceRuleBuilder {
  on(days: DayOfWeek[]): RecurrenceRuleBuilder;
  until(date: DateOrCalendarDate): RecurrenceRuleBuilder;
  count(n: number): RecurrenceRuleBuilder;
  next(n: number): DateOrCalendarDate[];
  occurrences(): DateOrCalendarDate[];
  build(): RecurrenceRule;
}

// ---------------------------------------------------------------------------
// Day-of-week mapping
// ---------------------------------------------------------------------------

// absoluteDay % 7 → correct mapping per actual absoluteDayFromGregorianFields:
// Thursday=0, Friday=1, Saturday=2, Sunday=3, Monday=4, Tuesday=5, Wednesday=6
const DOW_INDEX: Record<DayOfWeek, number> = {
  thursday: 0,
  friday: 1,
  saturday: 2,
  sunday: 3,
  monday: 4,
  tuesday: 5,
  wednesday: 6,
};

// ---------------------------------------------------------------------------
// Core computation
// ---------------------------------------------------------------------------

const MAX_OCCURRENCES = 500;
const MAX_YEARS_AHEAD = 50;

/**
 * Computes all occurrences of a recurring schedule.
 */
export function getOccurrences<T extends DateOrCalendarDate>(
  startDate: T,
  rule: RecurrenceRule,
  limit?: number,
): T[] {
  const maxCount = Math.min(limit ?? MAX_OCCURRENCES, MAX_OCCURRENCES);
  const results: T[] = [];

  // Compute absolute "50 years from start" safety boundary
  const farFuture = addYears(startDate, MAX_YEARS_AHEAD, "constrain");

  const withinBounds = (date: T): boolean => {
    if (rule.until && isAfter(date, rule.until as T)) return false;
    if (isAfter(date, farFuture)) return false;
    return true;
  };

  const withinCount = (): boolean => {
    if (rule.count !== undefined && results.length >= rule.count) return false;
    return true;
  };

  switch (rule.frequency) {
    case "daily": {
      let current = startDate;
      while (
        withinBounds(current) &&
        withinCount() &&
        results.length < maxCount
      ) {
        results.push(current);
        current = addDays(current, rule.interval);
      }
      break;
    }

    case "weekly": {
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        // For weekly with daysOfWeek: iterate week by week (interval * 7 days)
        // Within each week boundary, include occurrences on matching days of week
        const startAbs = getAbsoluteDay(startDate);
        const dowTargets = new Set(rule.daysOfWeek.map((d) => DOW_INDEX[d]));

        // DOW offset: we need to know startDate's day of week
        // Find the start-of-week (Sunday) for startDate
        // We'll iterate day by day within each week window

        let weekAnchor = startDate;
        let done = false;

        while (!done) {
          // Check each day of the 7-day window starting at weekAnchor
          for (let i = 0; i < 7 && !done; i++) {
            const candidate = addDays(weekAnchor, i);
            const candidateAbs = getAbsoluteDay(candidate);

            // Must not be before startDate
            if (candidateAbs < startAbs) continue;

            const dow = ((candidateAbs % 7) + 7) % 7;
            if (dowTargets.has(dow)) {
              if (
                !withinBounds(candidate) ||
                !withinCount() ||
                results.length >= maxCount
              ) {
                done = true;
                break;
              }
              results.push(candidate);
            }
          }

          if (!done) {
            weekAnchor = addDays(weekAnchor, rule.interval * 7);
            if (!withinBounds(weekAnchor) || results.length >= maxCount) {
              done = true;
            }
          }
        }
      } else {
        // Simple weekly: every interval * 7 days
        let current = startDate;
        while (
          withinBounds(current) &&
          withinCount() &&
          results.length < maxCount
        ) {
          results.push(current);
          current = addDays(current, rule.interval * 7);
        }
      }
      break;
    }

    case "monthly": {
      let current = startDate;
      while (
        withinBounds(current) &&
        withinCount() &&
        results.length < maxCount
      ) {
        results.push(current);
        current = addMonths(current, rule.interval, "constrain");
      }
      break;
    }

    case "yearly": {
      let current = startDate;
      while (
        withinBounds(current) &&
        withinCount() &&
        results.length < maxCount
      ) {
        results.push(current);
        current = addYears(current, rule.interval, "constrain");
      }
      break;
    }
  }

  return results;
}

/**
 * Returns true if the given date is an occurrence of the recurrence rule starting from startDate.
 */
export function isOccurrence<T extends DateOrCalendarDate>(
  date: T,
  startDate: T,
  rule: RecurrenceRule,
): boolean {
  const dateAbs = getAbsoluteDay(date);
  const startAbs = getAbsoluteDay(startDate);

  if (dateAbs < startAbs) return false;
  if (rule.until && isAfter(date, rule.until as T)) return false;

  const diff = dateAbs - startAbs;

  switch (rule.frequency) {
    case "daily":
      return diff % rule.interval === 0;

    case "weekly": {
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        // Check if the week offset is a multiple of interval
        const weekDiff = Math.floor(diff / 7);
        if (weekDiff % rule.interval !== 0) return false;
        // Check if the day of week matches
        const dow = ((dateAbs % 7) + 7) % 7;
        return rule.daysOfWeek.some((d) => DOW_INDEX[d] === dow);
      }
      return diff % (rule.interval * 7) === 0;
    }

    case "monthly": {
      // Compute how many months apart the two dates are
      // and check that diff is an exact multiple of rule.interval months
      // by stepping through
      let cursor = startDate;
      let monthCount = 0;
      const targetAbs = dateAbs;

      while (getAbsoluteDay(cursor) <= targetAbs) {
        const cursorAbs = getAbsoluteDay(cursor);
        if (cursorAbs === targetAbs && monthCount % rule.interval === 0) {
          return true;
        }
        if (cursorAbs > targetAbs) break;
        cursor = addMonths(cursor, rule.interval, "constrain");
        monthCount += rule.interval;

        if (monthCount > 12 * MAX_YEARS_AHEAD) break;
      }
      return false;
    }

    case "yearly": {
      let cursor = startDate;
      let yearCount = 0;
      const targetAbs = dateAbs;

      while (getAbsoluteDay(cursor) <= targetAbs) {
        if (getAbsoluteDay(cursor) === targetAbs) return true;
        cursor = addYears(cursor, rule.interval, "constrain");
        yearCount += rule.interval;
        if (yearCount > MAX_YEARS_AHEAD) break;
      }
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Fluent Builder Implementation
// ---------------------------------------------------------------------------

class RecurrenceRuleBuilderImpl implements RecurrenceRuleBuilder {
  private _startDate: DateOrCalendarDate;
  private _frequency: RecurrenceFrequency;
  private _interval: number;
  private _daysOfWeek?: DayOfWeek[];
  private _until?: DateOrCalendarDate;
  private _count?: number;

  constructor(
    startDate: DateOrCalendarDate,
    frequency: RecurrenceFrequency,
    interval: number,
  ) {
    this._startDate = startDate;
    this._frequency = frequency;
    this._interval = interval;
  }

  on(days: DayOfWeek[]): RecurrenceRuleBuilder {
    this._daysOfWeek = days;
    return this;
  }

  until(date: DateOrCalendarDate): RecurrenceRuleBuilder {
    this._until = date;
    return this;
  }

  count(n: number): RecurrenceRuleBuilder {
    this._count = n;
    return this;
  }

  build(): RecurrenceRule {
    const rule: {
      frequency: RecurrenceFrequency;
      interval: number;
      daysOfWeek?: DayOfWeek[];
      until?: DateOrCalendarDate;
      count?: number;
    } = {
      frequency: this._frequency,
      interval: this._interval,
    };
    if (this._daysOfWeek) rule.daysOfWeek = this._daysOfWeek;
    if (this._until) rule.until = this._until;
    if (this._count !== undefined) rule.count = this._count;
    return rule;
  }

  next(n: number): DateOrCalendarDate[] {
    return getOccurrences(this._startDate, this.build(), n);
  }

  occurrences(): DateOrCalendarDate[] {
    return getOccurrences(this._startDate, this.build());
  }
}

class FrequencySelectorImpl implements FrequencySelector {
  private _startDate: DateOrCalendarDate;
  private _interval: number;

  constructor(startDate: DateOrCalendarDate, interval: number) {
    this._startDate = startDate;
    this._interval = interval;
  }

  days(): RecurrenceRuleBuilder {
    return new RecurrenceRuleBuilderImpl(
      this._startDate,
      "daily",
      this._interval,
    );
  }

  weeks(): RecurrenceRuleBuilder {
    return new RecurrenceRuleBuilderImpl(
      this._startDate,
      "weekly",
      this._interval,
    );
  }

  months(): RecurrenceRuleBuilder {
    return new RecurrenceRuleBuilderImpl(
      this._startDate,
      "monthly",
      this._interval,
    );
  }

  years(): RecurrenceRuleBuilder {
    return new RecurrenceRuleBuilderImpl(
      this._startDate,
      "yearly",
      this._interval,
    );
  }
}

class RecurrenceBuilderImpl implements RecurrenceBuilder {
  private _startDate: DateOrCalendarDate;

  constructor(startDate: DateOrCalendarDate) {
    this._startDate = startDate;
  }

  every(n: number): FrequencySelector {
    return new FrequencySelectorImpl(this._startDate, n);
  }
}

/**
 * Creates a fluent recurrence builder anchored to the given start date.
 *
 * @example
 * ```ts
 * const dates = recur(localDate(2026, 1, 1))
 *   .every(1).weeks()
 *   .on(['monday', 'wednesday', 'friday'])
 *   .until(localDate(2026, 3, 31))
 *   .occurrences();
 * ```
 */
export function recur<T extends DateOrCalendarDate>(
  startDate: T,
): RecurrenceBuilder {
  return new RecurrenceBuilderImpl(startDate);
}
