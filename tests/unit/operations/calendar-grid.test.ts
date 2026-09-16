import { describe, it, expect } from "vitest";
import {
  generateMonthGrid,
  getMonthMatrix,
  generateYearGrid,
  getAdjacentMonths,
  getWeekDaysHeader,
} from "../../../src/operations/calendar-grid.js";
import { localDate } from "../../../src/core/local-date.js";

describe("Calendar Grid & DatePicker Engine", () => {
  describe("generateMonthGrid", () => {
    it("generates correct month grid for September 2026 (Starts on Tuesday)", () => {
      // 2026-09-01 is Tuesday
      const grid = generateMonthGrid(2026, 9, {
        weekStartsOn: "monday",
        referenceDate: localDate(2026, 9, 17),
      });

      expect(grid.year).toBe(2026);
      expect(grid.month).toBe(9);
      expect(grid.totalDays).toBe(30);
      expect(grid.startPaddingCount).toBe(1); // 2026-08-31 (Monday)

      // First week: [Aug 31 (pad), Sep 1, Sep 2, Sep 3, Sep 4, Sep 5, Sep 6]
      const firstWeek = grid.weeks[0]!;
      expect(firstWeek).toHaveLength(7);
      expect(firstWeek[0]!.isCurrentMonth).toBe(false);
      expect(firstWeek[0]!.day).toBe(31);
      expect(firstWeek[0]!.month).toBe(8);

      expect(firstWeek[1]!.isCurrentMonth).toBe(true);
      expect(firstWeek[1]!.day).toBe(1);
      expect(firstWeek[1]!.month).toBe(9);
      expect(firstWeek[1]!.dayOfWeek).toBe(2); // Tuesday
    });

    it("respects weekStartsOn = 'sunday'", () => {
      const grid = generateMonthGrid(2026, 9, {
        weekStartsOn: "sunday",
      });
      // 2026-09-01 is Tuesday -> padding on Sunday & Monday (Aug 30, Aug 31)
      expect(grid.startPaddingCount).toBe(2);
      const firstWeek = grid.weeks[0]!;
      expect(firstWeek[0]!.day).toBe(30);
      expect(firstWeek[0]!.month).toBe(8);
      expect(firstWeek[0]!.dayOfWeek).toBe(0); // Sunday
    });

    it("supports fixedSixWeeks option", () => {
      const grid = generateMonthGrid(2026, 9, {
        fixedSixWeeks: true,
      });
      expect(grid.weeks).toHaveLength(6);
      const totalCells = grid.weeks.reduce((sum, w) => sum + w.length, 0);
      expect(totalCells).toBe(42);
    });

    it("identifies isToday and isWeekend correctly", () => {
      const ref = localDate(2026, 9, 17); // Thursday
      const grid = generateMonthGrid(2026, 9, { referenceDate: ref });

      let foundToday = false;
      for (const week of grid.weeks) {
        for (const cell of week) {
          if (cell.isToday) {
            foundToday = true;
            expect(cell.day).toBe(17);
            expect(cell.month).toBe(9);
            expect(cell.year).toBe(2026);
            expect(cell.isWeekend).toBe(false);
          }
          if (cell.dayOfWeek === 0 || cell.dayOfWeek === 6) {
            expect(cell.isWeekend).toBe(true);
          }
        }
      }
      expect(foundToday).toBe(true);
    });

    it("throws on invalid month or year", () => {
      expect(() => generateMonthGrid(2026, 0)).toThrow();
      expect(() => generateMonthGrid(2026, 13)).toThrow();
      expect(() => generateMonthGrid(0, 5)).toThrow();
    });
  });

  describe("getMonthMatrix", () => {
    it("returns 2D array of weeks directly", () => {
      const matrix = getMonthMatrix(2026, 9);
      expect(Array.isArray(matrix)).toBe(true);
      expect(matrix.length).toBeGreaterThanOrEqual(4);
      expect(matrix[0]).toHaveLength(7);
    });
  });

  describe("generateYearGrid", () => {
    it("generates 12 month grids for the year", () => {
      const yearGrid = generateYearGrid(2026);
      expect(yearGrid).toHaveLength(12);
      expect(yearGrid[0]!.month).toBe(1);
      expect(yearGrid[11]!.month).toBe(12);
    });
  });

  describe("getAdjacentMonths", () => {
    it("handles standard month transitions", () => {
      const { prev, next } = getAdjacentMonths(2026, 6);
      expect(prev).toEqual({ year: 2026, month: 5 });
      expect(next).toEqual({ year: 2026, month: 7 });
    });

    it("handles year boundary at January and December", () => {
      const jan = getAdjacentMonths(2026, 1);
      expect(jan.prev).toEqual({ year: 2025, month: 12 });
      expect(jan.next).toEqual({ year: 2026, month: 2 });

      const dec = getAdjacentMonths(2026, 12);
      expect(dec.prev).toEqual({ year: 2026, month: 11 });
      expect(dec.next).toEqual({ year: 2027, month: 1 });
    });
  });

  describe("getWeekDaysHeader", () => {
    it("returns localized headers for Thai and English", () => {
      const enHeaders = getWeekDaysHeader("en", "short", "monday");
      expect(enHeaders).toHaveLength(7);
      expect(enHeaders[0]).toBe("Mon");
      expect(enHeaders[6]).toBe("Sun");

      const thHeaders = getWeekDaysHeader("th", "short", "monday");
      expect(thHeaders).toHaveLength(7);
      expect(thHeaders[0]).toBe("จันทร์");
      expect(thHeaders[6]).toBe("อาทิตย์");

      const thNarrow = getWeekDaysHeader("th", "narrow", "monday");
      expect(thNarrow).toHaveLength(7);
      expect(thNarrow[0]).toBe("จ");
      expect(thNarrow[6]).toBe("อา");
    });

    it("supports sunday start", () => {
      const enHeaders = getWeekDaysHeader("en", "short", "sunday");
      expect(enHeaders[0]).toBe("Sun");
      expect(enHeaders[1]).toBe("Mon");
    });
  });
});
