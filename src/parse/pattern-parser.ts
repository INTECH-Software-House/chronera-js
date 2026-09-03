import { scanPattern } from "../format/pattern-scanner.js";
import { ChroneraParseError } from "../errors/errors.js";
import { localDate } from "../core/local-date.js";
import { parseDigitsToLatin } from "../locale/numbering-system.js";

import type { LocalDate } from "../public-types.js";

export function parseDateWithPattern(
  input: string,
  pattern: string,
  locale: string = "en-US",
): LocalDate {
  const tokens = scanPattern(pattern);
  const normalizedInput = parseDigitsToLatin(input);

  let pos = 0;
  let year: number | undefined;
  let month: number | undefined;
  let day: number | undefined;

  // Build month name tables for locale
  const shortMonths: string[] = [];
  const longMonths: string[] = [];
  for (let m = 1; m <= 12; m++) {
    const d = new Date(Date.UTC(2026, m - 1, 1));
    shortMonths[m] = new Intl.DateTimeFormat(locale, {
      month: "short",
      timeZone: "UTC",
    })
      .format(d)
      .toLowerCase();
    longMonths[m] = new Intl.DateTimeFormat(locale, {
      month: "long",
      timeZone: "UTC",
    })
      .format(d)
      .toLowerCase();
  }

  for (const token of tokens) {
    if (token.type === "literal") {
      const lit = token.value;
      if (normalizedInput.slice(pos, pos + lit.length) !== lit) {
        throw new ChroneraParseError(
          "CHRONERA_PARSE_FAILED",
          `Expected literal "${lit}" at position ${pos} in input "${input}".`,
        );
      }
      pos += lit.length;
      continue;
    }

    const sym = token.symbol;
    if (sym === "yyyy") {
      const chunk = normalizedInput.slice(pos, pos + 4);
      if (!/^\d{4}$/.test(chunk)) {
        throw new ChroneraParseError(
          "CHRONERA_PARSE_FAILED",
          `Expected 4-digit year at position ${pos}.`,
        );
      }
      year = Number.parseInt(chunk, 10);
      pos += 4;
    } else if (sym === "y") {
      let run = "";
      while (pos < normalizedInput.length && /\d/.test(normalizedInput[pos]!)) {
        run += normalizedInput[pos];
        pos++;
      }
      if (run.length === 0 || run.length > 6) {
        throw new ChroneraParseError(
          "CHRONERA_PARSE_FAILED",
          `Expected 1 to 6 digit year at position ${pos}.`,
        );
      }
      year = Number.parseInt(run, 10);
    } else if (sym === "MM") {
      const chunk = normalizedInput.slice(pos, pos + 2);
      if (!/^\d{2}$/.test(chunk)) {
        throw new ChroneraParseError(
          "CHRONERA_PARSE_FAILED",
          `Expected 2-digit month at position ${pos}.`,
        );
      }
      month = Number.parseInt(chunk, 10);
      pos += 2;
    } else if (sym === "M") {
      let run = "";
      while (
        pos < normalizedInput.length &&
        /\d/.test(normalizedInput[pos]!) &&
        run.length < 2
      ) {
        run += normalizedInput[pos];
        pos++;
      }
      if (run.length === 0) {
        throw new ChroneraParseError(
          "CHRONERA_PARSE_FAILED",
          `Expected numeric month at position ${pos}.`,
        );
      }
      month = Number.parseInt(run, 10);
    } else if (sym === "MMM") {
      let matched = false;
      for (let m = 1; m <= 12; m++) {
        const name = shortMonths[m]!;
        if (
          normalizedInput.slice(pos, pos + name.length).toLowerCase() === name
        ) {
          month = m;
          pos += name.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        throw new ChroneraParseError(
          "CHRONERA_PARSE_FAILED",
          `Expected abbreviated month name at position ${pos}.`,
        );
      }
    } else if (sym === "MMMM") {
      let matched = false;
      for (let m = 1; m <= 12; m++) {
        const name = longMonths[m]!;
        if (
          normalizedInput.slice(pos, pos + name.length).toLowerCase() === name
        ) {
          month = m;
          pos += name.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        throw new ChroneraParseError(
          "CHRONERA_PARSE_FAILED",
          `Expected full month name at position ${pos}.`,
        );
      }
    } else if (sym === "dd") {
      const chunk = normalizedInput.slice(pos, pos + 2);
      if (!/^\d{2}$/.test(chunk)) {
        throw new ChroneraParseError(
          "CHRONERA_PARSE_FAILED",
          `Expected 2-digit day at position ${pos}.`,
        );
      }
      day = Number.parseInt(chunk, 10);
      pos += 2;
    } else if (sym === "d") {
      let run = "";
      while (
        pos < normalizedInput.length &&
        /\d/.test(normalizedInput[pos]!) &&
        run.length < 2
      ) {
        run += normalizedInput[pos];
        pos++;
      }
      if (run.length === 0) {
        throw new ChroneraParseError(
          "CHRONERA_PARSE_FAILED",
          `Expected numeric day at position ${pos}.`,
        );
      }
      day = Number.parseInt(run, 10);
    } else if (sym === "G") {
      // Consume era letters
      while (
        pos < normalizedInput.length &&
        /[A-Za-z]/.test(normalizedInput[pos]!)
      ) {
        pos++;
      }
    } else {
      throw new ChroneraParseError(
        "CHRONERA_PARSE_FAILED",
        `Unsupported parse pattern token: "${sym}".`,
      );
    }
  }

  if (pos !== normalizedInput.length) {
    throw new ChroneraParseError(
      "CHRONERA_PARSE_FAILED",
      `Unexpected trailing data at position ${pos} in "${input}".`,
    );
  }

  if (year === undefined || month === undefined || day === undefined) {
    throw new ChroneraParseError(
      "CHRONERA_PARSE_FAILED",
      "Pattern parsing did not extract all required fields (year, month, day).",
    );
  }

  return localDate(year, month, day);
}
