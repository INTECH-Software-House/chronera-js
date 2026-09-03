import { ChroneraError } from "../errors/errors.js";
import { parseLocalDate } from "./parse-local-date.js";
import { parseInstant } from "./parse-instant.js";

import type {
  Instant,
  LocalDate,
  ParseInstantOptions,
  ParseLocalDateOptions,
  SafeParseResult,
} from "../public-types.js";

export function safeParseLocalDate(
  input: string,
  options?: Readonly<ParseLocalDateOptions>,
): SafeParseResult<LocalDate> {
  try {
    const value = parseLocalDate(input, options);
    return {
      success: true,
      value,
    };
  } catch (err: unknown) {
    if (err instanceof ChroneraError) {
      return {
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      };
    }
    throw err;
  }
}

export function safeParseInstant(
  input: string,
  options?: Readonly<ParseInstantOptions>,
): SafeParseResult<Instant> {
  try {
    const value = parseInstant(input, options);
    return {
      success: true,
      value,
    };
  } catch (err: unknown) {
    if (err instanceof ChroneraError) {
      return {
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      };
    }
    throw err;
  }
}
