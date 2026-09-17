import { describe, it, expect } from "vitest";
import { timeBuckets } from "../../../src/operations/time-buckets.js";
import { localDate } from "../../../src/core/local-date.js";
import { instantFromEpochMilliseconds } from "../../../src/core/instant.js";

interface Transaction {
  id: string;
  amount: number;
  date: string;
}

describe("Time-Series Data Binning & Gap Filling Engine", () => {
  const sampleData: Transaction[] = [
    { id: "tx-1", amount: 100, date: "2026-09-01T08:00:00Z" },
    { id: "tx-2", amount: 250, date: "2026-09-01T14:30:00Z" },
    { id: "tx-3", amount: 50, date: "2026-09-03T09:15:00Z" },
    { id: "tx-4", amount: 400, date: "2026-09-05T18:00:00Z" },
  ];

  describe("timeBuckets basic grouping", () => {
    it("groups items into daily buckets without gaps", () => {
      const buckets = timeBuckets(sampleData, {
        dateField: "date",
        bucket: "day",
        valueField: "amount",
      });

      // Distinct days with data: Sep 1, Sep 3, Sep 5
      expect(buckets).toHaveLength(3);

      const b1 = buckets[0]!;
      expect(b1.key).toBe("2026-09-01");
      expect(b1.count).toBe(2);
      expect(b1.sum).toBe(350);
      expect(b1.avg).toBe(175);
      expect(b1.min).toBe(100);
      expect(b1.max).toBe(250);

      const b2 = buckets[1]!;
      expect(b2.key).toBe("2026-09-03");
      expect(b2.count).toBe(1);
      expect(b2.sum).toBe(50);

      const b3 = buckets[2]!;
      expect(b3.key).toBe("2026-09-05");
      expect(b3.count).toBe(1);
      expect(b3.sum).toBe(400);
    });

    it("groups items into monthly buckets", () => {
      const multiMonthData: Transaction[] = [
        { id: "1", amount: 100, date: "2026-08-15T12:00:00Z" },
        { id: "2", amount: 200, date: "2026-09-01T12:00:00Z" },
        { id: "3", amount: 300, date: "2026-09-20T12:00:00Z" },
      ];

      const buckets = timeBuckets(multiMonthData, {
        dateField: "date",
        bucket: "month",
        valueField: "amount",
      });

      expect(buckets).toHaveLength(2);
      expect(buckets[0]!.key).toBe("2026-08");
      expect(buckets[0]!.sum).toBe(100);

      expect(buckets[1]!.key).toBe("2026-09");
      expect(buckets[1]!.count).toBe(2);
      expect(buckets[1]!.sum).toBe(500);
    });

    it("groups items into quarterly buckets", () => {
      const quarterlyData: Transaction[] = [
        { id: "q1", amount: 50, date: "2026-02-10T00:00:00Z" },
        { id: "q2", amount: 150, date: "2026-05-15T00:00:00Z" },
        { id: "q3", amount: 300, date: "2026-08-20T00:00:00Z" },
      ];

      const buckets = timeBuckets(quarterlyData, {
        dateField: "date",
        bucket: "quarter",
        valueField: "amount",
      });

      expect(buckets).toHaveLength(3);
      expect(buckets[0]!.key).toBe("2026-Q1");
      expect(buckets[1]!.key).toBe("2026-Q2");
      expect(buckets[2]!.key).toBe("2026-Q3");
    });
  });

  describe("Gap Filling (fillGaps: true)", () => {
    it("fills intermediate missing days with zero values", () => {
      // Span is Sep 1 to Sep 5 -> Sep 1, Sep 2, Sep 3, Sep 4, Sep 5 (5 days)
      const buckets = timeBuckets(sampleData, {
        dateField: "date",
        bucket: "day",
        valueField: "amount",
        fillGaps: true,
      });

      expect(buckets).toHaveLength(5);
      expect(buckets.map((b) => b.key)).toEqual([
        "2026-09-01",
        "2026-09-02",
        "2026-09-03",
        "2026-09-04",
        "2026-09-05",
      ]);

      // Sep 2 and Sep 4 are empty filled gaps
      const bSep2 = buckets[1]!;
      expect(bSep2.key).toBe("2026-09-02");
      expect(bSep2.count).toBe(0);
      expect(bSep2.sum).toBe(0);
      expect(bSep2.avg).toBe(0);
      expect(bSep2.min).toBeNull();
      expect(bSep2.max).toBeNull();
    });

    it("fills gaps within specified range", () => {
      // Range: Sep 1 to Sep 7
      const buckets = timeBuckets(sampleData, {
        dateField: "date",
        bucket: "day",
        valueField: "amount",
        fillGaps: true,
        range: [localDate(2026, 9, 1), localDate(2026, 9, 7)],
      });

      expect(buckets).toHaveLength(7);
      expect(buckets[6]!.key).toBe("2026-09-07");
      expect(buckets[6]!.count).toBe(0);
    });
  });

  describe("Selector Functions", () => {
    it("supports custom selector functions for dateField and valueField", () => {
      const customItems = [
        { info: { ts: Date.UTC(2026, 8, 1, 10, 0) }, val: 42 },
        { info: { ts: Date.UTC(2026, 8, 1, 15, 0) }, val: 58 },
      ];

      const buckets = timeBuckets(customItems, {
        dateField: (item) => instantFromEpochMilliseconds(item.info.ts),
        valueField: (item) => item.val,
        bucket: "day",
      });

      expect(buckets).toHaveLength(1);
      expect(buckets[0]!.count).toBe(2);
      expect(buckets[0]!.sum).toBe(100);
      expect(buckets[0]!.avg).toBe(50);
    });
  });
});
