import { describe, expect, it } from "vitest";
import {
  formatNumberWithSystem,
  isValidNumberingSystem,
  parseDigitsToLatin,
} from "../../../src/locale/numbering-system.js";

describe("Extended Global Numbering Systems", () => {
  it("formats and parses Fullwidth digits (fullwide)", () => {
    expect(isValidNumberingSystem("fullwide")).toBe(true);
    const formatted = formatNumberWithSystem(2026, "fullwide");
    expect(formatted).toBe("２０２６");
    expect(parseDigitsToLatin("２０２６")).toBe("2026");
  });

  it("formats and parses Hanidec digits (hanidec)", () => {
    expect(isValidNumberingSystem("hanidec")).toBe(true);
    const formatted = formatNumberWithSystem(2026, "hanidec");
    expect(formatted).toBe("二〇二六");
    expect(parseDigitsToLatin("二〇二六")).toBe("2026");
  });

  it("formats and parses Devanagari digits (deva)", () => {
    expect(isValidNumberingSystem("deva")).toBe(true);
    const formatted = formatNumberWithSystem(2026, "deva");
    expect(formatted).toBe("२०२६");
    expect(parseDigitsToLatin("२०२६")).toBe("2026");
  });

  it("formats and parses Bengali digits (beng)", () => {
    expect(isValidNumberingSystem("beng")).toBe(true);
    const formatted = formatNumberWithSystem(2026, "beng");
    expect(formatted).toBe("২০২৬");
    expect(parseDigitsToLatin("২০২৬")).toBe("2026");
  });
});
