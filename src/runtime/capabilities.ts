import type {
  CalendarId,
  RuntimeCapabilities,
  TimeZoneId,
} from "../public-types.js";

export function getRuntimeCapabilities(
  requests?: Readonly<{
    calendars?: readonly CalendarId[];
    timeZones?: readonly TimeZoneId[];
  }>,
): RuntimeCapabilities {
  const hasIntl = typeof Intl !== "undefined";
  const hasDateTimeFormat =
    hasIntl && typeof Intl.DateTimeFormat === "function";
  const hasFormatToParts =
    hasDateTimeFormat &&
    typeof Intl.DateTimeFormat.prototype.formatToParts === "function";
  const hasFormatRange =
    hasDateTimeFormat &&
    typeof (Intl.DateTimeFormat.prototype as { formatRange?: unknown })
      .formatRange === "function";
  const hasRelativeTimeFormat =
    hasIntl && typeof Intl.RelativeTimeFormat === "function";
  const hasLocale = hasIntl && typeof Intl.Locale === "function";
  const hasSupportedValuesOf =
    hasIntl &&
    typeof (Intl as unknown as { supportedValuesOf?: unknown })
      .supportedValuesOf === "function";
  const hasTemporal =
    typeof (globalThis as unknown as { Temporal?: unknown }).Temporal !==
    "undefined";

  const calendars: Record<string, boolean> = {};
  if (requests?.calendars) {
    for (const cal of requests.calendars) {
      if (!hasDateTimeFormat) {
        calendars[cal] = false;
        continue;
      }
      try {
        const dtf = new Intl.DateTimeFormat("en-US", { calendar: cal });
        const resolved = dtf.resolvedOptions().calendar;
        calendars[cal] = resolved === cal;
      } catch {
        calendars[cal] = false;
      }
    }
  }

  const timeZones: Record<string, boolean> = {};
  if (requests?.timeZones) {
    for (const tz of requests.timeZones) {
      if (!hasDateTimeFormat) {
        timeZones[tz] = false;
        continue;
      }
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz });
        timeZones[tz] = true;
      } catch {
        timeZones[tz] = false;
      }
    }
  }

  return {
    hasDateTimeFormat,
    hasFormatToParts,
    hasFormatRange,
    hasRelativeTimeFormat,
    hasLocale,
    hasSupportedValuesOf,
    hasTemporal,
    calendars: Object.freeze(calendars),
    timeZones: Object.freeze(timeZones),
  };
}
