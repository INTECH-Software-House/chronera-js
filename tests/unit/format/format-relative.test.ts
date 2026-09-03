import { describe, expect, it } from "vitest";
import { formatRelative } from "../../../src/format/format-relative.js";
import { parseLocalDate } from "../../../src/parse/parse-local-date.js";
import { instantFromEpochMilliseconds } from "../../../src/core/instant.js";

describe("formatRelative", () => {
  it("formats relative days with auto numeric", () => {
    const d1 = parseLocalDate("2026-09-02");
    const d2 = parseLocalDate("2026-09-03");

    const res = formatRelative(d2, {
      relativeTo: d1,
      locale: "en-US",
      numeric: "auto",
    });
    expect(res).toBe("tomorrow");
  });

  it("formats relative seconds with instant", () => {
    const i1 = instantFromEpochMilliseconds(10000);
    const i2 = instantFromEpochMilliseconds(40000);

    const res = formatRelative(i2, {
      relativeTo: i1,
      locale: "en-US",
      numeric: "always",
    });
    expect(res).toBe("in 30 seconds");
  });
});
