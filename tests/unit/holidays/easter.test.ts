import { describe, it, expect } from "vitest";
import {
  calculateEasterSunday,
  calculateGoodFriday,
  calculateEasterMonday,
  calculateAscensionDay,
  calculateWhitMonday,
} from "../../../src/holidays/easter.js";

describe("Meeus Easter Cycle Algorithm", () => {
  it("computes Easter Sunday accurately for canonical years", () => {
    // 2024: March 31
    const easter2024 = calculateEasterSunday(2024);
    expect(easter2024.year).toBe(2024);
    expect(easter2024.month).toBe(3);
    expect(easter2024.day).toBe(31);

    // 2025: April 20
    const easter2025 = calculateEasterSunday(2025);
    expect(easter2025.year).toBe(2025);
    expect(easter2025.month).toBe(4);
    expect(easter2025.day).toBe(20);

    // 2026: April 5
    const easter2026 = calculateEasterSunday(2026);
    expect(easter2026.year).toBe(2026);
    expect(easter2026.month).toBe(4);
    expect(easter2026.day).toBe(5);

    // 2027: March 28
    const easter2027 = calculateEasterSunday(2027);
    expect(easter2027.year).toBe(2027);
    expect(easter2027.month).toBe(3);
    expect(easter2027.day).toBe(28);
  });

  it("computes Good Friday (Easter - 2 days)", () => {
    const gf2024 = calculateGoodFriday(2024);
    expect(gf2024.year).toBe(2024);
    expect(gf2024.month).toBe(3);
    expect(gf2024.day).toBe(29);

    const gf2026 = calculateGoodFriday(2026);
    expect(gf2026.year).toBe(2026);
    expect(gf2026.month).toBe(4);
    expect(gf2026.day).toBe(3);
  });

  it("computes Easter Monday (Easter + 1 day)", () => {
    const em2024 = calculateEasterMonday(2024);
    expect(em2024.year).toBe(2024);
    expect(em2024.month).toBe(4);
    expect(em2024.day).toBe(1);

    const em2026 = calculateEasterMonday(2026);
    expect(em2026.year).toBe(2026);
    expect(em2026.month).toBe(4);
    expect(em2026.day).toBe(6);
  });

  it("computes Ascension Day and Whit Monday correctly", () => {
    const asc2026 = calculateAscensionDay(2026);
    expect(asc2026.year).toBe(2026);
    expect(asc2026.month).toBe(5);
    expect(asc2026.day).toBe(14); // 39 days after Apr 5 is May 14

    const whit2026 = calculateWhitMonday(2026);
    expect(whit2026.year).toBe(2026);
    expect(whit2026.month).toBe(5);
    expect(whit2026.day).toBe(25); // 50 days after Apr 5 is May 25
  });
});
