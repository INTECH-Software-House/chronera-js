import { describe, expect, it } from "vitest";
import { formatWithPattern } from "../../../src/format/format-pattern.js";
import { parseLocalDate } from "../../../src/parse/parse-local-date.js";
import { instantFromEpochMilliseconds } from "../../../src/core/instant.js";

describe("formatWithPattern", () => {
  const date = parseLocalDate("2026-09-02");

  it("formats numeric pattern yyyy-MM-dd", () => {
    expect(formatWithPattern(date, "yyyy-MM-dd")).toBe("2026-09-02");
  });

  it("formats pattern with single-quoted literals", () => {
    expect(
      formatWithPattern(date, "dd MMMM yyyy 'at midnight'", {
        locale: "en-US",
      }),
    ).toBe("02 September 2026 at midnight");
  });

  it("handles double single-quotes for literal apostrophe", () => {
    expect(formatWithPattern(date, "'It''s' yyyy")).toBe("It's 2026");
  });

  it("formats instant with time and timezone pattern tokens", () => {
    // 2026-09-02T06:45:00Z
    const inst = instantFromEpochMilliseconds(1788331500000);
    const formatted = formatWithPattern(inst, "yyyy-MM-dd HH:mm:ss XXX", {
      timeZone: "UTC",
    });
    expect(formatted).toBe("2026-09-02 06:45:00 Z");
  });
});
