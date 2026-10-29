import { addDays, getAbsoluteDay } from "./convenience.js";
import { isBusinessDay, isWeekend } from "./business-days.js";
import { ChroneraError } from "../errors/errors.js";
import { resolveThaiLocalDate, type ThaiDateInput } from "./thai-fiscal.js";

import type { LocalDate } from "../public-types.js";
import type { CountryCode } from "../holidays/types.js";

export interface BreakInterval {
  readonly start: string; // "HH:mm"
  readonly end: string; // "HH:mm"
}

export interface WorkShiftWindow {
  readonly start: string; // "HH:mm"
  readonly end: string; // "HH:mm"
  readonly breaks?: readonly BreakInterval[];
}

export interface WorkShiftDurationResult {
  readonly grossMinutes: number;
  readonly breakMinutes: number;
  readonly netMinutes: number;
  readonly netHours: number;
}

export interface NetBusinessMinutesOptions {
  readonly shifts?: readonly WorkShiftWindow[];
  readonly calendar?: string; // Country code e.g. "TH", "TH-BOT", "US"
  readonly isHoliday?: (date: LocalDate) => boolean;
}

export interface NetBusinessMinutesResult {
  readonly netMinutes: number;
  readonly netHours: number;
  readonly workingDaysCount: number;
  readonly weekendDaysCount: number;
  readonly holidayDaysCount: number;
}

export interface SlaDeadlineResult {
  readonly deadlineDate: LocalDate;
  readonly deadlineTime: string; // "HH:mm"
  readonly workingMinutesConsumed: number;
}

export interface WorkedInterval {
  readonly date: ThaiDateInput;
  readonly startTime: string; // "HH:mm"
  readonly endTime: string; // "HH:mm"
}

export interface WorkSchedule {
  readonly standardShift: WorkShiftWindow;
  readonly calendar?: string;
  readonly isHoliday?: (date: LocalDate) => boolean;
  readonly monthlyEmployee?: boolean; // Default true: holiday regular hours paid at 1.0x (monthly) vs 2.0x (daily)
}

export interface OvertimeResult {
  readonly regularHours: number; // 1.0x
  readonly workdayOvertimeHours: number; // 1.5x (Thai Labour Law Sec. 61)
  readonly holidayRegularHours: number; // 1.0x / 2.0x (Thai Labour Law Sec. 62)
  readonly holidayOvertimeHours: number; // 3.0x (Thai Labour Law Sec. 63)
  readonly totalWorkedHours: number;
  readonly totalEquivalentHours: number; // Multiplier-weighted hours
}

export interface ThaiOvertimePayOptions {
  /** Base hourly wage in THB. If omitted, derived from monthlySalary / (30 * 8 = 240). */
  readonly hourlyRate?: number;
  /** Monthly salary in THB (divided by 240 hours per Thai Labour Law standard). */
  readonly monthlySalary?: number;
  /** Worked intervals to classify automatically. */
  readonly workedIntervals?: readonly WorkedInterval[];
  /** Work schedule used when classifying workedIntervals. */
  readonly schedule?: WorkSchedule;
  /** Direct normal workday OT hours (1.5x). */
  readonly workdayOvertimeHours?: number;
  /** Direct holiday regular shift hours (1.0x for monthly salaried, 2.0x for daily wage). */
  readonly holidayRegularHours?: number;
  /** Direct holiday overtime hours (3.0x). */
  readonly holidayOvertimeHours?: number;
  /** Whether employee is monthly salaried (holiday regular = 1.0x) vs daily wage (2.0x). Default: true */
  readonly monthlyEmployee?: boolean;
}

export interface ThaiOvertimePayResult extends OvertimeResult {
  readonly hourlyRate: number;
  readonly workdayOvertimePay: number;
  readonly holidayRegularPay: number;
  readonly holidayOvertimePay: number;
  readonly totalOvertimePay: number;
}

