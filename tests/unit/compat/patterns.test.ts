import { describe, expect, it } from "vitest";
import {
  convertDayjsPattern,
  isDayjsPattern,
} from "../../../src/compat/patterns.js";
import { formatDayjs } from "../../../src/compat/index.js";
import { chronera } from "../../../src/chronera.js";

describe("Day.js & Moment Pattern Converter", () => {
  it("translates standard date formats (YYYY-MM-DD -> yyyy-MM-dd)", () => {
    expect(convertDayjsPattern("YYYY-MM-DD")).toBe("yyyy-MM-dd");
    expect(convertDayjsPattern("DD/MM/YYYY")).toBe("dd/MM/yyyy");
    expect(convertDayjsPattern("YYYY-MM-DD HH:mm:ss")).toBe(
      "yyyy-MM-dd HH:mm:ss",
    );
  });

  it("translates escaped text inside square brackets [at] -> 'at'", () => {
    expect(convertDayjsPattern("YYYY-MM-DD [at] HH:mm")).toBe(
      "yyyy-MM-dd 'at' HH:mm",
    );
    expect(convertDayjsPattern("DD MMM YYYY [o'clock]")).toBe(
      "dd MMM yyyy 'o''clock'",
    );
  });

  it("detects Day.js patterns with isDayjsPattern", () => {
    expect(isDayjsPattern("YYYY-MM-DD")).toBe(true);
    expect(isDayjsPattern("DD/MM/YYYY")).toBe(true);
    expect(isDayjsPattern("yyyy-MM-dd")).toBe(false);
  });

  it("formats dates using formatDayjs", () => {
    const formatted = formatDayjs("2026-10-13T15:30:00Z", "YYYY-MM-DD HH:mm");
    expect(formatted).toBe("2026-10-13 15:30");
  });

  it("formats dates using Chronera.prototype.formatDayjs directly", () => {
    const c = chronera("2026-10-13T08:00:00Z");
    expect(c.formatDayjs("YYYY-MM-DD")).toBe("2026-10-13");
    expect(c.format("YYYY-MM-DD", { syntax: "dayjs" })).toBe("2026-10-13");
    // Auto-detection of YYYY
    expect(c.format("YYYY-MM-DD")).toBe("2026-10-13");
  });
});
