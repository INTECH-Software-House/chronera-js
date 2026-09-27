import { ChroneraError, ChroneraParseError } from "../errors/errors.js";
import { localDate } from "../core/local-date.js";
import { parseDateWithPattern } from "./pattern-parser.js";
import { validateAndResolveLocale } from "../locale/resolve-locale.js";

import type { LocalDate, ParseLocalDateOptions } from "../public-types.js";

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseLocalDate(
  input: string,
  options?: Readonly<ParseLocalDateOptions>,
): LocalDate {
  if (typeof input !== "string") {
    throw new ChroneraParseError(
      "CHRONERA_PARSE_FAILED",
      `Expected string input; received ${typeof input}.`,
    );
  }

  if (input.length > 4096) {
    throw new ChroneraError(
      "CHRONERA_INPUT_TOO_LONG",
      `Input length ${input.length} exceeds maximum allowed limit of 4096 characters.`,
    );
  }

  if (options?.pattern) {
    const localeInfo = validateAndResolveLocale(options.locale);
    return parseDateWithPattern(input, options.pattern, localeInfo.baseLocale);
  }

  // Fast-path: Standard 10-character ISO YYYY-MM-DD
  if (input.length === 10) {
    const c0 = input.charCodeAt(0) - 48;
    const c1 = input.charCodeAt(1) - 48;
    const c2 = input.charCodeAt(2) - 48;
    const c3 = input.charCodeAt(3) - 48;
    const s1 = input.charCodeAt(4);
    const c5 = input.charCodeAt(5) - 48;
    const c6 = input.charCodeAt(6) - 48;
    const s2 = input.charCodeAt(7);
    const c8 = input.charCodeAt(8) - 48;
    const c9 = input.charCodeAt(9) - 48;

    if (
      s1 === 45 &&
      s2 === 45 &&
      (c0 | c1 | c2 | c3 | c5 | c6 | c8 | c9) >= 0 &&
      c0 <= 9 &&
      c1 <= 9 &&
      c2 <= 9 &&
      c3 <= 9 &&
      c5 <= 9 &&
      c6 <= 9 &&
      c8 <= 9 &&
      c9 <= 9
    ) {
      const year = c0 * 1000 + c1 * 100 + c2 * 10 + c3;
      const month = c5 * 10 + c6;
      const day = c8 * 10 + c9;

      if (year === 0) {
        throw new ChroneraParseError(
          "CHRONERA_INVALID_DATE",
          "Year zero is not accepted in this civil-date API.",
        );
      }

      return localDate(year, month, day);
    }
  }

  // Strict ISO YYYY-MM-DD parser
  const match = ISO_DATE_REGEX.exec(input);
  if (!match) {
    throw new ChroneraParseError(
      "CHRONERA_PARSE_FAILED",
      `Invalid ISO date format: "${input}". Expected format YYYY-MM-DD.`,
    );
  }

  const year = Number.parseInt(match[1]!, 10);
  const month = Number.parseInt(match[2]!, 10);
  const day = Number.parseInt(match[3]!, 10);

  if (year === 0) {
    throw new ChroneraParseError(
      "CHRONERA_INVALID_DATE",
      "Year zero is not accepted in this civil-date API.",
    );
  }

  // localDate validates month and day bounds according to Gregorian calendar
  return localDate(year, month, day);
}
