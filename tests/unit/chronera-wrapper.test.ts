import { describe, it, expect } from "vitest";
import { chronera, Chronera } from "../../src/chronera.js";

describe("Chronera Fluent Wrapper - Instantiation & Conversions", () => {
  it("instantiates from string ISO date", () => {
    const c = chronera("2026-09-27");
    expect(c).toBeInstanceOf(Chronera);
    expect(c.kind).toBe("local-date");

    const ld = c.toLocalDate();
    expect(ld.year).toBe(2026);
    expect(ld.month).toBe(9);
    expect(ld.day).toBe(27);
  });

  it("instantiates from string ISO timestamp with time/Z", () => {
    const c = chronera("2026-09-27T14:30:00Z");
    expect(c.kind).toBe("instant");

    const inst = c.toInstant();
    expect(inst.epochMilliseconds).toBe(Date.parse("2026-09-27T14:30:00Z"));
  });

  it("instantiates from native Date and numbers", () => {
    const now = new Date();
    const cDate = chronera(now);
    expect(cDate.kind).toBe("instant");
    expect(cDate.toDate().getTime()).toBe(now.getTime());

    const cNum = chronera(1000000000000);
    expect(cNum.toInstant().epochMilliseconds).toBe(1000000000000);
  });

  it("instantiates without args as now", () => {
    const before = Date.now();
    const c = chronera();
    const after = Date.now();
    expect(c.kind).toBe("instant");
    expect(c.toInstant().epochMilliseconds).toBeGreaterThanOrEqual(before);
    expect(c.toInstant().epochMilliseconds).toBeLessThanOrEqual(after);
  });

  it("converts between representations: toLocalDate, toInstant, toDate, toCalendar, toZoned", () => {
    const c = chronera("2026-09-27");

    const inst = c.toInstant();
    expect(inst.kind).toBe("instant");

    const jsDate = c.toDate();
    expect(jsDate).toBeInstanceOf(Date);

    // Convert to Thai Buddhist calendar
    const cBuddhist = c.toCalendar("buddhist");
    expect(cBuddhist.value.kind).toBe("calendar-date");
    // @ts-expect-error calendar-date has year
    expect(cBuddhist.value.year).toBe(2569); // 2026 + 543

    // Convert to ZonedDateTime
    const cZoned = c.toZoned("Asia/Bangkok");
    expect(cZoned.value.kind).toBe("zoned-date-time");
    // @ts-expect-error zoned-date-time has timeZone
    expect(cZoned.value.timeZone).toBe("Asia/Bangkok");
  });
});

describe("Chronera Fluent Wrapper - Method Chaining & Arithmetic", () => {
  it("chains arithmetic immutably without mutating the source instance", () => {
    const original = chronera("2026-09-27");

    const updated = original.addDays(5).addMonths(1).subtractYears(2);

    // Original must remain untouched (Clean Architecture immutability guarantee)
    expect(original.toString()).toBe("2026-09-27");

    // 2026-09-27 + 5 days = 2026-10-02 -> + 1 month = 2026-11-02 -> - 2 years = 2024-11-02
    expect(updated.toString()).toBe("2024-11-02");
  });

  it("supports startOf / endOf calendar units", () => {
    const c = chronera("2026-09-27");

    const som = c.startOfMonth();
    expect(som.toString()).toBe("2026-09-01");

    const eom = c.endOfMonth();
    expect(eom.toString()).toBe("2026-09-30");

    const soy = c.startOfYear();
    expect(soy.toString()).toBe("2026-01-01");

    const eoy = c.endOfYear();
    expect(eoy.toString()).toBe("2026-12-31");
  });

  it("handles clock arithmetic when working with timestamps", () => {
    const c = chronera("2026-09-27T10:00:00Z");

    const updated = c.addHours(4).subtractMinutes(30).addSeconds(15);

    expect(updated.toInstant().epochMilliseconds).toBe(
      Date.parse("2026-09-27T13:30:15Z"),
    );
  });
});

describe("Chronera Fluent Wrapper - Business Days & Holidays", () => {
  it("checks weekdays, weekends, and holidays", () => {
    // 2026-09-26 is Saturday, 2026-09-27 is Sunday, 2026-09-28 is Monday
    const sat = chronera("2026-09-26");
    const sun = chronera("2026-09-27");
    const mon = chronera("2026-09-28");

    expect(sat.isWeekend()).toBe(true);
    expect(sat.isWeekday()).toBe(false);
    expect(sat.isBusinessDay("TH")).toBe(false);

    expect(sun.isWeekend()).toBe(true);
    expect(sun.isWeekday()).toBe(false);

    expect(mon.isWeekend()).toBe(false);
    expect(mon.isWeekday()).toBe(true);
    expect(mon.isBusinessDay("TH")).toBe(true);
  });

  it("adds and subtracts business days", () => {
    // Friday 2026-09-25 + 1 business day => Monday 2026-09-28
    const fri = chronera("2026-09-25");
    const nextBiz = fri.addBusinessDays(1, "TH");
    expect(nextBiz.toString()).toBe("2026-09-28");

    const prevBiz = nextBiz.subtractBusinessDays(1, "TH");
    expect(prevBiz.toString()).toBe("2026-09-25");
  });

  it("calculates diffInBusinessDays between two dates", () => {
    const start = chronera("2026-09-21"); // Monday
    const end = chronera("2026-09-28"); // Next Monday (5 business days)
    expect(end.diffInBusinessDays(start, "TH")).toBe(5);
    expect(start.diffInBusinessDays(end, "TH")).toBe(-5);
  });
});

describe("Chronera Fluent Wrapper - Comparisons & Queries", () => {
  it("compares dates with isBefore, isAfter, isEqual, isSameDay, isBetween", () => {
    const a = chronera("2026-09-20");
    const b = chronera("2026-09-25");
    const c = chronera("2026-09-30");

    expect(a.isBefore(b)).toBe(true);
    expect(b.isAfter(a)).toBe(true);
    expect(b.isEqual("2026-09-25")).toBe(true);
    expect(b.isSameDay("2026-09-25")).toBe(true);

    expect(b.isBetween(a, c)).toBe(true);
    expect(b.diffInDays(a)).toBe(5);
    expect(a.diffInDays(b)).toBe(-5);
  });

  it("inspects daysInMonth and isLeapYear", () => {
    expect(chronera("2026-02-15").daysInMonth()).toBe(28); // 2026 non-leap
    expect(chronera("2024-02-15").daysInMonth()).toBe(29); // 2024 leap
    expect(chronera("2024-02-15").isLeapYear()).toBe(true);
    expect(chronera("2026-09-27").isLeapYear()).toBe(false);
  });
});

describe("Chronera Fluent Wrapper - Formatting & Serialization", () => {
  it("formats localized output with Buddhist calendar", () => {
    const c = chronera("2026-09-27");
    const formatted = c.format({
      locale: "th-TH",
      calendar: "buddhist",
      style: "long",
    });

    expect(formatted).toContain("2569");
    expect(formatted).toContain("กันยายน");
  });

  it("formats with custom pattern string", () => {
    const c = chronera("2026-09-27T08:30:00Z");
    const formatted = c.format("yyyy/MM/dd");
    expect(formatted).toBe("2026/09/27");
  });

  it("serializes to ISO string and string representation", () => {
    const c = chronera("2026-09-27");
    expect(c.toString()).toBe("2026-09-27");
    expect(c.toISOString()).toContain("2026-09-27");
  });
});
