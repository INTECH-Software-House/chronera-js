import { ChroneraError } from "../errors/errors.js";

export type PatternToken =
  { type: "token"; symbol: string } | { type: "literal"; value: string };

const VALID_PATTERN_TOKENS = new Set([
  "y",
  "yy",
  "yyyy",
  "M",
  "MM",
  "MMM",
  "MMMM",
  "d",
  "dd",
  "E",
  "EEEE",
  "G",
  "GGGG",
  "H",
  "HH",
  "h",
  "hh",
  "a",
  "m",
  "mm",
  "s",
  "ss",
  "S",
  "SSS",
  "XXX",
  "Q",
  "QQQ",
  "QQQQ",
  "D",
  "DDD",
  "w",
  "ww",
  "e",
  "ee",
]);

export function scanPattern(pattern: string): PatternToken[] {
  if (typeof pattern !== "string") {
    throw new ChroneraError(
      "CHRONERA_PATTERN_TOO_COMPLEX",
      "Pattern must be a string.",
    );
  }

  if (pattern.length > 256) {
    throw new ChroneraError(
      "CHRONERA_PATTERN_TOO_LONG",
      `Pattern length ${pattern.length} exceeds maximum limit of 256 code units.`,
    );
  }

  const tokens: PatternToken[] = [];
  let i = 0;

  while (i < pattern.length) {
    if (tokens.length >= 64) {
      throw new ChroneraError(
        "CHRONERA_PATTERN_TOO_COMPLEX",
        "Pattern token count exceeds maximum limit of 64 tokens.",
      );
    }

    const ch = pattern[i]!;

    // Literal escaped in single quotes
    if (ch === "'") {
      i++;
      let literal = "";
      while (i < pattern.length) {
        if (pattern[i] === "'") {
          if (i + 1 < pattern.length && pattern[i + 1] === "'") {
            literal += "'";
            i += 2;
          } else {
            i++;
            break;
          }
        } else {
          literal += pattern[i];
          i++;
        }
      }
      tokens.push({ type: "literal", value: literal });
    }
    // Letters are tokens
    else if (/[A-Za-z]/.test(ch)) {
      let run = ch;
      i++;
      while (i < pattern.length && pattern[i] === ch) {
        run += pattern[i];
        i++;
      }
      if (!VALID_PATTERN_TOKENS.has(run)) {
        throw new ChroneraError(
          "CHRONERA_PATTERN_TOO_COMPLEX",
          `Unsupported or unknown pattern token: "${run}".`,
        );
      }
      tokens.push({ type: "token", symbol: run });
    }
    // Non-letter characters outside quotes are treated as raw literals
    else {
      let literal = ch;
      i++;
      while (
        i < pattern.length &&
        pattern[i] !== "'" &&
        !/[A-Za-z]/.test(pattern[i]!)
      ) {
        literal += pattern[i];
        i++;
      }
      tokens.push({ type: "literal", value: literal });
    }
  }

  return tokens;
}
