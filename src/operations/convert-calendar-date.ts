import { defaultCalendarRegistry } from "../calendar/registry.js";
import { ChroneraError } from "../errors/errors.js";

import type {
  CalendarConversionResult,
  CalendarDate,
  CalendarId,
  ConvertCalendarOptions,
} from "../public-types.js";
import type { CalendarRegistry } from "../calendar/registry.js";

export function convertCalendarDateWithRegistry(
  registry: CalendarRegistry,
  source: CalendarDate,
  targetCalendar: CalendarId,
  _options: Readonly<ConvertCalendarOptions> = {},
): CalendarConversionResult {
  const sourceAdapter = registry.getAdapter(source.calendar);
  const targetAdapter = registry.getAdapter(targetCalendar);

  const issues = sourceAdapter.validator.validate(source);
  if (issues.length > 0) {
    const first = issues[0]!;
    throw new ChroneraError(first.code, first.message);
  }

  if (!sourceAdapter.converter) {
    throw new ChroneraError(
      "CHRONERA_UNSUPPORTED_OPERATION",
      `Source calendar "${source.calendar}" does not support conversion to absolute date.`,
    );
  }

  if (!targetAdapter.converter) {
    throw new ChroneraError(
      "CHRONERA_UNSUPPORTED_OPERATION",
      `Target calendar "${targetCalendar}" does not support conversion from absolute date.`,
    );
  }

  const absDay = sourceAdapter.converter.toAbsoluteDay(source);

  const { first, last } = targetAdapter.identity.validRange;
  if (absDay < first || absDay > last) {
    throw new ChroneraError(
      "CHRONERA_OUT_OF_RANGE",
      `Date in calendar "${source.calendar}" corresponds to absolute day ${absDay}, outside validated range [${first}, ${last}] of calendar "${targetCalendar}".`,
    );
  }

  const targetDate = targetAdapter.converter.fromAbsoluteDay(absDay);

  const targetIssues = targetAdapter.validator.validate(targetDate);
  if (targetIssues.length > 0) {
    const first = targetIssues[0]!;
    throw new ChroneraError(first.code, first.message);
  }

  const engine = targetAdapter.identity.algorithm.startsWith("chronera")
    ? ("chronera" as const)
    : ("custom" as const);

  return {
    value: targetDate,
    metadata: {
      requestedCalendar: targetCalendar,
      resolvedCalendar: targetCalendar,
      engine,
      algorithm: targetAdapter.identity.algorithm,
      deterministic: targetAdapter.identity.deterministic,
      ...(targetAdapter.identity.dataVersion !== undefined
        ? { dataVersion: targetAdapter.identity.dataVersion }
        : {}),
      ...(targetAdapter.identity.validFrom !== undefined
        ? { validFrom: targetAdapter.identity.validFrom }
        : {}),
      ...(targetAdapter.identity.validTo !== undefined
        ? { validTo: targetAdapter.identity.validTo }
        : {}),
    },
  };
}

export function convertCalendarDate(
  source: CalendarDate,
  targetCalendar: CalendarId,
  options?: Readonly<ConvertCalendarOptions>,
): CalendarConversionResult {
  return convertCalendarDateWithRegistry(
    defaultCalendarRegistry,
    source,
    targetCalendar,
    options,
  );
}
