import { describe, expect, it } from "vitest";
import { duration } from "../../../src/core/duration.js";
import { ChroneraError } from "../../../src/errors/errors.js";

describe("duration", () => {
  it("accepts valid positive duration", () => {
    const d = duration({ years: 1, months: 2, days: 3 });
    expect(d).toEqual({ years: 1, months: 2, days: 3 });
  });

  it("accepts valid negative duration", () => {
    const d = duration({ days: -5, hours: -12 });
    expect(d).toEqual({ days: -5, hours: -12 });
  });

  it("rejects mixed-sign duration fields", () => {
    expect(() => duration({ days: 1, hours: -2 })).toThrow(ChroneraError);
  });

  it("rejects non-integer fields", () => {
    expect(() => duration({ days: 1.5 })).toThrow(ChroneraError);
  });
});
