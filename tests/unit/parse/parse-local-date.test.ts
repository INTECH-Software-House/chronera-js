import { describe, expect, it } from "vitest";
import { parseLocalDate } from "../../../src/parse/parse-local-date.js";
import {
  ChroneraError,
  ChroneraParseError,
} from "../../../src/errors/errors.js";

describe("parseLocalDate", () => {
  it("parses valid ISO 8601 date string", () => {
    const d = parseLocalDate("2026-09-02");
    expect(d).toEqual({
      kind: "local-date",
      year: 2026,
      month: 9,
      day: 2,
    });
  });

  it("parses with custom pattern and en-GB format", () => {
    const d = parseLocalDate("02/09/2026", {
      pattern: "dd/MM/yyyy",
      locale: "en-GB",
    });
    expect(d).toEqual({
      kind: "local-date",
      year: 2026,
      month: 9,
      day: 2,
    });
  });

  it("parses with custom pattern and en-US format", () => {
    const d = parseLocalDate("09/02/2026", {
      pattern: "MM/dd/yyyy",
      locale: "en-US",
    });
    expect(d).toEqual({
      kind: "local-date",
      year: 2026,
      month: 9,
      day: 2,
    });
  });

  it("rejects invalid date rollover 2026-02-30", () => {
    expect(() => parseLocalDate("2026-02-30")).toThrow(ChroneraError);
  });

  it("rejects untrimmed input", () => {
    expect(() => parseLocalDate(" 2026-09-02 ")).toThrow(ChroneraParseError);
  });

  it("rejects year zero", () => {
    expect(() => parseLocalDate("0000-01-01")).toThrow(ChroneraError);
  });

  it("rejects input exceeding 4096 characters", () => {
    const longStr = "2026-09-02".padEnd(4097, "x");
    expect(() => parseLocalDate(longStr)).toThrow(ChroneraError);
  });
});
