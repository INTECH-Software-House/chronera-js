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
