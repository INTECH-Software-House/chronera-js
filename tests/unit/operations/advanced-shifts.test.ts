import { describe, expect, it } from "vitest";
import {
  calculateNetBusinessMinutes,
  calculateSlaDeadline,
  calculateOvertime,
  parseTimeToMinutes,
  formatMinutesToTime,
} from "../../../src/operations/advanced-shifts.js";
import { localDate } from "../../../src/core/local-date.js";

describe("Advanced Shifts, SLA & Overtime Engine", () => {
  describe("parseTimeToMinutes & formatMinutesToTime", () => {
    it("parses HH:mm correctly", () => {
      expect(parseTimeToMinutes("08:30")).toBe(510);
      expect(parseTimeToMinutes("17:30")).toBe(1050);
      expect(parseTimeToMinutes("00:00")).toBe(0);
      expect(parseTimeToMinutes("23:59")).toBe(1439);
    });

    it("formats minutes back to HH:mm", () => {
      expect(formatMinutesToTime(510)).toBe("08:30");
      expect(formatMinutesToTime(1050)).toBe("17:30");
      expect(formatMinutesToTime(0)).toBe("00:00");
    });
  });

  describe("calculateNetBusinessMinutes", () => {
    it("calculates net working minutes in a single day deducting lunch break", () => {
      // 08:30 to 17:30 = 9 hours (540 min). Lunch break 12:00-13:00 = 60 min. Net = 480 min (8 hours).
      // Monday 2026-09-07 is a working day.
      const res = calculateNetBusinessMinutes(
        localDate(2026, 9, 7),
        "08:30",
        localDate(2026, 9, 7),
        "17:30",
        {
          shifts: [
            {
              start: "08:30",
              end: "17:30",
              breaks: [{ start: "12:00", end: "13:00" }],
            },
          ],
        },
      );

      expect(res.netMinutes).toBe(480);
      expect(res.netHours).toBe(8);
      expect(res.workingDaysCount).toBe(1);
      expect(res.weekendDaysCount).toBe(0);
    });

    it("skips weekends across multi-day span", () => {
      // Friday 2026-09-04 to Monday 2026-09-07.
      // Working days: Friday (8 hrs), Monday (8 hrs) = 16 hrs (960 min).
      // Weekend: Saturday + Sunday = 2 days.
      const res = calculateNetBusinessMinutes(
        localDate(2026, 9, 4),
        "08:30",
        localDate(2026, 9, 7),
        "17:30",
        {
          shifts: [
            {
              start: "08:30",
              end: "17:30",
              breaks: [{ start: "12:00", end: "13:00" }],
            },
          ],
        },
      );

      expect(res.netMinutes).toBe(960);
      expect(res.netHours).toBe(16);
      expect(res.workingDaysCount).toBe(2);
      expect(res.weekendDaysCount).toBe(2);
    });
  });

  describe("calculateSlaDeadline", () => {
    it("calculates completion deadline within the same day", () => {
      // Start at 09:00 on Monday. SLA is 120 minutes (2 hours).
      // No break overlap -> deadline is 11:00.
      const res = calculateSlaDeadline(localDate(2026, 9, 7), "09:00", 120, {
        shifts: [
          {
            start: "08:30",
            end: "17:30",
            breaks: [{ start: "12:00", end: "13:00" }],
          },
        ],
      });

      expect(res.deadlineDate).toEqual(localDate(2026, 9, 7));
      expect(res.deadlineTime).toBe("11:00");
    });

    it("correctly jumps over lunch break for SLA expiration", () => {
      // Start at 11:30. SLA is 60 minutes.
      // 11:30 to 12:00 uses 30 min. 12:00-13:00 is break. 13:00 to 13:30 uses remaining 30 min.
      // Deadline must be 13:30!
      const res = calculateSlaDeadline(localDate(2026, 9, 7), "11:30", 60, {
        shifts: [
          {
            start: "08:30",
            end: "17:30",
            breaks: [{ start: "12:00", end: "13:00" }],
          },
        ],
      });

      expect(res.deadlineDate).toEqual(localDate(2026, 9, 7));
      expect(res.deadlineTime).toBe("13:30");
    });
  });

  describe("calculateOvertime (Thai Labour Protection Act)", () => {
    it("computes 1.5x workday overtime for hours outside normal shift", () => {
      // Standard shift: 08:30-17:30 with lunch 12:00-13:00 (8 hrs normal)
      // Worked: 08:30 to 20:30 (12 hrs total, 1 hr lunch break = 11 hrs worked)
      // Regular: 8 hrs. Workday OT: 3 hrs.
      const res = calculateOvertime(
        [
          {
            date: localDate(2026, 9, 7), // Monday (normal workday)
            startTime: "08:30",
            endTime: "20:30",
          },
        ],
        {
          standardShift: {
            start: "08:30",
            end: "17:30",
            breaks: [{ start: "12:00", end: "13:00" }],
          },
        },
      );

      expect(res.regularHours).toBe(8);
      // Total span 08:30-20:30 is 12 hrs. Active shift interval inside is 8 hrs. Outside is 4 hrs (1 hr lunch + 3 hrs after 17:30).
      expect(res.workdayOvertimeHours).toBe(4);
      expect(res.totalWorkedHours).toBe(12);
      expect(res.totalEquivalentHours).toBe(8 * 1.0 + 4 * 1.5); // 14.0
    });

    it("computes holiday overtime (3.0x outside shift) and holiday regular (1.0x / 2.0x)", () => {
      // Worked on Sunday 2026-09-06 (Holiday/Weekend)
      const res = calculateOvertime(
        [
          {
            date: localDate(2026, 9, 6), // Sunday
            startTime: "08:30",
            endTime: "19:30", // 11 hrs total (8 hrs active shift + 3 hrs outside)
          },
        ],
        {
          standardShift: {
            start: "08:30",
            end: "17:30",
            breaks: [{ start: "12:00", end: "13:00" }],
          },
          monthlyEmployee: true,
        },
      );

      expect(res.regularHours).toBe(0);
      expect(res.holidayRegularHours).toBe(8);
      expect(res.holidayOvertimeHours).toBe(3);
      // Monthly employee: 8 * 1.0 + 3 * 3.0 = 8 + 9 = 17.0
      expect(res.totalEquivalentHours).toBe(17);
    });
  });
});
