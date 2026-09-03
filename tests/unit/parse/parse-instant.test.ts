import { describe, expect, it } from "vitest";
import { parseInstant } from "../../../src/parse/parse-instant.js";
import { ChroneraParseError } from "../../../src/errors/errors.js";

describe("parseInstant", () => {
  it("parses valid RFC 3339 timestamp with Z offset", () => {
    const inst = parseInstant("2026-09-02T06:45:00Z");
    expect(inst.epochMilliseconds).toBe(Date.parse("2026-09-02T06:45:00Z"));
  });

  it("parses valid RFC 3339 timestamp with positive numeric offset", () => {
    const inst = parseInstant("2026-09-02T13:45:00+07:00");
    expect(inst.epochMilliseconds).toBe(Date.parse("2026-09-02T06:45:00Z"));
  });

  it("rejects timestamp missing offset", () => {
    expect(() => parseInstant("2026-09-02T13:45:00")).toThrow(
      ChroneraParseError,
    );
  });

  it("rejects -00:00 offset", () => {
    expect(() => parseInstant("2026-09-02T13:45:00-00:00")).toThrow(
      ChroneraParseError,
    );
  });

  it("handles excess fractional seconds truncation", () => {
    const inst = parseInstant("2026-09-02T06:45:00.123456Z", {
      excessFractionalSeconds: "truncate",
    });
    const expected = Date.parse("2026-09-02T06:45:00.123Z");
    expect(inst.epochMilliseconds).toBe(expected);
  });

  it("rejects excess fractional seconds by default when precision is lost", () => {
    expect(() => parseInstant("2026-09-02T06:45:00.123456Z")).toThrow(
      ChroneraParseError,
    );
  });

  it("rejects hour 24", () => {
    expect(() => parseInstant("2026-09-02T24:00:00Z")).toThrow(
      ChroneraParseError,
    );
  });
});
