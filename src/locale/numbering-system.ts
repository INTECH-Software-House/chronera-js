import { ChroneraError } from "../errors/errors.js";

import type { NumberingSystemId } from "../public-types.js";

const LATN_DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const THAI_DIGITS = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"] as const;
const ARAB_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"] as const;
const ARABEXT_DIGITS = [
  "۰",
  "۱",
  "۲",
  "۳",
  "۴",
  "۵",
  "۶",
  "۷",
  "۸",
  "۹",
] as const;
const FULLWIDE_DIGITS = [
  "０",
  "１",
  "２",
  "３",
  "４",
  "５",
  "６",
  "７",
  "８",
  "９",
] as const;
const HANIDEC_DIGITS = [
  "〇",
  "一",
  "二",
  "三",
  "四",
  "五",
  "六",
  "七",
  "八",
  "九",
] as const;
const DEVA_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"] as const;
const BENG_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"] as const;

const DIGIT_MAPS: Record<string, readonly string[]> = {
  latn: LATN_DIGITS,
  thai: THAI_DIGITS,
  arab: ARAB_DIGITS,
  arabext: ARABEXT_DIGITS,
  fullwide: FULLWIDE_DIGITS,
  hanidec: HANIDEC_DIGITS,
  deva: DEVA_DIGITS,
  beng: BENG_DIGITS,
};

const HANIDEC_TO_LATIN: Record<string, string> = {
  〇: "0",
  一: "1",
  二: "2",
  三: "3",
  四: "4",
  五: "5",
  六: "6",
  七: "7",
  八: "8",
  九: "9",
};

export function isValidNumberingSystem(id: string): boolean {
  return id in DIGIT_MAPS;
}

export function formatNumberWithSystem(
  value: number | string,
  numberingSystem: NumberingSystemId = "latn",
): string {
  const digits = DIGIT_MAPS[numberingSystem];
  if (!digits) {
    throw new ChroneraError(
      "CHRONERA_INCOMPATIBLE_OPTION",
      `Unsupported numbering system: "${numberingSystem}". Supported: latn, thai, arab, arabext, fullwide, hanidec, deva, beng.`,
    );
  }

  const str = String(value);
  if (numberingSystem === "latn") {
    return str;
  }

  let result = "";
  for (let i = 0; i < str.length; i++) {
    const ch = str.charAt(i);
    const code = ch.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      result += digits[code - 48];
    } else {
      result += ch;
    }
  }
  return result;
}

export function parseDigitsToLatin(input: string): string {
  let result = "";
  for (let i = 0; i < input.length; i++) {
    const ch = input.charAt(i);
    const code = ch.charCodeAt(0);

    // ASCII 0-9
    if (code >= 48 && code <= 57) {
      result += ch;
    }
    // Thai 0-9: \u0E50 - \u0E59
    else if (code >= 0x0e50 && code <= 0x0e59) {
      result += String(code - 0x0e50);
    }
    // Arabic-Indic 0-9: \u0660 - \u0669
    else if (code >= 0x0660 && code <= 0x0669) {
      result += String(code - 0x0660);
    }
    // Eastern Arabic-Indic 0-9: \u06F0 - \u06F9
    else if (code >= 0x06f0 && code <= 0x06f9) {
      result += String(code - 0x06f0);
    }
    // Fullwidth 0-9: \uFF10 - \uFF19
    else if (code >= 0xff10 && code <= 0xff19) {
      result += String(code - 0xff10);
    }
    // Devanagari 0-9: \u0966 - \u096F
    else if (code >= 0x0966 && code <= 0x096f) {
      result += String(code - 0x0966);
    }
    // Bengali 0-9: \u09E6 - \u09EF
    else if (code >= 0x09e6 && code <= 0x09ef) {
      result += String(code - 0x09e6);
    }
    // Hanidec (Kanji/Han positional digits)
    else if (ch in HANIDEC_TO_LATIN) {
      result += HANIDEC_TO_LATIN[ch];
    } else {
      result += ch;
    }
  }
  return result;
}
