import { describe, it, expect, beforeEach } from "vitest";
import SuperJSON from "superjson";
import {
  registerChroneraSuperJSON,
  chroneraSuperJSONTransformer,
  localDateSuperJSONTransformer,
  instantSuperJSONTransformer,
  zonedDateTimeSuperJSONTransformer,
  calendarDateSuperJSONTransformer,
} from "../../../src/superjson/index.js";
import { chronera, Chronera } from "../../../src/chronera.js";
import { localDate } from "../../../src/core/local-date.js";
import { instantFromEpochMilliseconds } from "../../../src/core/instant.js";
import { zonedDateTime } from "../../../src/core/zoned-date-time.js";
import { calendarDate } from "../../../src/core/calendar-date.js";

describe("SuperJSON Integration (@intech-software/chronera/superjson)", () => {
  beforeEach(() => {
    registerChroneraSuperJSON(SuperJSON);
  });

  describe("Chronera fluent instance serialization", () => {
    it("serializes and deserializes Chronera wrapping LocalDate with full method preservation", () => {
      const c = chronera("2026-09-27");
      const serialized = SuperJSON.stringify(c);
      const deserialized = SuperJSON.parse<Chronera>(serialized);

      expect(deserialized).toBeInstanceOf(Chronera);
      expect(deserialized.format()).toBe("Sep 27, 2026");
      expect(deserialized.format("yyyy-MM-dd")).toBe("2026-09-27");
      expect(deserialized.addDays(3).format("yyyy-MM-dd")).toBe("2026-09-30");
      expect(deserialized.isWeekend()).toBe(true); // Sep 27, 2026 is Sunday
      expect(deserialized.toLocalDate()).toEqual(localDate(2026, 9, 27));
    });

    it("serializes and deserializes Chronera wrapping Instant", () => {
      const c = chronera("2026-09-27T10:30:00.000Z");
      const serialized = SuperJSON.stringify(c);
      const deserialized = SuperJSON.parse<Chronera>(serialized);

      expect(deserialized).toBeInstanceOf(Chronera);
      expect(deserialized.toISOString()).toBe("2026-09-27T10:30:00.000Z");
      expect(deserialized.toInstant().epochMilliseconds).toBe(
        c.toInstant().epochMilliseconds,
      );
    });

    it("serializes and deserializes Chronera wrapping ZonedDateTime", () => {
      const c = chronera("2026-09-27T17:30:00+07:00[Asia/Bangkok]");
      const serialized = SuperJSON.stringify(c);
      const deserialized = SuperJSON.parse<Chronera>(serialized);

      expect(deserialized).toBeInstanceOf(Chronera);
      expect(deserialized.toZonedDateTime("Asia/Bangkok").timeZone).toBe(
        "Asia/Bangkok",
      );
      expect(deserialized.toIXDTF()).toContain("Asia/Bangkok");
    });

    it("serializes and deserializes Chronera wrapping CalendarDate", () => {
      const cal = calendarDate({
        calendar: "buddhist",
        era: "BE",
        eraYear: 2569,
        year: 2569,
        monthCode: "M09",
        day: 27,
      });
      const c = chronera(cal);
      const serialized = SuperJSON.stringify(c);
      const deserialized = SuperJSON.parse<Chronera>(serialized);

      expect(deserialized).toBeInstanceOf(Chronera);
      expect(deserialized.kind).toBe("calendar-date");
      expect(deserialized.format({ calendar: "buddhist" })).toBeDefined();
    });
  });

  describe("Domain value types serialization", () => {
    it("serializes and deserializes domain LocalDate", () => {
      const ld = localDate(2026, 9, 27);
      const serialized = SuperJSON.stringify(ld);
      const deserialized = SuperJSON.parse(serialized);

      expect(deserialized).toEqual(ld);
      expect(localDateSuperJSONTransformer.isApplicable(ld)).toBe(true);
      expect(localDateSuperJSONTransformer.isApplicable({ year: 2026 })).toBe(
        false,
      );
    });

    it("serializes and deserializes domain Instant", () => {
      const inst = instantFromEpochMilliseconds(1788637826561);
      const serialized = SuperJSON.stringify(inst);
      const deserialized = SuperJSON.parse(serialized);

      expect(deserialized).toEqual(inst);
      expect(instantSuperJSONTransformer.isApplicable(inst)).toBe(true);
      expect(
        instantSuperJSONTransformer.isApplicable({ epochMilliseconds: 123 }),
      ).toBe(false);
    });

    it("serializes and deserializes domain ZonedDateTime", () => {
      const inst = instantFromEpochMilliseconds(1788637826561);
      const zdt = zonedDateTime(inst, "Asia/Tokyo");
      const serialized = SuperJSON.stringify(zdt);
      const deserialized = SuperJSON.parse(serialized);

      expect(deserialized).toEqual(zdt);
      expect(zonedDateTimeSuperJSONTransformer.isApplicable(zdt)).toBe(true);
    });

    it("serializes and deserializes domain CalendarDate", () => {
      const cd = calendarDate({
        calendar: "buddhist",
        era: "BE",
        eraYear: 2569,
        year: 2569,
        monthCode: "M09",
        day: 27,
      });
      const serialized = SuperJSON.stringify(cd);
      const deserialized = SuperJSON.parse(serialized);

      expect(deserialized).toEqual(cd);
      expect(calendarDateSuperJSONTransformer.isApplicable(cd)).toBe(true);
    });
  });

  describe("Fullstack RPC & Next.js simulated payload", () => {
    it("round-trips complex nested payload with mixed Chronera instances and primitives", () => {
      const payload = {
        userId: "user_12345",
        status: "active",
        createdAt: chronera("2026-09-27T08:00:00.000Z"),
        settlementDate: chronera("2026-09-28"),
        metadata: {
          expiry: localDate(2027, 9, 28),
          tags: ["fintech", "payment"],
        },
      };

      const serialized = SuperJSON.stringify(payload);
      const deserialized = SuperJSON.parse<typeof payload>(serialized);

      expect(deserialized.userId).toBe("user_12345");
      expect(deserialized.createdAt).toBeInstanceOf(Chronera);
      expect(deserialized.createdAt.toISOString()).toBe(
        "2026-09-27T08:00:00.000Z",
      );
      expect(deserialized.settlementDate).toBeInstanceOf(Chronera);
      expect(deserialized.settlementDate.format("yyyy-MM-dd")).toBe(
        "2026-09-28",
      );
      expect(deserialized.metadata.expiry).toEqual(localDate(2027, 9, 28));
    });
  });

  describe("Transformer unit guards", () => {
    it("chroneraSuperJSONTransformer guards non-chronera values", () => {
      expect(chroneraSuperJSONTransformer.isApplicable(null)).toBe(false);
      expect(chroneraSuperJSONTransformer.isApplicable(undefined)).toBe(false);
      expect(chroneraSuperJSONTransformer.isApplicable("2026-09-27")).toBe(
        false,
      );
      expect(chroneraSuperJSONTransformer.isApplicable(12345)).toBe(false);
      expect(chroneraSuperJSONTransformer.isApplicable(new Date())).toBe(false);
      expect(chroneraSuperJSONTransformer.isApplicable(chronera())).toBe(true);
    });
  });
});
