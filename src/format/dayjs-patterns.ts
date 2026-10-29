/**
 * Translation between Day.js/Moment format tokens and LDML (Unicode) pattern tokens.
 */

const TOKEN_REGEX =
  /(\[[^\]]*\])|(YYYY|YY|MMMM|MMM|MM|M|dddd|ddd|dd|d|DD|D|HH|H|hh|h|mm|m|ss|s|SSS|SS|S|ZZ|Z|A|a)/g;

/**
 * Mapping table from Day.js/Moment token to Unicode/LDML token.
 */
const DAYJS_TO_LDML: Record<string, string> = {
  YYYY: "yyyy",
  YY: "yy",
  MMMM: "MMMM",
  MMM: "MMM",
  MM: "MM",
  M: "M",
  DD: "dd",
  D: "d",
  dddd: "EEEE",
  ddd: "EEE",
  dd: "EEEEEE",
  d: "e",
  HH: "HH",
  H: "H",
  hh: "hh",
  h: "h",
  mm: "mm",
  m: "m",
  ss: "ss",
  s: "s",
  SSS: "SSS",
  SS: "SS",
  S: "S",
  A: "a",
  a: "a",
  Z: "xxx",
  ZZ: "xx",
};

/**
 * Translates a Day.js/Moment format string into an LDML/Unicode pattern string.
 * Escaped brackets like `[at]` are transformed into single quotes `'at'`.
 *
 * @example
 * ```ts
 * convertDayjsPattern("YYYY-MM-DD HH:mm:ss"); // "yyyy-MM-dd HH:mm:ss"
 * convertDayjsPattern("DD/MM/YYYY [at] HH:mm"); // "dd/MM/yyyy 'at' HH:mm"
 * ```
 */
export function convertDayjsPattern(pattern: string): string {
  if (!pattern) return pattern;

  return pattern.replace(TOKEN_REGEX, (match, escaped) => {
    if (escaped) {
      // Remove enclosing brackets and escape with single quotes for LDML
      const content = escaped.slice(1, -1);
      return `'${content.replace(/'/g, "''")}'`;
    }
    return DAYJS_TO_LDML[match] ?? match;
  });
}

/**
 * Returns true if the string appears to use Day.js/Moment token conventions
 * (such as uppercase YYYY, DD, or bracketed text).
 */
export function isDayjsPattern(pattern: string): boolean {
  return /YYYY|YY|DD|\b[dD]\b|\[.*?\]|dddd|ddd/.test(pattern);
}
