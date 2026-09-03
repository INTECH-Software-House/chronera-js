import { describe, expect, it } from "vitest";
import { localTime } from "../../../src/core/local-time.js";
import { ChroneraError } from "../../../src/errors/errors.js";

describe("localTime", () => {
  it("constructs valid wall-clock time", () => {
    const t = localTime(13, 45, 30, 500);
    expect(t).toEqual({
      kind: "local-time",
      hour: 13,
      minute: 45,
      second: 30,
      millisecond: 500,
    });
  });

  it("defaults second and millisecond to 0", () => {
    const t = localTime(9, 15);
    expect(t).toEqual({
      kind: "local-time",
      hour: 9,
      minute: 15,
      second: 0,
      millisecond: 0,
    });
  });

  it("rejects out of range fields", () => {
    expect(() => localTime(24, 0)).toThrow(ChroneraError);
    expect(() => localTime(-1, 0)).toThrow(ChroneraError);
    expect(() => localTime(12, 60)).toThrow(ChroneraError);
    expect(() => localTime(12, 0, 60)).toThrow(ChroneraError);
    expect(() => localTime(12, 0, 0, 1000)).toThrow(ChroneraError);
  });
});
