import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  zChronera,
  zLocalDate,
  zInstant,
  zZonedDateTime,
} from "../../../src/zod/index.js";
import { Chronera } from "../../../src/chronera.js";

describe("Zod Integration (@intech-software/chronera/zod)", () => {
  it("parses valid date string into a Chronera instance", () => {
    const schema = z.object({
      date: zChronera(),
    });

    const result = schema.safeParse({ date: "2026-10-03" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toBeInstanceOf(Chronera);
      expect(result.data.date.format("yyyy-MM-dd")).toBe("2026-10-03");
    }
  });

  it("fails on invalid date string", () => {
    const schema = z.object({
      date: zChronera(),
    });

    const result = schema.safeParse({ date: "not-a-valid-date" });
    expect(result.success).toBe(false);
  });

  it("parses RFC 9557 IXDTF strings with timezone & calendar annotations", () => {
    const schema = z.object({
      date: zChronera(),
    });

    const result = schema.safeParse({
      date: "2026-10-03T01:13:43+07:00[Asia/Bangkok][u-ca=buddhist]",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date.toIXDTF()).toBe(
        "2026-10-03T01:13:43+07:00[Asia/Bangkok][u-ca=buddhist]",
      );
    }
  });

  it("validates min and max dates", () => {
    const schema = z.object({
      date: zChronera({
        min: "2026-10-01",
        max: "2026-10-31",
      }),
    });

    // Valid
    expect(schema.safeParse({ date: "2026-10-15" }).success).toBe(true);
    // Before min
    expect(schema.safeParse({ date: "2026-09-30" }).success).toBe(false);
    // After max
    expect(schema.safeParse({ date: "2026-11-01" }).success).toBe(false);
  });

  it("validates future and past constraints", () => {
    const futureSchema = z.object({
      date: zChronera({ future: true }),
    });

    const pastSchema = z.object({
      date: zChronera({ past: true }),
    });

    // 2099 is in the future
    expect(futureSchema.safeParse({ date: "2099-01-01" }).success).toBe(true);
    expect(pastSchema.safeParse({ date: "2099-01-01" }).success).toBe(false);

    // 2000 is in the past
    expect(futureSchema.safeParse({ date: "2000-01-01" }).success).toBe(false);
    expect(pastSchema.safeParse({ date: "2000-01-01" }).success).toBe(true);
  });

  it("validates business day and public holiday rules", () => {
    const schema = z.object({
      businessDay: zChronera({
        businessDay: ["TH", "SG"],
      }),
    });

    // 2026-04-10 is a regular working Friday
    expect(schema.safeParse({ businessDay: "2026-04-10" }).success).toBe(true);

    // 2026-04-11 is Saturday (weekend)
    expect(schema.safeParse({ businessDay: "2026-04-11" }).success).toBe(false);

    // 2026-04-13 is Songkran in Thailand
    expect(schema.safeParse({ businessDay: "2026-04-13" }).success).toBe(false);

    // 2026-08-09 is National Day in Singapore
    expect(schema.safeParse({ businessDay: "2026-08-09" }).success).toBe(false);
  });

  it("transforms directly into LocalDate via zLocalDate", () => {
    const schema = z.object({
      birthDate: zLocalDate(),
    });

    const result = schema.safeParse({ birthDate: "2026-10-03" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.birthDate).toEqual({
        kind: "local-date",
        year: 2026,
        month: 10,
        day: 3,
      });
    }
  });

  it("transforms directly into Instant via zInstant", () => {
    const schema = z.object({
      timestamp: zInstant(),
    });

    const result = schema.safeParse({
      timestamp: "2026-10-03T01:13:43.000Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timestamp.kind).toBe("instant");
      expect(typeof result.data.timestamp.epochMilliseconds).toBe("number");
    }
  });

  it("transforms into ZonedDateTime via zZonedDateTime", () => {
    const schema = z.object({
      meeting: zZonedDateTime("Asia/Bangkok"),
    });

    const result = schema.safeParse({
      meeting: "2026-10-03T01:13:43.000Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.meeting.kind).toBe("zoned-date-time");
      expect(result.data.meeting.timeZone).toBe("Asia/Bangkok");
    }
  });
});
