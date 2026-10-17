import { describe, expect, it } from "vitest";
import {
  aChronera,
  aLocalDate,
  aInstant,
  toChronera,
  toLocalDate,
} from "../../../src/arktype/index.js";
import { Chronera } from "../../../src/chronera.js";
import { localDate } from "../../../src/core/local-date.js";
import { type } from "arktype";

describe("ArkType Integration", () => {
  it("validates and parses valid ISO string into Chronera instance", () => {
    const schema = aChronera();
    const result = schema("2026-10-17");

    expect(result).toBeInstanceOf(Chronera);
    expect((result as Chronera).format("yyyy-MM-dd")).toBe("2026-10-17");
  });

  it("validates into domain LocalDate", () => {
    const schema = aLocalDate();
    const result = schema("2026-10-17");

    expect(result).toEqual(localDate(2026, 10, 17));
  });

  it("validates into domain Instant", () => {
    const schema = aInstant();
    const result = schema("2026-10-17T12:00:00.000Z");

    expect((result as { epochMilliseconds: number }).epochMilliseconds).toBe(
      new Date("2026-10-17T12:00:00.000Z").getTime(),
    );
  });

  it("enforces min date boundary", () => {
    const schema = aChronera({ min: "2026-10-01" });

    // Valid
    const valid = schema("2026-10-15");
    expect(valid).toBeInstanceOf(Chronera);

    // Invalid (before min)
    const invalid = schema("2026-09-20");
    expect(invalid).toBeInstanceOf(type.errors);
  });

  it("enforces max date boundary", () => {
    const schema = aChronera({ max: "2026-10-31" });

    const valid = schema("2026-10-15");
    expect(valid).toBeInstanceOf(Chronera);

    const invalid = schema("2026-11-05");
    expect(invalid).toBeInstanceOf(type.errors);
  });

  it("enforces weekend and weekday checks", () => {
    const weekdaySchema = aChronera({ weekday: true });
    // 2026-10-16 is Friday
    expect(weekdaySchema("2026-10-16")).toBeInstanceOf(Chronera);
    // 2026-10-17 is Saturday
    expect(weekdaySchema("2026-10-17")).toBeInstanceOf(type.errors);

    const weekendSchema = aChronera({ weekend: true });
    expect(weekendSchema("2026-10-17")).toBeInstanceOf(Chronera);
    expect(weekendSchema("2026-10-16")).toBeInstanceOf(type.errors);
  });

  it("works with pipe functions", () => {
    const schema = type("string").pipe(toChronera);
    const res = schema("2026-10-17");
    expect(res).toBeInstanceOf(Chronera);

    const ldSchema = type("string").pipe(toLocalDate);
    expect(ldSchema("2026-10-17")).toEqual(localDate(2026, 10, 17));
  });
});