export function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(":");
  if (parts.length < 2) {
    throw new ChroneraError(
      "CHRONERA_INVALID_TIME",
      `Invalid time string: ${timeStr}. Expected "HH:mm".`,
    );
  }
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (
    Number.isNaN(h) ||
    Number.isNaN(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    throw new ChroneraError(
      "CHRONERA_INVALID_TIME",
      `Invalid time components in: ${timeStr}.`,
    );
  }
  return h * 60 + m;
}

export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = Math.max(0, Math.min(1439, Math.floor(totalMinutes)));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

const resolveLocalDate = resolveThaiLocalDate;

/**
 * Computes net working minutes in a shift, deducting lunch and tea breaks.
 */
function getShiftActiveIntervals(
  shift: WorkShiftWindow,
): Array<[start: number, end: number]> {
  const shiftStart = parseTimeToMinutes(shift.start);
  const shiftEnd = parseTimeToMinutes(shift.end);
  if (shiftEnd <= shiftStart) return [];

  let intervals: Array<[number, number]> = [[shiftStart, shiftEnd]];

  if (shift.breaks) {
    for (const b of shift.breaks) {
      const bStart = parseTimeToMinutes(b.start);
      const bEnd = parseTimeToMinutes(b.end);
      if (bEnd <= bStart) continue;

      const nextIntervals: Array<[number, number]> = [];
      for (const [s, e] of intervals) {
        if (bEnd <= s || bStart >= e) {
          // No overlap
          nextIntervals.push([s, e]);
        } else {
          // Overlap: punch a hole
          if (bStart > s) {
            nextIntervals.push([s, bStart]);
          }
          if (bEnd < e) {
            nextIntervals.push([bEnd, e]);
          }
        }
      }
      intervals = nextIntervals;
    }
  }

  return intervals;
}

/**
 * Computes gross, break, and net working duration for a single shift window.
 */
export function calculateWorkShiftDuration(
  shift: WorkShiftWindow,
): WorkShiftDurationResult {
  const start = parseTimeToMinutes(shift.start);
  const end = parseTimeToMinutes(shift.end);
  const grossMinutes = Math.max(0, end - start);
  const activeIntervals = getShiftActiveIntervals(shift);
  const netMinutes = activeIntervals.reduce((acc, [s, e]) => acc + (e - s), 0);
  const breakMinutes = Math.max(0, grossMinutes - netMinutes);

  return {
    grossMinutes,
    breakMinutes,
    netMinutes,
    netHours: Math.round((netMinutes / 60) * 100) / 100,
  };
}

/**
 * Calculates net business minutes between start and end date/time,
 * skipping weekends, public holidays, and scheduled break intervals.
 */
export function calculateNetBusinessMinutes(
  startDate: ThaiDateInput,
  startTime: string,
  endDate: ThaiDateInput,
  endTime: string,
  options: NetBusinessMinutesOptions = {},
): NetBusinessMinutesResult {
  const startD = resolveLocalDate(startDate);
  const endD = resolveLocalDate(endDate);
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);

  const shifts = options.shifts ?? [
    {
      start: "08:30",
      end: "17:30",
      breaks: [{ start: "12:00", end: "13:00" }],
    },
  ];

  let current = startD;
  let netMinutes = 0;
  let workingDaysCount = 0;
  let weekendDaysCount = 0;
  let holidayDaysCount = 0;

  const isHol = (d: LocalDate): boolean => {
    if (options.isHoliday) return options.isHoliday(d);
    if (options.calendar) {
      return !isBusinessDay(d, { holidays: options.calendar as CountryCode });
    }
    return isWeekend(d);
  };

  while (getAbsoluteDay(current) <= getAbsoluteDay(endD)) {
    const isSameStart = getAbsoluteDay(current) === getAbsoluteDay(startD);
    const isSameEnd = getAbsoluteDay(current) === getAbsoluteDay(endD);

    if (isWeekend(current)) {
      weekendDaysCount++;
    } else if (isHol(current)) {
      holidayDaysCount++;
    } else {
      workingDaysCount++;
      const dayMinStart = isSameStart ? startMin : 0;
      const dayMinEnd = isSameEnd ? endMin : 1440;

      for (const shift of shifts) {
        const activeIntervals = getShiftActiveIntervals(shift);
        for (const [s, e] of activeIntervals) {
          const overlapStart = Math.max(s, dayMinStart);
          const overlapEnd = Math.min(e, dayMinEnd);
          if (overlapEnd > overlapStart) {
            netMinutes += overlapEnd - overlapStart;
          }
        }
      }
    }

    current = addDays(current, 1);
  }

  return {
    netMinutes,
    netHours: Math.round((netMinutes / 60) * 100) / 100,
    workingDaysCount,
    weekendDaysCount,
    holidayDaysCount,
  };
}

