import { describe, it, expect } from "vitest";
import {
  worldClock,
  findOverlapHours,
  isDSTAtInstant,
  getNextDSTTransition,
} from "../../../src/operations/world-clock.js";
import { instantFromEpochMilliseconds } from "../../../src/core/instant.js";

describe("World Clock & Meeting Overlap Planner", () => {
  describe("worldClock", () => {
    it("returns multi-timezone clock entries for a known instant", () => {
      // 2026-09-17 07:00:00 UTC (14:00 in Bangkok, 08:00 in London BST, 03:00 in New York EDT)
      const instant = instantFromEpochMilliseconds(
        Date.UTC(2026, 8, 17, 7, 0, 0),
      );
      const clocks = worldClock(
        ["Asia/Bangkok", "Europe/London", "America/New_York"],
        instant,
      );

      expect(clocks).toHaveLength(3);

      const bkk = clocks[0]!;
      expect(bkk.timeZone).toBe("Asia/Bangkok");
      expect(bkk.time.hour).toBe(14);
      expect(bkk.time.minute).toBe(0);
      expect(bkk.offsetString).toBe("+07:00");
      expect(bkk.isBusinessHours).toBe(true); // 14:00 is business hours

      const lon = clocks[1]!;
      expect(lon.timeZone).toBe("Europe/London");
      expect(lon.time.hour).toBe(8); // BST is UTC+1
      expect(lon.isBusinessHours).toBe(false); // 08:00 is before 09:00

      const ny = clocks[2]!;
      expect(ny.timeZone).toBe("America/New_York");
      expect(ny.time.hour).toBe(3); // EDT is UTC-4
      expect(ny.isBusinessHours).toBe(false);
    });

    it("throws on invalid arguments", () => {
      expect(() => worldClock([])).toThrow();
      expect(() => worldClock(["Invalid/Timezone"])).toThrow();
    });
  });

  describe("findOverlapHours", () => {
    it("finds overlap hours between Bangkok and London", () => {
      // In September (London is UTC+1 BST):
      // Bangkok: 09:00 - 18:00 ICT => UTC 02:00 - 11:00
      // London: 09:00 - 17:00 BST => UTC 08:00 - 16:00
      // Overlap: UTC 08:00 - 11:00 (3 hours)
      // Bangkok local: 15:00 - 18:00
      // London local: 09:00 - 12:00
      const ref = instantFromEpochMilliseconds(Date.UTC(2026, 8, 17, 12, 0, 0));
      const windows = findOverlapHours(
        [
          { name: "Team BKK", timeZone: "Asia/Bangkok", workingHours: [9, 18] },
          {
            name: "Team LON",
            timeZone: "Europe/London",
            workingHours: [9, 17],
          },
        ],
        ref,
      );

      expect(windows).toHaveLength(1);
      const w = windows[0]!;
      expect(w.startHourUtc).toBe(8);
      expect(w.endHourUtc).toBe(11);
      expect(w.durationHours).toBe(3);
      expect(w.localTimes["Team BKK"]).toBe("15:00 - 18:00 (Asia/Bangkok)");
      expect(w.localTimes["Team LON"]).toBe("09:00 - 12:00 (Europe/London)");
    });

    it("returns empty array when no overlap exists", () => {
      // Bangkok [9, 12] (UTC 2..5) vs San Francisco [9, 12] PDT UTC-7 (UTC 16..19)
      const ref = instantFromEpochMilliseconds(Date.UTC(2026, 8, 17, 12, 0, 0));
      const windows = findOverlapHours(
        [
          { timeZone: "Asia/Bangkok", workingHours: [9, 12] },
          { timeZone: "America/Los_Angeles", workingHours: [9, 12] },
        ],
        ref,
      );
      expect(windows).toEqual([]);
    });

    it("throws on invalid workingHours", () => {
      expect(() =>
        findOverlapHours([
          { timeZone: "Asia/Bangkok", workingHours: [18, 9] }, // start > end
        ]),
      ).toThrow();
    });
  });

  describe("isDSTAtInstant & getNextDSTTransition", () => {
    it("identifies DST in London vs non-DST in Bangkok", () => {
      const summer = instantFromEpochMilliseconds(
        Date.UTC(2026, 6, 15, 12, 0, 0),
      ); // July
      const winter = instantFromEpochMilliseconds(
        Date.UTC(2026, 0, 15, 12, 0, 0),
      ); // January

      expect(isDSTAtInstant("Europe/London", summer)).toBe(true);
      expect(isDSTAtInstant("Europe/London", winter)).toBe(false);

      expect(isDSTAtInstant("Asia/Bangkok", summer)).toBe(false);
      expect(isDSTAtInstant("Asia/Bangkok", winter)).toBe(false);
    });

    it("finds transition for Europe/London in 2026", () => {
      const transition = getNextDSTTransition("Europe/London", 2026);
      expect(transition).not.toBeNull();
      expect(transition!.timeZone).toBe("Europe/London");
      expect(transition!.date.year).toBe(2026);
      expect(transition!.date.month).toBe(3); // March transition
      expect(transition!.type).toBe("spring-forward");
    });

    it("returns null for non-DST timezone like Asia/Bangkok", () => {
      const transition = getNextDSTTransition("Asia/Bangkok", 2026);
      expect(transition).toBeNull();
    });
  });
});
