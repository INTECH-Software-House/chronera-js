import { describe, expect, it } from "vitest";
import {
  standardChronera,
  standardLocalDate,
  standardInstant,
  standardZonedDateTime,
} from "../../../src/standard/index.js";
import { Chronera } from "../../../src/chronera.js";

describe("Standard Schema Specification (~standard)", () => {
  it("implements standard schema specification properties", () => {
    const schema = standardChronera();
    expect(schema["~standard"]).toBeDefined();
    expect(schema["~standard"].version).toBe(1);
    expect(schema["~standard"].vendor).toBe("chronera");
    expect(typeof schema["~standard"].validate).toBe("function");
  });

  it("validates valid dates and returns value result", () => {
    const schema = standardChronera();
    const result = schema["~standard"].validate("2026-10-14");
    expect("value" in result).toBe(true);
    if ("value" in result) {
      expect(result.value instanceof Chronera).toBe(true);
      expect(result.value.format("yyyy-MM-dd")).toBe("2026-10-14");
    }
  });

  it("validates constraints and returns standard issues", () => {
    const schema = standardChronera({
      businessDay: "TH",
      min: "2026-10-15",
    });

    // 2026-10-13 is Thai holiday
    const holidayRes = schema["~standard"].validate("2026-10-13");
    expect("issues" in holidayRes).toBe(true);

    // 2026-10-16 is Friday business day after min
    const validRes = schema["~standard"].validate("2026-10-16");
    expect("value" in validRes).toBe(true);
  });

  it("supports primitive transformations: standardLocalDate, standardInstant, standardZonedDateTime", () => {
    const sDate = standardLocalDate();
    const resDate = sDate["~standard"].validate("2026-10-14");
    if ("value" in resDate) {
      expect(resDate.value).toEqual({
        kind: "local-date",
        year: 2026,
        month: 10,
        day: 14,
      });
    }

    const sInstant = standardInstant();
    const resInst = sInstant["~standard"].validate("2026-10-14T12:00:00Z");
    if ("value" in resInst) {
      expect(resInst.value.kind).toBe("instant");
    }

    const sZoned = standardZonedDateTime("Asia/Tokyo");
    const resZoned = sZoned["~standard"].validate("2026-10-14T12:00:00Z");
    if ("value" in resZoned) {
      expect(resZoned.value.timeZone).toBe("Asia/Tokyo");
    }
  });
});
