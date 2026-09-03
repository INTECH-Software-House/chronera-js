import type { DateRange } from "../public-types.js";

export function dateRange<TDate>(
  start: TDate,
  end: TDate,
  startInclusive: boolean = true,
  endInclusive: boolean = true,
): DateRange<TDate> {
  return {
    start,
    end,
    startInclusive,
    endInclusive,
  };
}
