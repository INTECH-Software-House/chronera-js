import { ChroneraError } from "../errors/errors.js";
import { validateAndResolveLocale } from "../locale/resolve-locale.js";
import { absoluteDayFromGregorianFields } from "../core/absolute-day.js";

import type {
  FormatRelativeOptions,
  Instant,
  LocalDate,
} from "../public-types.js";

export function formatRelative(
  target: Instant | LocalDate,
  options: Readonly<FormatRelativeOptions>,
): string {
  if (!options || !options.relativeTo) {
    throw new ChroneraError(
      "CHRONERA_INCOMPATIBLE_OPTION",
      "formatRelative requires an explicit 'relativeTo' reference.",
    );
  }

  const { relativeTo } = options;
  const localeInfo = validateAndResolveLocale(options.locale);
  const locale = localeInfo.baseLocale;
  const numeric = options.numeric ?? "auto";

  let diffMs: number;
  let diffDays: number;

  if (target.kind === "local-date") {
    if (relativeTo.kind !== "local-date") {
      throw new ChroneraError(
        "CHRONERA_INVALID_DATE",
        "Target and relativeTo must both be LocalDate or both be Instant.",
      );
    }
    const targetAbs = absoluteDayFromGregorianFields(
      target.year,
      target.month,
      target.day,
    );
    const relAbs = absoluteDayFromGregorianFields(
      relativeTo.year,
      relativeTo.month,
      relativeTo.day,
    );
    diffDays = targetAbs - relAbs;
    diffMs = diffDays * 86400000;
  } else if (target.kind === "instant") {
    if (relativeTo.kind !== "instant") {
      throw new ChroneraError(
        "CHRONERA_INVALID_DATE",
        "Target and relativeTo must both be LocalDate or both be Instant.",
      );
    }
    diffMs = target.epochMilliseconds - relativeTo.epochMilliseconds;
    diffDays = Math.trunc(diffMs / 86400000);
  } else {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      "Expected Instant or LocalDate.",
    );
  }

  let selectedUnit: Intl.RelativeTimeFormatUnit;
  let value: number;

  if (options.unit !== undefined) {
    selectedUnit = options.unit;
    switch (selectedUnit) {
      case "second":
        value = Math.trunc(diffMs / 1000);
        break;
      case "minute":
        value = Math.trunc(diffMs / 60000);
        break;
      case "hour":
        value = Math.trunc(diffMs / 3600000);
        break;
      case "day":
        value = diffDays;
        break;
      case "week":
        value = Math.trunc(diffDays / 7);
        break;
      case "month":
        value = Math.trunc(diffDays / 30);
        break;
      case "year":
        value = Math.trunc(diffDays / 365);
        break;
      default:
        throw new ChroneraError(
          "CHRONERA_INCOMPATIBLE_OPTION",
          `Unsupported unit: "${String(selectedUnit)}".`,
        );
    }
  } else {
    const absMs = Math.abs(diffMs);
    const absDays = Math.abs(diffDays);

    if (absMs < 60000) {
      selectedUnit = "second";
      value = Math.trunc(diffMs / 1000);
    } else if (absMs < 3600000) {
      selectedUnit = "minute";
      value = Math.trunc(diffMs / 60000);
    } else if (absMs < 86400000) {
      selectedUnit = "hour";
      value = Math.trunc(diffMs / 3600000);
    } else if (absDays < 7) {
      selectedUnit = "day";
      value = diffDays;
    } else if (absDays < 28) {
      selectedUnit = "week";
      value = Math.trunc(diffDays / 7);
    } else {
      throw new ChroneraError(
        "CHRONERA_INCOMPATIBLE_OPTION",
        "Difference exceeds 28 calendar days; caller must provide explicit 'month' or 'year' unit in v1.",
      );
    }
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric });
  return rtf.format(value, selectedUnit);
}
