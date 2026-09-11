import { describe, expect, it } from "vitest";
import { localDate } from "../../../src/core/local-date.js";
import { localDateTime } from "../../../src/core/local-date-time.js";
import { localTime } from "../../../src/core/local-time.js";
import { ChroneraError } from "../../../src/errors/errors.js";
import {
  addBusinessHours,
  diffInBusinessHours,
  endOfBusinessDay,
  isBusinessHour,
  nextBusinessShift,
  startOfBusinessDay,
  subtractBusinessHours,
} from "../../../src/operations/business-hours.js";

import type { BusinessSchedule } from "../../../src/operations/business-hours.js";
import type { Instant } from "../../../src/public-types.js";

describe("Business Hours & Shift SLA Engine (v0.1.6)", () => {
  describe("1. Default Schedule (09:00 - 17:00, Mon-Fri)", () => {
    const mondayMorning = localDateTime(
      localDate(2026, 9, 7), // Monday
      localTime(10, 0),
    );
    const mondayEarly = localDateTime(localDate(2026, 9, 7), localTime(8, 30));
    const mondayEvening = localDateTime(
      localDate(2026, 9, 7),
      localTime(17, 0),
    );
    const saturdayNoon = localDateTime(
      localDate(2026, 9, 12), // Saturday
      localTime(12, 0),
    );

    it("evaluates isBusinessHour correctly", () => {
      expect(isBusinessHour(mondayMorning)).toBe(true);
      expect(isBusinessHour(mondayEarly)).toBe(false); // Before 09:00
      expect(isBusinessHour(mondayEvening)).toBe(false); // Exactly at 17:00 (exclusive end)
      expect(isBusinessHour(saturdayNoon)).toBe(false); // Weekend
    });

    it("adds business hours within the same day", () => {
      const result = addBusinessHours(mondayMorning, 3);
      expect(result.date.year).toBe(2026);
      expect(result.date.month).toBe(9);
      expect(result.date.day).toBe(7);
      expect(result.time.hour).toBe(13);
      expect(result.time.minute).toBe(0);
    });

    it("rolls business hours to next day when exceeding shift end", () => {
      // Monday 15:00 + 4 hours:
      // Mon 15:00-17:00 (2 hours)
      // Tue 09:00-11:00 (2 hours) -> Tuesday 11:00
      const mondayAfternoon = localDateTime(
        localDate(2026, 9, 7),
        localTime(15, 0),
      );
      const result = addBusinessHours(mondayAfternoon, 4);
      expect(result.date.day).toBe(8); // Tuesday
      expect(result.time.hour).toBe(11);
      expect(result.time.minute).toBe(0);
    });

    it("rolls across weekends seamlessly", () => {
      // Friday 15:00 + 4 hours:
      // Fri 15:00-17:00 (2 hours)
      // Sat & Sun skipped
      // Mon 09:00-11:00 (2 hours) -> Monday 11:00
      const fridayAfternoon = localDateTime(
        localDate(2026, 9, 11), // Friday
        localTime(15, 0),
      );
      const result = addBusinessHours(fridayAfternoon, 4);
      expect(result.date.day).toBe(14); // Monday Sept 14
      expect(result.time.hour).toBe(11);
      expect(result.time.minute).toBe(0);
    });

    it("subtracts business hours symmetrically", () => {
      const mondayNextWeek = localDateTime(
        localDate(2026, 9, 14),
        localTime(11, 0),
      );
      const result = subtractBusinessHours(mondayNextWeek, 4);
      expect(result.date.day).toBe(11); // Friday Sept 11
      expect(result.time.hour).toBe(15);
      expect(result.time.minute).toBe(0);
    });

    it("calculates diffInBusinessHours accurately", () => {
      const start = localDateTime(localDate(2026, 9, 11), localTime(15, 0)); // Fri 15:00
      const end = localDateTime(localDate(2026, 9, 14), localTime(11, 0)); // Mon 11:00

      expect(diffInBusinessHours(end, start)).toBe(4.0);
      expect(diffInBusinessHours(start, end)).toBe(-4.0);
      expect(diffInBusinessHours(start, start)).toBe(0);
    });
  });

  describe("2. Split Shifts with Lunch Breaks", () => {
    const schedule: BusinessSchedule = {
      workDays: [1, 2, 3, 4, 5],
      shifts: [
        { start: "08:30", end: "12:00" }, // 3.5 hrs
        { start: "13:00", end: "17:30" }, // 4.5 hrs (total 8 hrs/day)
      ],
    };

    it("identifies lunch break as non-business hour", () => {
      const morningWork = localDateTime(
        localDate(2026, 9, 7),
        localTime(10, 0),
      );
      const lunchTime = localDateTime(localDate(2026, 9, 7), localTime(12, 30));
      const afternoonWork = localDateTime(
        localDate(2026, 9, 7),
        localTime(14, 0),
      );

      expect(isBusinessHour(morningWork, schedule)).toBe(true);
      expect(isBusinessHour(lunchTime, schedule)).toBe(false);
      expect(isBusinessHour(afternoonWork, schedule)).toBe(true);
    });

    it("pauses counting during lunch break and resumes at 13:00", () => {
      // 11:00 + 2 hours:
      // Morning: 11:00-12:00 (1 hour)
      // Lunch: 12:00-13:00 (skipped)
      // Afternoon: 13:00-14:00 (1 hour) -> 14:00
      const start = localDateTime(localDate(2026, 9, 7), localTime(11, 0));
      const result = addBusinessHours(start, 2, schedule);

      expect(result.date.day).toBe(7);
      expect(result.time.hour).toBe(14);
      expect(result.time.minute).toBe(0);
    });

    it("starts counting from 13:00 if ticket arrives during lunch", () => {
      // Arrived at 12:25, SLA = 1.5 hours:
      // Resumes at 13:00 -> 13:00 + 1.5 hrs = 14:30
      const lunchArrival = localDateTime(
        localDate(2026, 9, 7),
        localTime(12, 25),
      );
      const result = addBusinessHours(lunchArrival, 1.5, schedule);

      expect(result.date.day).toBe(7);
      expect(result.time.hour).toBe(14);
      expect(result.time.minute).toBe(30);
    });
  });

  describe("3. Enterprise Banking SLA with Public Holidays (Thailand BOT)", () => {
    // Exact prompt problem statement:
    // Friday 16:30, shifts 08:30-12:00 & 13:00-17:30
    // April 3, 2026 (Friday)
    // April 4, 5 (Weekend)
    // April 6 (Monday - Chakri Memorial Day BOT Holiday)
    // Tuesday April 7 -> 11:30 deadline for 4 hours SLA!
    const bankingSchedule: BusinessSchedule = {
      workDays: [1, 2, 3, 4, 5],
      shifts: [
        { start: "08:30", end: "12:00" },
        { start: "13:00", end: "17:30" },
      ],
      country: "th",
      timeZone: "Asia/Bangkok",
    };

    it("computes exact Tuesday 11:30 deadline when Monday is a Bank of Thailand holiday", () => {
      const ticketCreated = localDateTime(
        localDate(2026, 4, 3), // Friday before Chakri Day
        localTime(16, 30),
      );

      const deadline = addBusinessHours(ticketCreated, 4, bankingSchedule);

      expect(deadline.date.year).toBe(2026);
      expect(deadline.date.month).toBe(4);
      expect(deadline.date.day).toBe(7); // Tuesday (Monday Chakri holiday skipped!)
      expect(deadline.time.hour).toBe(11);
      expect(deadline.time.minute).toBe(30);
    });

    it("subtracts 4 business hours backwards to Friday 16:30", () => {
      const deadline = localDateTime(
        localDate(2026, 4, 7), // Tuesday
        localTime(11, 30),
      );

      const ticketStart = subtractBusinessHours(deadline, 4, bankingSchedule);

      expect(ticketStart.date.year).toBe(2026);
      expect(ticketStart.date.month).toBe(4);
      expect(ticketStart.date.day).toBe(3); // Friday
      expect(ticketStart.time.hour).toBe(16);
      expect(ticketStart.time.minute).toBe(30);
    });

    it("calculates exact 4.0 business hours diff across weekend and BOT holiday", () => {
      const ticketCreated = localDateTime(
        localDate(2026, 4, 3),
        localTime(16, 30),
      );
      const deadline = localDateTime(localDate(2026, 4, 7), localTime(11, 30));

      const diff = diffInBusinessHours(
        deadline,
        ticketCreated,
        bankingSchedule,
      );
      expect(diff).toBe(4.0);
    });

    it("skips 3-day Songkran holidays for banking SLA", () => {
      // Friday April 10, 2026 at 16:30:
      // Friday has 1 hour left (16:30 to 17:30)
      // April 11 (Sat), April 12 (Sun) -> Weekend
      // April 13 (Mon), April 14 (Tue), April 15 (Wed) -> Songkran Holidays
      // April 16 (Thu) -> Resumes at 08:30 + 3 remaining hours = 11:30!
      const songkranTicket = localDateTime(
        localDate(2026, 4, 10),
        localTime(16, 30),
      );

      const deadline = addBusinessHours(songkranTicket, 4, bankingSchedule);

      expect(deadline.date.year).toBe(2026);
      expect(deadline.date.month).toBe(4);
      expect(deadline.date.day).toBe(16); // Thursday April 16!
      expect(deadline.time.hour).toBe(11);
      expect(deadline.time.minute).toBe(30);
    });
  });

  describe("4. Off-Hours & Weekend Ticket Submissions", () => {
    const schedule: BusinessSchedule = {
      shifts: [{ start: "09:00", end: "17:00" }],
    };

    it("rolls weekend ticket to Monday morning start of shift", () => {
      // Ticket opened Saturday 14:00 + 3 business hours:
      // Starts ticking Monday 09:00 -> Monday 12:00
      const saturday = localDateTime(localDate(2026, 9, 12), localTime(14, 0));
      const deadline = addBusinessHours(saturday, 3, schedule);

      expect(deadline.date.day).toBe(14); // Monday
      expect(deadline.time.hour).toBe(12);
      expect(deadline.time.minute).toBe(0);
    });

    it("rolls Friday late night ticket to Monday morning", () => {
      // Ticket opened Friday 22:00 + 2 business hours:
      // Starts Monday 09:00 -> Monday 11:00
      const fridayNight = localDateTime(
        localDate(2026, 9, 11),
        localTime(22, 0),
      );
      const deadline = addBusinessHours(fridayNight, 2, schedule);

      expect(deadline.date.day).toBe(14); // Monday
      expect(deadline.time.hour).toBe(11);
      expect(deadline.time.minute).toBe(0);
    });

    it("adding 0 hours to an off-hours timestamp snaps to next shift start", () => {
      const sundayNight = localDateTime(
        localDate(2026, 9, 13),
        localTime(23, 0),
      );
      const nextShiftStart = addBusinessHours(sundayNight, 0, schedule);

      expect(nextShiftStart.date.day).toBe(14); // Monday
      expect(nextShiftStart.time.hour).toBe(9);
      expect(nextShiftStart.time.minute).toBe(0);
    });
  });

  describe("5. Day-Specific Shifts (e.g. Friday Half-Day)", () => {
    const schedule: BusinessSchedule = {
      workDays: [1, 2, 3, 4, 5],
      shifts: [{ start: "08:30", end: "17:30" }], // Mon-Thu: 9 hours
      dayShifts: {
        5: [{ start: "08:30", end: "12:00" }], // Friday: 3.5 hours only
      },
    };

    it("respects Friday half-day shift duration", () => {
      // Friday 10:00 + 4 hours:
      // Friday 10:00-12:00 (2 hours)
      // Sat & Sun skipped
      // Monday 08:30 + 2 hours = Monday 10:30!
      const friday = localDateTime(localDate(2026, 9, 11), localTime(10, 0));
      const deadline = addBusinessHours(friday, 4, schedule);

      expect(deadline.date.day).toBe(14); // Monday
      expect(deadline.time.hour).toBe(10);
      expect(deadline.time.minute).toBe(30);
    });
  });

  describe("6. Polymorphic Inputs (LocalDateTime, Instant, Date)", () => {
    const schedule: BusinessSchedule = {
      shifts: [{ start: "09:00", end: "17:00" }],
      timeZone: "UTC",
    };

    it("preserves JavaScript Date instance", () => {
      // 2026-09-07T10:00:00.000Z (Monday)
      const jsDate = new Date(Date.UTC(2026, 8, 7, 10, 0, 0));
      const result = addBusinessHours(jsDate, 2, schedule);

      expect(result).toBeInstanceOf(Date);
      expect(result.getUTCHours()).toBe(12);
      expect(result.getUTCDate()).toBe(7);
    });

    it("preserves Instant object", () => {
      const inst: Instant = {
        kind: "instant",
        epochMilliseconds: Date.UTC(2026, 8, 7, 10, 0, 0),
      };
      const result = addBusinessHours(inst, 2, schedule);

      expect(result.kind).toBe("instant");
      expect(result.epochMilliseconds).toBe(Date.UTC(2026, 8, 7, 12, 0, 0));
    });

    it("accepts LocalDate as start of business day", () => {
      const lDate = localDate(2026, 9, 7); // Monday
      const result = addBusinessHours(lDate, 3, schedule);

      expect(result.kind).toBe("local-date-time");
      expect(result.time.hour).toBe(12); // 09:00 + 3 hrs = 12:00
    });
  });

  describe("7. nextBusinessShift, startOfBusinessDay, endOfBusinessDay", () => {
    const schedule: BusinessSchedule = {
      shifts: [
        { start: "08:30", end: "12:00" },
        { start: "13:00", end: "17:30" },
      ],
    };

    it("returns active shift if includeCurrent is true", () => {
      const midMorning = localDateTime(localDate(2026, 9, 7), localTime(10, 0));
      const shift = nextBusinessShift(midMorning, schedule);

      expect(shift.start.time.hour).toBe(8);
      expect(shift.start.time.minute).toBe(30);
      expect(shift.end.time.hour).toBe(12);
      expect(shift.end.time.minute).toBe(0);
    });

    it("returns next shift if includeCurrent is false", () => {
      const midMorning = localDateTime(localDate(2026, 9, 7), localTime(10, 0));
      const shift = nextBusinessShift(midMorning, schedule, {
        includeCurrent: false,
      });

      expect(shift.start.time.hour).toBe(13);
      expect(shift.start.time.minute).toBe(0);
      expect(shift.end.time.hour).toBe(17);
      expect(shift.end.time.minute).toBe(30);
    });

    it("startOfBusinessDay and endOfBusinessDay return correct boundary times", () => {
      const date = localDate(2026, 9, 7);
      const start = startOfBusinessDay(date, schedule);
      const end = endOfBusinessDay(date, schedule);

      expect(start.time.hour).toBe(8);
      expect(start.time.minute).toBe(30);
      expect(end.time.hour).toBe(17);
      expect(end.time.minute).toBe(30);
    });
  });

  describe("8. Validation and Error Cases", () => {
    it("throws ChroneraError for invalid hours", () => {
      const date = localDateTime(localDate(2026, 9, 7), localTime(10, 0));
      expect(() => addBusinessHours(date, Number.NaN)).toThrow(ChroneraError);
      expect(() => addBusinessHours(date, Number.POSITIVE_INFINITY)).toThrow(
        ChroneraError,
      );
    });

    it("throws ChroneraError for overlapping or reversed shifts", () => {
      const date = localDateTime(localDate(2026, 9, 7), localTime(10, 0));
      expect(() =>
        addBusinessHours(date, 1, {
          shifts: [{ start: "17:00", end: "09:00" }],
        }),
      ).toThrow(ChroneraError);

      expect(() =>
        addBusinessHours(date, 1, {
          shifts: [
            { start: "08:00", end: "12:00" },
            { start: "11:00", end: "15:00" },
          ],
        }),
      ).toThrow(ChroneraError);
    });

    it("throws ChroneraError for invalid shift time strings", () => {
      const date = localDateTime(localDate(2026, 9, 7), localTime(10, 0));
      expect(() =>
        addBusinessHours(date, 1, {
          shifts: [{ start: "invalid", end: "17:00" }],
        }),
      ).toThrow(ChroneraError);

      expect(() =>
        addBusinessHours(date, 1, {
          shifts: [{ start: "25:00", end: "26:00" }],
        }),
      ).toThrow(ChroneraError);
    });
  });
});
