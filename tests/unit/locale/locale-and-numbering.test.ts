import { describe, expect, it } from "vitest";
import { validateAndResolveLocale } from "../../../src/locale/resolve-locale.js";
import {
  formatNumberWithSystem,
  parseDigitsToLatin,
} from "../../../src/locale/numbering-system.js";
import { normalizeInputDigits } from "../../../src/parse/field-normalizer.js";
import { ChroneraError } from "../../../src/errors/errors.js";

describe("locale and numbering systems", () => {
  it("resolves basic BCP 47 locale", () => {
    const res = validateAndResolveLocale("en-US");
    expect(res.baseLocale).toBe("en-US");
  });

  it("extracts Unicode extension keywords -u-ca- and -u-nu-", () => {
    const res = validateAndResolveLocale("th-TH-u-ca-buddhist-nu-thai");
    expect(res.baseLocale).toBe("th-TH");
    expect(res.unicodeCalendar).toBe("buddhist");
    expect(res.unicodeNumberingSystem).toBe("thai");
  });

  it("rejects invalid locale string", () => {
    expect(() => validateAndResolveLocale("invalid_locale!")).toThrow(
      ChroneraError,
    );
  });

  it("translates digits between Latin and Arabic/Thai numbering systems", () => {
    const arabDigits = formatNumberWithSystem(12345, "arab");
    expect(arabDigits).toBe("١٢٣٤٥");
    expect(parseDigitsToLatin(arabDigits)).toBe("12345");

    const thaiDigits = formatNumberWithSystem(2026, "thai");
    expect(thaiDigits).toBe("๒๐๒๖");
    expect(normalizeInputDigits(thaiDigits)).toBe("2026");
  });
});
