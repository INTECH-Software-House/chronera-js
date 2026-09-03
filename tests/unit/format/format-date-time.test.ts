import { describe, expect, it } from "vitest";
import { formatDateTime } from "../../../src/format/format-date-time.js";
import { localDateTime } from "../../../src/core/local-date-time.js";
import { localDate } from "../../../src/core/local-date.js";
import { localTime } from "../../../src/core/local-time.js";
import { instantFromEpochMilliseconds } from "../../../src/core/instant.js";
import { ChroneraError } from "../../../src/errors/errors.js";
import type { LocalDateTime } from "../../../src/public-types.js";

describe("formatDateTime", () => {
  it("formats LocalDateTime", () => {
    const ldt = localDateTime(localDate(2026, 9, 2), localTime(14, 30));
    const res = formatDateTime(ldt, {
      locale: "en-US",
      dateStyle: "medium",
      timeStyle: "short",
    });
    expect(res).toContain("Sep 2, 2026");
    expect(res).toMatch(/2:30\s*PM/i);
  });

  it("formats LocalDateTime with Thai digits and Buddhist calendar", () => {
    const ldt = localDateTime(localDate(2026, 9, 2), localTime(14, 30));
    const res = formatDateTime(ldt, {
      locale: "th-TH",
      calendar: "buddhist",
      numberingSystem: "thai",
    });
    expect(res).toContain("๒๕๖๙");
  });

  it("rejects timeZone option for LocalDateTime", () => {
    const ldt = localDateTime(localDate(2026, 9, 2), localTime(14, 30));
    expect(() => formatDateTime(ldt, { timeZone: "UTC" })).toThrow(
      ChroneraError,
    );
  });

  it("formats Instant projecting through timezone", () => {
    const inst = instantFromEpochMilliseconds(1788331500000);
    const res = formatDateTime(inst, {
      locale: "en-US",
      timeZone: "Asia/Bangkok",
    });
    expect(res).toContain("2026");
  });

  it("formats Date object", () => {
    const d = new Date("2026-09-02T06:45:00Z");
    const res = formatDateTime(d, {
      locale: "en-US",
      timeZone: "UTC",
    });
    expect(res).toContain("2026");
  });

  it("rejects invalid input", () => {
    expect(() => formatDateTime({} as unknown as LocalDateTime)).toThrow(
      ChroneraError,
    );
  });
});
