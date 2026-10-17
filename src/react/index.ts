import { useEffect, useMemo, useState } from "react";
import { chronera, type Chronera } from "../chronera.js";
import { timeAgo, type TimeAgoOptions } from "../operations/relative-time.js";
import {
  generateMonthGrid,
  type MonthGridOptions,
  type MonthGridResult,
} from "../operations/calendar-grid.js";
import { isBusinessHour } from "../operations/business-hours.js";

import type { DateOrCalendarDate, Instant } from "../public-types.js";

export interface UseNowOptions {
  /** Refresh interval in milliseconds. Default: 1000 */
  readonly intervalMs?: number;
  /** Whether the timer is actively running. Default: true */
  readonly enabled?: boolean;
}

/**
 * React hook that returns an auto-updating reactive Chronera instance.
 *
 * @example
 * ```tsx
 * function Clock() {
 *   const now = useNow();
 *   return <div>{now.format("HH:mm:ss")}</div>;
 * }
 * ```
 */
export function useNow(options: UseNowOptions = {}): Chronera {
  const { intervalMs = 1000, enabled = true } = options;
  const [current, setCurrent] = useState<Chronera>(() => chronera());

  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => {
      setCurrent(chronera());
    }, intervalMs);
    return () => clearInterval(timer);
  }, [enabled, intervalMs]);

  return current;
}

export interface UseTimeAgoOptions extends TimeAgoOptions {
  /** Optional custom refresh interval in milliseconds. If omitted, uses smart auto-scaling. */
  readonly intervalMs?: number;
}

/**
 * React hook that returns an auto-refreshing humanized relative time string (e.g., "3 นาทีที่แล้ว", "just now").
 * Automatically scales refresh intervals (seconds -> minutes -> hours) to prevent wasteful re-renders.
 *
 * @example
 * ```tsx
 * function Comment({ timestamp }: { timestamp: string }) {
 *   const relativeTime = useTimeAgo(timestamp, { locale: "th" });
 *   return <span>{relativeTime}</span>;
 * }
 * ```
 */
export function useTimeAgo(
  date:
    | Chronera
    | DateOrCalendarDate
    | Instant
    | Date
    | string
    | number
    | null
    | undefined,
  options: UseTimeAgoOptions = {},
): string {
  const { intervalMs, ...timeAgoOpts } = options;
  const [text, setText] = useState<string>(() => {
    if (date === null || date === undefined) return "";
    return timeAgo(date, timeAgoOpts);
  });

  useEffect(() => {
    if (date === null || date === undefined) {
      setText("");
      return;
    }

    const update = () => {
      setText(timeAgo(date, timeAgoOpts));
    };

    update();

    let effectiveInterval = intervalMs;
    if (!effectiveInterval) {
      try {
        const targetMs =
          typeof date === "number"
            ? date
            : typeof date === "string"
              ? new Date(date).getTime()
              : date instanceof Date
                ? date.getTime()
                : "toInstant" in date && typeof date.toInstant === "function"
                  ? date.toInstant().epochMilliseconds
                  : Date.now();

        const diffSec = Math.abs(Math.floor((Date.now() - targetMs) / 1000));
        if (diffSec < 60) {
          effectiveInterval = 2000;
        } else if (diffSec < 3600) {
          effectiveInterval = 30000;
        } else {
          effectiveInterval = 60000;
        }
      } catch {
        effectiveInterval = 10000;
      }
    }

    const timer = setInterval(update, effectiveInterval);
    return () => clearInterval(timer);
  }, [date, intervalMs, timeAgoOpts.locale, timeAgoOpts.compact]);

  return text;
}

export interface UseCalendarGridOptions extends MonthGridOptions {
  readonly year: number;
  readonly month: number;
}

/**
 * React hook that returns a memoized calendar month grid with cell states.
 *
 * @example
 * ```tsx
 * function DatePicker({ year, month }: { year: number; month: number }) {
 *   const grid = useCalendarGrid({ year, month, weekStartsOn: "sunday" });
 *   return <div>{grid.weeks.map(...)}</div>;
 * }
 * ```
 */
export function useCalendarGrid(
  options: UseCalendarGridOptions,
): MonthGridResult {
  const { year, month, ...gridOptions } = options;

  return useMemo(() => {
    return generateMonthGrid(year, month, gridOptions);
  }, [
    year,
    month,
    gridOptions.weekStartsOn,
    gridOptions.includePaddingDays,
    gridOptions.fixedSixWeeks,
  ]);
}

export interface UseCountdownOptions {
  readonly intervalMs?: number;
  readonly onFinish?: () => void;
}

export interface CountdownResult {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly milliseconds: number;
  readonly isExpired: boolean;
  readonly totalSeconds: number;
}

/**
 * React hook that provides an auto-updating countdown timer to a target date.
 */
export function useCountdown(
  targetDate: Chronera | DateOrCalendarDate | Instant | Date | string | number,
  options: UseCountdownOptions = {},
): CountdownResult {
  const { intervalMs = 1000, onFinish } = options;

  const targetEpoch = useMemo(() => {
    if (typeof targetDate === "number") return targetDate;
    if (typeof targetDate === "string") return new Date(targetDate).getTime();
    if (targetDate instanceof Date) return targetDate.getTime();
    if (
      "toInstant" in targetDate &&
      typeof targetDate.toInstant === "function"
    ) {
      return targetDate.toInstant().epochMilliseconds;
    }
    return chronera(targetDate as DateOrCalendarDate).toInstant()
      .epochMilliseconds;
  }, [targetDate]);

  const calculate = (): CountdownResult => {
    const diff = targetEpoch - Date.now();
    if (diff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
        isExpired: true,
        totalSeconds: 0,
      };
    }
    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const milliseconds = diff % 1000;

    return {
      days,
      hours,
      minutes,
      seconds,
      milliseconds,
      isExpired: false,
      totalSeconds: totalSec,
    };
  };

  const [state, setState] = useState<CountdownResult>(calculate);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = calculate();
      setState(next);
      if (next.isExpired) {
        clearInterval(timer);
        onFinish?.();
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [targetEpoch, intervalMs, onFinish]);

  return state;
}

/**
 * React hook that returns whether the current instant is within defined business hours.
 */
export function useBusinessHours(
  options: {
    readonly intervalMs?: number;
    readonly calendar?: string;
    readonly schedule?: Parameters<typeof isBusinessHour>[1];
  } = {},
): { readonly isOpen: boolean } {
  const { intervalMs = 60000, schedule } = options;
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      return isBusinessHour(chronera().toDate(), schedule);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const check = () => {
      try {
        setIsOpen(isBusinessHour(chronera().toDate(), schedule));
      } catch {
        setIsOpen(false);
      }
    };
    check();
    const timer = setInterval(check, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, schedule]);

  return { isOpen };
}
