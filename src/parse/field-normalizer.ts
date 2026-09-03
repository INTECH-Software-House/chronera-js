import { parseDigitsToLatin } from "../locale/numbering-system.js";

export function normalizeInputDigits(input: string): string {
  return parseDigitsToLatin(input);
}
