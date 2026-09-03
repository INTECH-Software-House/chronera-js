import { describe, expect, it } from "vitest";
import { formatDate } from "../../../src/format/format-date.js";
import { parseLocalDate } from "../../../src/parse/parse-local-date.js";

describe("Thai official date presets", () => {
  const date = parseLocalDate("2026-09-02");

  it("formats thai-official-date with Latin digits", () => {
    const output = formatDate(date, {
      locale: "th-TH",
      calendar: "buddhist",
      preset: "thai-official-date",
      numberingSystem: "latn",
    });

    expect(output).toBe("วันที่ 2 กันยายน พ.ศ. 2569");
  });

  it("formats thai-official-date with Thai digits", () => {
    const output = formatDate(date, {
      locale: "th-TH",
      calendar: "buddhist",
      preset: "thai-official-date",
      numberingSystem: "thai",
    });

    expect(output).toBe("วันที่ ๒ กันยายน พ.ศ. ๒๕๖๙");
  });

  it("formats thai-official-date-with-weekday", () => {
    const output = formatDate(date, {
      locale: "th-TH",
      calendar: "buddhist",
      preset: "thai-official-date-with-weekday",
      numberingSystem: "latn",
    });

    // 2026-09-02 is Wednesday (วันพุธ)
    expect(output).toBe("วันพุธที่ 2 กันยายน พ.ศ. 2569");
  });
});
