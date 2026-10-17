import { describe, expect, it } from "vitest";
import {
  useNow,
  useTimeAgo,
  useCalendarGrid,
  useCountdown,
  useBusinessHours,
} from "../../../src/react/index.js";
import { chronera } from "../../../src/chronera.js";
import React from "react";
import { renderToString } from "react-dom/server";

describe("React Reactive Hooks", () => {
  it("exports all documented hooks", () => {
    expect(typeof useNow).toBe("function");
    expect(typeof useTimeAgo).toBe("function");
    expect(typeof useCalendarGrid).toBe("function");
    expect(typeof useCountdown).toBe("function");
    expect(typeof useBusinessHours).toBe("function");
  });

  it("useCalendarGrid creates memoized grid structure", () => {
    let capturedGrid: ReturnType<typeof useCalendarGrid> | null = null;
    function TestComponent() {
      capturedGrid = useCalendarGrid({ year: 2026, month: 10 });
      return React.createElement("div", null, "calendar");
    }

    renderToString(React.createElement(TestComponent));

    expect(capturedGrid).not.toBeNull();
    expect(capturedGrid!.year).toBe(2026);
    expect(capturedGrid!.month).toBe(10);
    expect(capturedGrid!.weeks.length).toBeGreaterThanOrEqual(4);
    expect(capturedGrid!.weeks[0]![0]!.date).toBeDefined();
  });

  it("renders useNow and useTimeAgo inside component tree", () => {
    let nowOutput = "";
    let timeAgoOutput = "";

    function TestComponent() {
      const now = useNow({ intervalMs: 1000 });
      const timeAgo = useTimeAgo(chronera().subtractMinutes(5));
      nowOutput = now.format("yyyy-MM-dd");
      timeAgoOutput = timeAgo;
      return React.createElement(
        "div",
        null,
        `${nowOutput} - ${timeAgoOutput}`,
      );
    }

    renderToString(React.createElement(TestComponent));
    expect(nowOutput).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(timeAgoOutput.length).toBeGreaterThan(0);
  });

  it("renders useCountdown and useBusinessHours inside component tree", () => {
    let countdownRemaining = -1;
    let businessStatus: ReturnType<typeof useBusinessHours> | null = null;

    function TestComponent() {
      const target = chronera().addDays(1);
      const countdown = useCountdown(target);
      const business = useBusinessHours({
        schedule: {
          shifts: [{ start: "09:00", end: "17:00" }],
          holidays: "TH",
        },
      });

      countdownRemaining = countdown.totalSeconds;
      businessStatus = business;
      return React.createElement("div", null, "status");
    }

    renderToString(React.createElement(TestComponent));
    expect(countdownRemaining).toBeGreaterThan(0);
    expect(businessStatus).not.toBeNull();
    expect(typeof businessStatus!.isOpen).toBe("boolean");
  });
});