/**
 * Calculates exact SLA completion deadline given a start date/time and required SLA minutes.
 */
export function calculateSlaDeadline(
  startDate: ThaiDateInput,
  startTime: string,
  slaMinutes: number,
  options: NetBusinessMinutesOptions = {},
): SlaDeadlineResult {
  if (slaMinutes <= 0) {
    const s = resolveLocalDate(startDate);
    return {
      deadlineDate: s,
      deadlineTime: startTime,
      workingMinutesConsumed: 0,
    };
  }

  const shifts = options.shifts ?? [
    {
      start: "08:30",
      end: "17:30",
      breaks: [{ start: "12:00", end: "13:00" }],
    },
  ];

  let current = resolveLocalDate(startDate);
  let currentMin = parseTimeToMinutes(startTime);
  let remainingSla = slaMinutes;

  const isHol = (d: LocalDate): boolean => {
    if (options.isHoliday) return options.isHoliday(d);
    if (options.calendar) {
      return !isBusinessDay(d, { holidays: options.calendar as CountryCode });
    }
    return isWeekend(d);
  };

  while (remainingSla > 0) {
    if (!isWeekend(current) && !isHol(current)) {
      for (const shift of shifts) {
        const intervals = getShiftActiveIntervals(shift);
        for (const [s, e] of intervals) {
          if (currentMin >= e) continue;
          const effectiveStart = Math.max(s, currentMin);
          const availableInInterval = e - effectiveStart;

          if (remainingSla <= availableInInterval) {
            const finalMin = effectiveStart + remainingSla;
            return {
              deadlineDate: current,
              deadlineTime: formatMinutesToTime(finalMin),
              workingMinutesConsumed: slaMinutes,
            };
          } else {
            remainingSla -= availableInInterval;
            currentMin = e;
          }
        }
      }
    }

    // Move to next day at 00:00
    current = addDays(current, 1);
    currentMin = 0;
  }

  return {
    deadlineDate: current,
    deadlineTime: formatMinutesToTime(currentMin),
    workingMinutesConsumed: slaMinutes,
  };
}

/**
 * Classifies worked hours into regular, overtime, and holiday categories
 * in compliance with Thai Labour Protection Act (B.E. 2541 / 1998) Sections 61, 62, 63:
 * - Workday overtime: 1.5x
 * - Holiday regular shift: 1.0x (monthly salaried) or 2.0x (daily wage)
 * - Holiday overtime: 3.0x
 */
