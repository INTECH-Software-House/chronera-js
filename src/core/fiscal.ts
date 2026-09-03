export type QuarterNumber = 1 | 2 | 3 | 4;

export interface FiscalOptions {
  /**
   * Starting month of the fiscal year (1..12). Defaults to 1 (calendar year).
   * Common corporate/governmental standards:
   * - 1: Calendar year (US corporate default, China, Germany)
   * - 4: April 1 (United Kingdom, Japan, India, Canada)
   * - 7: July 1 (Australia, New Zealand)
   * - 10: October 1 (United States Federal Government)
   */
  readonly startMonth?: number;

  /**
   * Whether the fiscal year is labeled by the year it ends (standard in US/UK accounting)
   * or the year it starts. Defaults to "endYear".
   */
  readonly label?: "endYear" | "startYear";
}

export interface FiscalFields {
  readonly fiscalYear: number;
  readonly fiscalQuarter: QuarterNumber;
  readonly calendarQuarter: QuarterNumber;
  readonly quarterMonth: 1 | 2 | 3; // 1st, 2nd, or 3rd month of the quarter
}

/**
 * Calculates calendar quarter (1..4) from a 1-based month (1..12).
 */
export function getCalendarQuarter(month: number): QuarterNumber {
  if (month < 1 || month > 12) {
    throw new RangeError(`Invalid month: ${month}. Expected 1..12.`);
  }
  return (Math.floor((month - 1) / 3) + 1) as QuarterNumber;
}

/**
 * Calculates fiscal fields for a given Gregorian year and month.
 */
export function getFiscalFields(
  year: number,
  month: number,
  options: FiscalOptions = {},
): FiscalFields {
  if (month < 1 || month > 12) {
    throw new RangeError(`Invalid month: ${month}. Expected 1..12.`);
  }

  const startMonth = options.startMonth ?? 1;
  if (startMonth < 1 || startMonth > 12) {
    throw new RangeError(
      `Invalid fiscal startMonth: ${startMonth}. Expected 1..12.`,
    );
  }

  const label = options.label ?? "endYear";
  const calendarQuarter = getCalendarQuarter(month);

  // Month index relative to fiscal year start (0..11)
  const relativeMonth = (month - startMonth + 12) % 12;
  const fiscalQuarter = (Math.floor(relativeMonth / 3) + 1) as QuarterNumber;
  const quarterMonth = ((relativeMonth % 3) + 1) as 1 | 2 | 3;

  let fiscalYear = year;
  if (startMonth !== 1) {
    if (label === "endYear") {
      // If month is on or after startMonth, it belongs to the fiscal year ending next calendar year
      fiscalYear = month >= startMonth ? year + 1 : year;
    } else {
      // startYear: if month is before startMonth, it belongs to the fiscal year started in previous calendar year
      fiscalYear = month < startMonth ? year - 1 : year;
    }
  }

  return {
    fiscalYear,
    fiscalQuarter,
    calendarQuarter,
    quarterMonth,
  };
}
