import { describe, expect, it } from "vitest";
import { formatDateRange } from "../../../src/format/format-date-range.js";
import { parseLocalDate } from "../../../src/parse/parse-local-date.js";
import { dateRange } from "../../../src/core/range.js";
import { ChroneraError } from "../../../src/errors/errors.js";

describe("formatDateRange", () => {
  const start = parseLocalDate("2026-09-01");
  const end = parseLocalDate("2026-09-05");

  it("formats date range with en-US", () => {
    const res = formatDateRange(dateRange(start, end), {
      locale: "en-US",
      style: "medium",
    });
    expect(res).toContain("Sep");
  });

  it("rejects start after end", () => {
    expect(() => formatDateRange(dateRange(end, start))).toThrow(ChroneraError);
  });

  it("forbids timeZone option on date-only range", () => {
    expect(() =>
      formatDateRange(dateRange(start, end), { timeZone: "UTC" }),
    ).toThrow(ChroneraError);
  });
});