export function calculateOvertime(
  workedIntervals: readonly WorkedInterval[],
  schedule: WorkSchedule,
): OvertimeResult {
  let regularMin = 0;
  let workdayOtMin = 0;
  let holidayRegMin = 0;
  let holidayOtMin = 0;

  const shift = schedule.standardShift;
  const activeShiftIntervals = getShiftActiveIntervals(shift);

  const isHol = (d: LocalDate): boolean => {
    if (schedule.isHoliday) return schedule.isHoliday(d);
    if (schedule.calendar) {
      return !isBusinessDay(d, { holidays: schedule.calendar as CountryCode });
    }
    return isWeekend(d);
  };

  for (const interval of workedIntervals) {
    const d = resolveLocalDate(interval.date);
    const startM = parseTimeToMinutes(interval.startTime);
    const endM = parseTimeToMinutes(interval.endTime);
    if (endM <= startM) continue;

    const isHolidayDay = isHol(d);

    let insideActiveShiftMin = 0;
    for (const [s, e] of activeShiftIntervals) {
      const ovStart = Math.max(s, startM);
      const ovEnd = Math.min(e, endM);
      if (ovEnd > ovStart) {
        insideActiveShiftMin += ovEnd - ovStart;
      }
    }

    const totalWorkedInInterval = endM - startM;
    const outsideShiftMin = totalWorkedInInterval - insideActiveShiftMin;

    if (!isHolidayDay) {
      regularMin += insideActiveShiftMin;
      workdayOtMin += outsideShiftMin;
    } else {
      holidayRegMin += insideActiveShiftMin;
      holidayOtMin += outsideShiftMin;
    }
  }

  const toHours = (m: number) => Math.round((m / 60) * 100) / 100;
  const regHours = toHours(regularMin);
  const workdayOtHours = toHours(workdayOtMin);
  const holidayRegHours = toHours(holidayRegMin);
  const holidayOtHours = toHours(holidayOtMin);

  const holidayMultiplier = schedule.monthlyEmployee === false ? 2.0 : 1.0;
  const totalWorked = toHours(
    regularMin + workdayOtMin + holidayRegMin + holidayOtMin,
  );
  const equivalent =
    regHours * 1.0 +
    workdayOtHours * 1.5 +
    holidayRegHours * holidayMultiplier +
    holidayOtHours * 3.0;

  return {
    regularHours: regHours,
    workdayOvertimeHours: workdayOtHours,
    holidayRegularHours: holidayRegHours,
    holidayOvertimeHours: holidayOtHours,
    totalWorkedHours: totalWorked,
    totalEquivalentHours: Math.round(equivalent * 100) / 100,
  };
}

/**
 * Calculates both overtime hours breakdown and monetary compensation (THB)
 * under the Thai Labour Protection Act B.E. 2541 (Sections 61, 62, 63).
 */
export function calculateThaiOvertimePay(
  options: ThaiOvertimePayOptions,
): ThaiOvertimePayResult {
  const hourlyRate =
    options.hourlyRate ??
    (options.monthlySalary !== undefined
      ? Math.round((options.monthlySalary / 240) * 100) / 100
      : 0);

  const isMonthly =
    options.monthlyEmployee ?? options.schedule?.monthlyEmployee ?? true;
  const holidayMultiplier = isMonthly ? 1.0 : 2.0;

  let baseResult: OvertimeResult;
  if (options.workedIntervals && options.schedule) {
    baseResult = calculateOvertime(options.workedIntervals, options.schedule);
  } else {
    const workdayOt = options.workdayOvertimeHours ?? 0;
    const holidayReg = options.holidayRegularHours ?? 0;
    const holidayOt = options.holidayOvertimeHours ?? 0;
    const totalWorked = workdayOt + holidayReg + holidayOt;
    const equivalent =
      workdayOt * 1.5 + holidayReg * holidayMultiplier + holidayOt * 3.0;

    baseResult = {
      regularHours: 0,
      workdayOvertimeHours: workdayOt,
      holidayRegularHours: holidayReg,
      holidayOvertimeHours: holidayOt,
      totalWorkedHours: Math.round(totalWorked * 100) / 100,
      totalEquivalentHours: Math.round(equivalent * 100) / 100,
    };
  }

  const roundCurrency = (val: number) => Math.round(val * 100) / 100;
  const workdayOvertimePay = roundCurrency(
    baseResult.workdayOvertimeHours * hourlyRate * 1.5,
  );
  const holidayRegularPay = roundCurrency(
    baseResult.holidayRegularHours * hourlyRate * holidayMultiplier,
  );
  const holidayOvertimePay = roundCurrency(
    baseResult.holidayOvertimeHours * hourlyRate * 3.0,
  );
  const totalOvertimePay = roundCurrency(
    workdayOvertimePay + holidayRegularPay + holidayOvertimePay,
  );

  return {
    ...baseResult,
    hourlyRate,
    workdayOvertimePay,
    holidayRegularPay,
    holidayOvertimePay,
    totalOvertimePay,
  };
}
