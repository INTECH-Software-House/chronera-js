import { describe, expect, it } from "vitest";
import { localDateTime } from "../../../src/core/local-date-time.js";
import { localDate } from "../../../src/core/local-date.js";
import { localTime } from "../../../src/core/local-time.js";
import { ChroneraError } from "../../../src/errors/errors.js";

describe("localDateTime", () => {
  it("creates valid localDateTime from date and time", () => {
    const d = localDate(2026, 9, 2);
    const t = localTime(14, 30);
    const ldt = localDateTime(d, t);
    expect(ldt.kind).toBe("local-date-time");
    expect(ldt.date).toBe(d);
    expect(ldt.time).toBe(t);
  });

  it("rejects invalid date argument", () => {
    const t = localTime(14, 30);
    expect(() =>
      localDateTime({} as unknown as ReturnType<typeof localDate>, t),
    ).toThrow(ChroneraError);
  });

  it("rejects invalid time argument", () => {
    const d = localDate(2026, 9, 2);
    expect(() =>
      localDateTime(d, {} as unknown as ReturnType<typeof localTime>),
    ).toThrow(ChroneraError);
  });
});
