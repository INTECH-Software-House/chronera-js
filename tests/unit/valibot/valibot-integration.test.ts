import { describe, expect, it } from "vitest";
import * as v from "valibot";
import {
  vChronera,
  vLocalDate,
  vInstant,
  vZonedDateTime,
} from "../../../src/valibot/index.js";
import { Chronera } from "../../../src/chronera.js";

describe("Valibot Integration (@intech-software/chronera/valibot)", () => {
  it("validates and transforms ISO string into Chronera instance", () => {
    const schema = vChronera();
    const result = v.safeParse(schema, "2026-10-13");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output instanceof Chronera).toBe(true);
      expect(result.output.format("yyyy-MM-dd")).toBe("2026-10-13");
    }
  });

  it("rejects invalid date strings with error issue", () => {
    const schema = vChronera({ invalidMessage: "Invalid date" });
    const result = v.safeParse(schema, "not-a-date");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues[0]?.message).toBe("Invalid date");
    }
  });

  it("validates future and past constraints", () => {
    const futureSchema = vChronera({ future: true });
    expect(v.safeParse(futureSchema, "2099-01-01").success).toBe(true);
    expect(v.safeParse(futureSchema, "1990-01-01").success).toBe(false);

    const pastSchema = vChronera({ past: true });
    expect(v.safeParse(pastSchema, "1990-01-01").success).toBe(true);
    expect(v.safeParse(pastSchema, "2099-01-01").success).toBe(false);
  });

  it("validates min and max boundary constraints", () => {
    const schema = vChronera({
      min: "2026-10-10",
      max: "2026-10-20",
    });

    expect(v.safeParse(schema, "2026-10-15").success).toBe(true);
    expect(v.safeParse(schema, "2026-10-05").success).toBe(false);
    expect(v.safeParse(schema, "2026-10-25").success).toBe(false);
  });

  it("validates weekend and weekday constraints", () => {
    const weekendSchema = vChronera({ weekend: true });
    // 2026-10-10 is Saturday
    expect(v.safeParse(weekendSchema, "2026-10-10").success).toBe(true);
    // 2026-10-13 is Tuesday
    expect(v.safeParse(weekendSchema, "2026-10-13").success).toBe(false);

    const weekdaySchema = vChronera({ weekday: true });
    expect(v.safeParse(weekdaySchema, "2026-10-13").success).toBe(true);
    expect(v.safeParse(weekdaySchema, "2026-10-10").success).toBe(false);
  });

  it("validates business day constraints across countries", () => {
    const schema = vChronera({ businessDay: "TH" });
    // 2026-10-13 is King Bhumibol Adulyadej Memorial Day (Thai statutory holiday)
    expect(v.safeParse(schema, "2026-10-13").success).toBe(false);
    // 2026-10-14 is normal Wednesday business day in Thailand
    expect(v.safeParse(schema, "2026-10-14").success).toBe(true);
  });

  it("transforms directly to primitive LocalDate", () => {
    const schema = vLocalDate();
    const result = v.safeParse(schema, "2026-10-14");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toEqual({
        kind: "local-date",
        year: 2026,
        month: 10,
        day: 14,
      });
    }
  });

  it("transforms directly to primitive Instant", () => {
    const schema = vInstant();
    const result = v.safeParse(schema, "2026-10-14T00:00:00Z");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.kind).toBe("instant");
    }
  });

  it("transforms directly to ZonedDateTime", () => {
    const schema = vZonedDateTime("Asia/Bangkok");
    const result = v.safeParse(schema, "2026-10-14T00:00:00Z");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.kind).toBe("zoned-date-time");
      expect(result.output.timeZone).toBe("Asia/Bangkok");
    }
  });
});
