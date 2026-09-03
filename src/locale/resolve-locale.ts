import { ChroneraError } from "../errors/errors.js";

import type {
  CalendarId,
  LocaleId,
  NumberingSystemId,
} from "../public-types.js";

const BCP47_LANGUAGE_TAG_REGEX =
  /^[a-z]{2,3}(-[a-z]{4})?(-([a-z]{2}|\d{3}))?(-([a-z\d]{5,8}|\d[a-z\d]{3}))*(-[a-wy-z\d](-[a-z\d]{2,8})+)*(-x(-[a-z\d]{1,8})+)?$/i;

export interface ResolvedLocaleInfo {
  baseLocale: LocaleId;
  unicodeCalendar?: CalendarId;
  unicodeNumberingSystem?: NumberingSystemId;
}

export function validateAndResolveLocale(
  localeInput?: unknown,
): ResolvedLocaleInfo {
  if (localeInput === undefined) {
    return { baseLocale: "en-US" };
  }

  if (typeof localeInput !== "string") {
    throw new ChroneraError(
      "CHRONERA_INVALID_LOCALE",
      `Expected locale string; received ${typeof localeInput}.`,
    );
  }

  const trimmed = localeInput.trim();
  if (trimmed.length === 0) {
    throw new ChroneraError(
      "CHRONERA_INVALID_LOCALE",
      "Locale identifier cannot be empty.",
    );
  }

  // If candidate count (comma-separated or list) exceeds 16
  const parts = trimmed.split(",");
  if (parts.length > 16) {
    throw new ChroneraError(
      "CHRONERA_INPUT_TOO_LARGE",
      `Locale candidates exceed maximum limit of 16; received ${parts.length}.`,
    );
  }

  const primary = parts[0]?.trim() ?? "en-US";

  // Validate BCP 47 tag
  let unicodeCalendar: CalendarId | undefined;
  let unicodeNumberingSystem: NumberingSystemId | undefined;

  try {
    if (typeof Intl !== "undefined" && typeof Intl.Locale === "function") {
      const loc = new Intl.Locale(primary);
      if (loc.calendar) {
        unicodeCalendar = loc.calendar as CalendarId;
      }
      if (loc.numberingSystem) {
        unicodeNumberingSystem = loc.numberingSystem;
      }
      return {
        baseLocale: loc.baseName,
        ...(unicodeCalendar !== undefined ? { unicodeCalendar } : {}),
        ...(unicodeNumberingSystem !== undefined
          ? { unicodeNumberingSystem }
          : {}),
      };
    }
  } catch (err) {
    throw new ChroneraError(
      "CHRONERA_INVALID_LOCALE",
      `Structurally invalid BCP 47 locale identifier: "${primary}".`,
      { cause: err },
    );
  }

  if (!BCP47_LANGUAGE_TAG_REGEX.test(primary)) {
    throw new ChroneraError(
      "CHRONERA_INVALID_LOCALE",
      `Structurally invalid BCP 47 locale identifier: "${primary}".`,
    );
  }

  return {
    baseLocale: primary,
  };
}
