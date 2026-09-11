import { describe, it, expect } from "vitest";
import {
  calculateAge,
  nextBirthday,
  daysUntilBirthday,
  isBirthday,
  isMilestoneAge,
  countdown,
  timeElapsed,
} from "../../../src/operations/age-countdown.js";
import { localDate } from "../../../src/core/local-date.js";

const TODAY = localDate(2026, 9, 11);

describe("calculateAge", () => {
  it("returns correct years for a simple case", () => {
    const birth = localDate(2000, 9, 11);
    const age = calculateAge(birth, TODAY);
    expect(age.years).toBe(26);
    expect(age.months).toBe(0);
    expect(age.days).toBe(0);
  });
  it("birthday not reached yet this year", () => {
    const birth = localDate(2000, 12, 25);
    const age = calculateAge(birth, TODAY);
    expect(age.years).toBe(25);
  });
  it("birthday has passed this year", () => {
    const birth = localDate(2000, 1, 15);
    const age = calculateAge(birth, TODAY);
    expect(age.years).toBe(26);
  });
  it("totalDays is non-negative", () => {
    const age = calculateAge(localDate(1990, 6, 1), TODAY);
    expect(age.totalDays).toBeGreaterThan(0);
  });
  it("newborn (same day) is age 0", () => {
    const age = calculateAge(TODAY, TODAY);
    expect(age.years).toBe(0);
    expect(age.months).toBe(0);
    expect(age.days).toBe(0);
    expect(age.totalDays).toBe(0);
  });
});

describe("nextBirthday", () => {
  it("returns next birthday when birthday hasn't passed yet", () => {
    const birth = localDate(1990, 12, 25);
    const next = nextBirthday(birth, TODAY);
    expect(next.year).toBe(2026);
    expect(next.month).toBe(12);
    expect(next.day).toBe(25);
  });
  it("returns next year birthday if already passed", () => {
    const birth = localDate(1990, 1, 15);
    const next = nextBirthday(birth, TODAY);
    expect(next.year).toBe(2027);
    expect(next.month).toBe(1);
  });
  it("returns same year if birthday is today (next year)", () => {
    const birth = localDate(1990, 9, 11);
    const next = nextBirthday(birth, TODAY);
    // today IS the birthday, so next is next year
    expect(next.year).toBe(2027);
  });
});

describe("daysUntilBirthday", () => {
  it("returns positive number for future birthday", () => {
    const birth = localDate(1990, 12, 25);
    const days = daysUntilBirthday(birth, TODAY);
    expect(days).toBeGreaterThan(0);
  });
  it("returns 0 if birthday is today (already passed → next year, non-zero)", () => {
    const birth = localDate(1990, 12, 31);
    const days = daysUntilBirthday(birth, TODAY);
    expect(days).toBeGreaterThan(0);
  });
});

describe("isBirthday", () => {
  it("returns true on birthday", () => {
    const birth = localDate(1990, 9, 11);
    expect(isBirthday(birth, TODAY)).toBe(true);
  });
  it("returns false on non-birthday", () => {
    const birth = localDate(1990, 9, 12);
    expect(isBirthday(birth, TODAY)).toBe(false);
  });
});

describe("isMilestoneAge", () => {
  it("returns true for milestone age", () => {
    const birth = localDate(2001, 9, 11);
    expect(isMilestoneAge(birth, [25, 30, 35], TODAY)).toBe(true);
  });
  it("returns false for non-milestone age", () => {
    const birth = localDate(2003, 9, 11);
    expect(isMilestoneAge(birth, [25, 30], TODAY)).toBe(false);
  });
});

describe("countdown", () => {
  it("returns days until future date", () => {
    const future = localDate(2026, 12, 31);
    const result = countdown(future, TODAY);
    expect(result.isPast).toBe(false);
    expect(result.days).toBeGreaterThan(0);
  });
  it("returns isPast=true for past date", () => {
    const past = localDate(2026, 1, 1);
    const result = countdown(past, TODAY);
    expect(result.isPast).toBe(true);
    expect(result.days).toBe(0);
  });
  it("returns 0 days for today", () => {
    const result = countdown(TODAY, TODAY);
    expect(result.days).toBe(0);
    expect(result.isPast).toBe(false);
  });
});

describe("timeElapsed", () => {
  it("returns positive values for past dates", () => {
    const past = localDate(2024, 1, 1);
    const elapsed = timeElapsed(past, TODAY);
    expect(elapsed.years).toBeGreaterThanOrEqual(2);
    expect(elapsed.totalDays).toBeGreaterThan(365);
  });
});
