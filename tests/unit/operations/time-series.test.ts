import { describe, it, expect } from "vitest";
import {
  bucketByDay,
  bucketByMonth,
  bucketByQuarter,
  bucketByYear,
  histogram,
  sortDates,
  minDate,
  maxDate,
  nearestDate,
  uniqueDates,
} from "../../../src/operations/time-series.js";
import { localDate } from "../../../src/core/local-date.js";

const DATES = [
  localDate(2026, 9, 1),
  localDate(2026, 9, 15),
  localDate(2026, 9, 30),
  localDate(2026, 10, 1),
  localDate(2026, 10, 31),
  localDate(2027, 1, 1),
];

describe("bucketByDay", () => {
  it("groups dates by day key", () => {
    const m = bucketByDay(DATES);
    expect(m.size).toBe(6);
    expect(m.has("2026-09-01")).toBe(true);
    expect(m.get("2026-10-01")).toHaveLength(1);
  });
  it("handles duplicates in same day", () => {
    const dupes = [localDate(2026, 9, 1), localDate(2026, 9, 1)];
    const m = bucketByDay(dupes);
    expect(m.size).toBe(1);
    expect(m.get("2026-09-01")).toHaveLength(2);
  });
});

describe("bucketByMonth", () => {
  it("groups dates by month key", () => {
    const m = bucketByMonth(DATES);
    expect(m.size).toBe(3);
    expect(m.has("2026-09")).toBe(true);
    expect(m.get("2026-09")).toHaveLength(3);
    expect(m.get("2026-10")).toHaveLength(2);
  });
  it("keys are sorted", () => {
    const m = bucketByMonth(DATES);
    const keys = [...m.keys()];
    expect(keys).toEqual(["2026-09", "2026-10", "2027-01"]);
  });
});

describe("bucketByQuarter", () => {
  it("groups by quarter correctly", () => {
    const m = bucketByQuarter(DATES);
    expect(m.has("2026-Q3")).toBe(true);
    expect(m.has("2026-Q4")).toBe(true);
    expect(m.has("2027-Q1")).toBe(true);
    expect(m.get("2026-Q3")).toHaveLength(3);
  });
});

describe("bucketByYear", () => {
  it("groups by year", () => {
    const m = bucketByYear(DATES);
    expect(m.has("2026")).toBe(true);
    expect(m.has("2027")).toBe(true);
    expect(m.get("2026")).toHaveLength(5);
  });
});

describe("histogram", () => {
  it("returns count per bucket", () => {
    const h = histogram(DATES, "month");
    expect(h).toHaveLength(3);
    const sep = h.find((e) => e.key === "2026-09");
    expect(sep?.count).toBe(3);
  });
  it("is sorted by key", () => {
    const h = histogram(DATES, "month");
    const keys = h.map((e) => e.key);
    expect(keys).toEqual([...keys].sort());
  });
});

describe("sortDates", () => {
  it("sorts ascending by default", () => {
    const shuffled = [DATES[5]!, DATES[0]!, DATES[3]!];
    const sorted = sortDates(shuffled);
    expect(sorted[0]).toEqual(DATES[0]);
    expect(sorted[2]).toEqual(DATES[5]);
  });
  it("sorts descending", () => {
    const sorted = sortDates([...DATES], "desc");
    expect(sorted[0]).toEqual(DATES[5]);
  });
  it("does not mutate original array", () => {
    const arr = [...DATES];
    sortDates(arr, "desc");
    expect(arr[0]).toEqual(DATES[0]);
  });
});

describe("minDate / maxDate", () => {
  it("finds min", () => {
    expect(minDate(DATES)).toEqual(localDate(2026, 9, 1));
  });
  it("finds max", () => {
    expect(maxDate(DATES)).toEqual(localDate(2027, 1, 1));
  });
  it("throws on empty", () => {
    expect(() => minDate([])).toThrow();
    expect(() => maxDate([])).toThrow();
  });
});

describe("nearestDate", () => {
  it("finds nearest date", () => {
    const ref = localDate(2026, 9, 14);
    const nearest = nearestDate(DATES, ref);
    expect(nearest).toEqual(localDate(2026, 9, 15));
  });
});

describe("uniqueDates", () => {
  it("removes duplicates", () => {
    const withDupes = [
      localDate(2026, 9, 1),
      localDate(2026, 9, 1),
      localDate(2026, 9, 2),
    ];
    const unique = uniqueDates(withDupes);
    expect(unique).toHaveLength(2);
  });
  it("keeps first occurrence", () => {
    const d1 = localDate(2026, 9, 1);
    const d2 = localDate(2026, 9, 1);
    const unique = uniqueDates([d1, d2]);
    expect(unique[0]).toBe(d1);
  });
});
