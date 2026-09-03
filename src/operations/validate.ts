import { defaultCalendarRegistry } from "../calendar/registry.js";
import { ChroneraError } from "../errors/errors.js";

import type {
  CalendarCapabilities,
  CalendarDate,
  CalendarId,
  MonthCode,
} from "../public-types.js";
import type { CalendarRegistry } from "../calendar/registry.js";

export function isValidCalendarDateWithRegistry(
  registry: CalendarRegistry,
  value: CalendarDate,
): boolean {
  const adapter = registry.getAdapter(value.calendar);
  const issues = adapter.validator.validate(value);
  return issues.length === 0;
}

export function isValidCalendarDate(value: CalendarDate): boolean {
  return isValidCalendarDateWithRegistry(defaultCalendarRegistry, value);
}

export function daysInMonthWithRegistry(
  registry: CalendarRegistry,
  year: number,
  monthCode: MonthCode,
  calendar: CalendarId,
): number {
  const adapter = registry.getAdapter(calendar);
  return adapter.validator.daysInMonth(year, monthCode);
}

export function daysInMonth(
  year: number,
  monthCode: MonthCode,
  calendar: CalendarId,
): number {
  return daysInMonthWithRegistry(
    defaultCalendarRegistry,
    year,
    monthCode,
    calendar,
  );
}

export function isLeapYearWithRegistry(
  registry: CalendarRegistry,
  year: number,
  calendar: CalendarId,
): boolean {
  const adapter = registry.getAdapter(calendar);
  return adapter.validator.isLeapYear(year);
}

export function isLeapYear(year: number, calendar: CalendarId): boolean {
  return isLeapYearWithRegistry(defaultCalendarRegistry, year, calendar);
}

export function getCalendarCapabilitiesWithRegistry(
  registry: CalendarRegistry,
  calendar: CalendarId,
): CalendarCapabilities {
  if (!registry.hasAdapter(calendar)) {
    throw new ChroneraError(
      "CHRONERA_UNSUPPORTED_CALENDAR",
      `Calendar "${calendar}" is not configured.`,
    );
  }

  const adapter = registry.getAdapter(calendar);
  const identity = adapter.identity;

  return {
    calendar,
    maturity: identity.deterministic ? "stable" : "runtime-dependent",
    canFormat: true,
    canParse: true,
    canConvertFromAbsoluteDate: adapter.converter !== undefined,
    canConvertToAbsoluteDate: adapter.converter !== undefined,
    canValidate: true,
    canAddYears: adapter.arithmetic !== undefined,
    canAddMonths: adapter.arithmetic !== undefined,
    deterministic: identity.deterministic,
    algorithm: identity.algorithm,
    ...(identity.dataVersion !== undefined
      ? { dataVersion: identity.dataVersion }
      : {}),
    ...(identity.validFrom !== undefined
      ? { validFrom: identity.validFrom }
      : {}),
    ...(identity.validTo !== undefined ? { validTo: identity.validTo } : {}),
  };
}

export function getCalendarCapabilities(
  calendar: CalendarId,
): CalendarCapabilities {
  return getCalendarCapabilitiesWithRegistry(defaultCalendarRegistry, calendar);
}
