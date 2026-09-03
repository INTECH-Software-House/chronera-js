import { describe, expect, it } from "vitest";
import {
  safeParseInstant,
  safeParseLocalDate,
} from "../../../src/parse/safe-parse.js";

describe("safeParse", () => {
  it("safeParseLocalDate returns success true on valid input", () => {
    const res = safeParseLocalDate("2026-09-02");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.value.year).toBe(2026);
    }
  });

  it("safeParseLocalDate returns success false on invalid date without throwing", () => {
    const res = safeParseLocalDate("2026-02-30");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe("CHRONERA_INVALID_DATE");
    }
  });

  it("safeParseInstant returns success true on valid timestamp", () => {
    const res = safeParseInstant("2026-09-02T06:45:00Z");
    expect(res.success).toBe(true);
  });

  it("safeParseInstant returns success false on missing offset", () => {
    const res = safeParseInstant("2026-09-02T06:45:00");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe("CHRONERA_PARSE_FAILED");
    }
  });
});
