import { describe, expect, it } from "vitest";
import {
  toSqlDate,
  fromSqlDate,
  toSqlTimestamp,
  fromSqlTimestamp,
  createChroneraDateColumn,
  createChroneraTimestampColumn,
  chroneraDateConfig,
  chroneraTimestampConfig,
} from "../../../src/drizzle/index.js";
import { localDate } from "../../../src/core/local-date.js";
import { chronera } from "../../../src/chronera.js";
import { customType } from "drizzle-orm/pg-core";

describe("Drizzle ORM & Universal SQL Integration", () => {
  describe("Universal SQL Serializers", () => {
    it("serializes various date inputs to SQL DATE (YYYY-MM-DD)", () => {
      expect(toSqlDate(localDate(2026, 10, 17))).toBe("2026-10-17");
      expect(toSqlDate(chronera("2026-10-17"))).toBe("2026-10-17");
      expect(toSqlDate(new Date(2026, 9, 17))).toBe("2026-10-17");
      expect(toSqlDate("2026-10-17T12:00:00Z")).toBe("2026-10-17");
    });

    it("deserializes SQL DATE to Chronera instance", () => {
      const c = fromSqlDate("2026-10-17");
      expect(c.format("yyyy-MM-dd")).toBe("2026-10-17");
      expect(c.toLocalDate()).toEqual(localDate(2026, 10, 17));
    });

    it("serializes to SQL TIMESTAMPTZ", () => {
      const iso = toSqlTimestamp(new Date(Date.UTC(2026, 9, 17, 12, 0, 0)));
      expect(iso).toBe("2026-10-17T12:00:00.000Z");
    });

    it("deserializes SQL TIMESTAMPTZ to Chronera instance", () => {
      const c = fromSqlTimestamp("2026-10-17T12:00:00.000Z");
      expect(c.toISOString()).toBe("2026-10-17T12:00:00.000Z");
    });
  });

  describe("Drizzle Column Custom Types", () => {
    it("provides valid customType configs", () => {
      expect(chroneraDateConfig.dataType()).toBe("date");
      expect(chroneraDateConfig.toDriver("2026-10-17")).toBe("2026-10-17");
      expect(
        chroneraDateConfig.fromDriver("2026-10-17").format("yyyy-MM-dd"),
      ).toBe("2026-10-17");

      expect(chroneraTimestampConfig.dataType()).toBe(
        "timestamp with time zone",
      );
    });

    it("instantiates customType column builders with Drizzle pg-core", () => {
      const dateColumn = createChroneraDateColumn(customType);
      expect(typeof dateColumn).toBe("function");

      const col = dateColumn("birth_date");
      expect(col).toBeDefined();

      const timestampColumn = createChroneraTimestampColumn(customType);
      const tsCol = timestampColumn("created_at");
      expect(tsCol).toBeDefined();
    });
  });
});
