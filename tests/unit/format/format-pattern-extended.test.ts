import { describe, expect, it } from "vitest";
import {
  formatWithPattern,
  localDate,
  localDateTime,
  localTime,
} from "../../../src/index.js";

describe("Extended LDML Pattern Tokens (Quarters, DOY, ISO Week)", () => {
  const d = localDate(2026, 9, 2); // Wednesday, Sep 2, 2026

  it("formats quarter tokens (Q, QQQ, QQQQ)", () => {
    // September is Q3
    expect(formatWithPattern(d, "Q")).toBe("3");
    expect(formatWithPattern(d, "QQQ")).toBe("Q3");
    expect(formatWithPattern(d, "QQQQ")).toBe("3rd quarter");

    const jan = localDate(2026, 1, 10);
    expect(formatWithPattern(jan, "QQQQ")).toBe("1st quarter");
  });

  it("formats day of year tokens (D, DDD)", () => {
    // 2026-09-02 is DOY 245
    expect(formatWithPattern(d, "D")).toBe("245");
    expect(formatWithPattern(d, "DDD")).toBe("245");

    const jan = localDate(2026, 1, 5);
    expect(formatWithPattern(jan, "D")).toBe("5");
    expect(formatWithPattern(jan, "DDD")).toBe("005");
  });

  it("formats ISO week number tokens (w, ww)", () => {
    // 2026-09-02 is Week 36
    expect(formatWithPattern(d, "w")).toBe("36");
    expect(formatWithPattern(d, "ww")).toBe("36");

    const week2 = localDate(2026, 1, 8);
    expect(formatWithPattern(week2, "w")).toBe("2");
    expect(formatWithPattern(week2, "ww")).toBe("02");
  });

  it("formats local day of week number tokens (e, ee)", () => {
    // Wednesday is 3 (1 = Monday .. 7 = Sunday)
    expect(formatWithPattern(d, "e")).toBe("3");
    expect(formatWithPattern(d, "ee")).toBe("03");
  });

  it("supports LocalDateTime inputs with extended tokens", () => {
    const ldt = localDateTime(d, localTime(14, 30, 0));
    const formatted = formatWithPattern(ldt, "yyyy-DDD 'Week' ww 'Q'Q");
    expect(formatted).toBe("2026-245 Week 36 Q3");
  });
});
