import { describe, expect, it } from "vitest";
import { formatTime } from "../../../src/format/format-time.js";
import { localTime } from "../../../src/core/local-time.js";
import { instantFromEpochMilliseconds } from "../../../src/core/instant.js";
import { ChroneraError } from "../../../src/errors/errors.js";

describe("formatTime", () => {
  it("formats LocalTime with en-US", () => {
    const t = localTime(14, 30, 0);
    const res = formatTime(t, { locale: "en-US", style: "short" });
    expect(res).toMatch(/2:30\s*PM/i);
  });

  it("formats LocalTime with hourCycle h23", () => {
    const t = localTime(14, 30, 0);
    const res = formatTime(t, {
      locale: "en-US",
      style: "short",
      hourCycle: "h23",
    });
    expect(res).toContain("14:30");
  });

  it("formats LocalTime with numberingSystem thai", () => {
    const t = localTime(14, 30, 0);
    const res = formatTime(t, {
      locale: "th-TH",
      style: "short",
      hourCycle: "h23",
      numberingSystem: "thai",
    });
    expect(res).toContain("๑๔:๓๐");
  });

  it("rejects timeZone option for LocalTime", () => {
    const t = localTime(14, 30);
    expect(() => formatTime(t, { timeZone: "UTC" })).toThrow(ChroneraError);
  });

  it("formats Instant projecting through timezone", () => {
    // 2026-09-02T06:45:00Z -> 13:45 in Asia/Bangkok
    const inst = instantFromEpochMilliseconds(1788331500000);
    const res = formatTime(inst, {
      locale: "en-GB",
      timeZone: "Asia/Bangkok",
      style: "short",
    });
    expect(res).toContain("13:45");
  });

  it("formats Date object projecting through timezone", () => {
    const d = new Date("2026-09-02T06:45:00Z");
    const res = formatTime(d, {
      locale: "en-GB",
      timeZone: "UTC",
      style: "short",
    });
    expect(res).toContain("06:45");
  });

  it("rejects invalid input type", () => {
    expect(() =>
      formatTime({} as unknown as ReturnType<typeof localTime>),
    ).toThrow(ChroneraError);
  });
});
