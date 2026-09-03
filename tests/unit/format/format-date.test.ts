import { describe, expect, it } from "vitest";
import { formatDate } from "../../../src/format/format-date.js";
import { parseLocalDate } from "../../../src/parse/parse-local-date.js";
import { ChroneraError } from "../../../src/errors/errors.js";

describe("formatDate", () => {
  const fixedDate = parseLocalDate("2026-09-02");

  it("formats date with en-US and gregory", () => {
    const res = formatDate(fixedDate, {
      locale: "en-US",
      calendar: "gregory",
      style: "long",
    });
    expect(res).toContain("2026");
    expect(res).toContain("September");
  });

  it("formats date with en-GB", () => {
    const res = formatDate(fixedDate, {
      locale: "en-GB",
      calendar: "gregory",
      style: "long",
    });
    expect(res).toContain("September");
    expect(res).toContain("2026");
  });

  it("formats Buddhist calendar date", () => {
    const res = formatDate(fixedDate, {
      locale: "en-US",
      calendar: "buddhist",
      style: "long",
    });
    expect(res).toContain("2569");
  });

  it("forbids timeZone option for date-only input", () => {
    expect(() =>
      formatDate(fixedDate, {
        timeZone: "UTC",
      }),
    ).toThrow(ChroneraError);
  });

  it("does not mutate a caller-owned Date or options object", () => {
    const input = new Date("2026-09-02T06:45:00Z");
    const before = input.getTime();
    const options = Object.freeze({
      locale: "en-GB",
      calendar: "gregory" as const,
      timeZone: "UTC",
    });

    formatDate(input, options);

    expect(input.getTime()).toBe(before);
    expect(options).toEqual({
      locale: "en-GB",
      calendar: "gregory",
      timeZone: "UTC",
    });
  });
});
