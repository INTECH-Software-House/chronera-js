import type { DayOfYearFields } from "./core/day-of-year.js";
import type {
  FiscalFields,
  FiscalOptions,
  QuarterNumber,
} from "./core/fiscal.js";
import type { ChroneraErrorCode } from "./errors/error-codes.js";
import type { PresetName } from "./format/presets/types.js";
import type { Rfc2822Options } from "./format/rfc2822.js";

export type {
  ChroneraErrorCode,
  DayOfYearFields,
  FiscalFields,
  FiscalOptions,
  PresetName,
  QuarterNumber,
  Rfc2822Options,
};

export type BuiltInCalendarId =
  | "iso8601"
  | "gregory"
  | "buddhist"
  | "islamic"
  | "islamic-civil"
  | "islamic-tbla"
  | "islamic-umalqura"
  | "persian"
  | "hebrew"
  | "japanese"
  | "roc"
  | "indian"
  | "coptic"
  | "ethiopic"
  | "chinese"
  | "dangi";

type ExtensibleIdentifier = string & Record<never, never>;

export type CalendarId = BuiltInCalendarId | ExtensibleIdentifier;

export type LocaleId = string;
export type TimeZoneId = string;
export type NumberingSystemId = string;
export type EraId = string;
export type MonthCode = `M${string}`;

export interface Instant {
  readonly kind: "instant";
  readonly epochMilliseconds: number;
}

export interface LocalDate {
  readonly kind: "local-date";
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export interface LocalTime {
  readonly kind: "local-time";
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;
}

export interface LocalDateTime {
  readonly kind: "local-date-time";
  readonly date: LocalDate;
  readonly time: LocalTime;
}

export interface CalendarDate {
  readonly kind: "calendar-date";
  readonly calendar: CalendarId;
  readonly era?: EraId;
  readonly eraYear?: number;
  readonly year: number;
  readonly monthCode: MonthCode;
  readonly month?: number;
  readonly day: number;
}

export interface ZonedDateTime {
  readonly kind: "zoned-date-time";
  readonly instant: Instant;
  readonly timeZone: TimeZoneId;
  readonly calendar: CalendarId;
}

export type FormatDateInput = LocalDate | CalendarDate | Instant | Date;

export interface Duration {
  readonly years?: number;
  readonly months?: number;
  readonly weeks?: number;
  readonly days?: number;
  readonly hours?: number;
  readonly minutes?: number;
  readonly seconds?: number;
  readonly milliseconds?: number;
}

export interface DateRange<TDate> {
  readonly start: TDate;
  readonly end: TDate;
  readonly startInclusive: boolean;
  readonly endInclusive: boolean;
}

export interface CalendarConversionMetadata {
  readonly requestedCalendar: CalendarId;
  readonly resolvedCalendar: CalendarId;
  readonly engine: "chronera" | "runtime-intl" | "custom";
  readonly algorithm: string;
  readonly deterministic: boolean;
  readonly dataVersion?: string;
  readonly validFrom?: LocalDate;
  readonly validTo?: LocalDate;
}

export interface CalendarConversionResult {
  readonly value: CalendarDate;
  readonly metadata: CalendarConversionMetadata;
}

export interface ChroneraIssue {
  readonly code: ChroneraErrorCode;
  readonly message: string;
  readonly path?: readonly (string | number)[];
}

export type SafeParseResult<T> =
  | {
      readonly success: true;
      readonly value: T;
    }
  | {
      readonly success: false;
      readonly error: ChroneraIssue;
    };

export type Comparison = -1 | 0 | 1;

export interface CalendarPlugin {
  readonly id: CalendarId;
  readonly algorithm: string;
  readonly deterministic: boolean;
  readonly validFrom: LocalDate;
  readonly validTo: LocalDate;
  toIsoDate(date: CalendarDate): LocalDate;
  fromIsoDate(date: LocalDate): CalendarDate;
  validate(date: CalendarDate): readonly ChroneraIssue[];
}

export interface ChroneraConfig {
  readonly locale?: LocaleId;
  readonly calendar?: CalendarId;
  readonly numberingSystem?: NumberingSystemId;
  readonly timeZone?: TimeZoneId;
  readonly calendars?: readonly CalendarPlugin[];
  readonly formatterCacheSize?: number;
}

export interface ResolvedChroneraOptions {
  readonly locale: LocaleId;
  readonly calendar: CalendarId;
  readonly numberingSystem?: NumberingSystemId;
  readonly timeZone: TimeZoneId;
  readonly formatterCacheSize: number;
}

export interface FormatDateBaseOptions {
  readonly locale?: LocaleId;
  readonly calendar?: CalendarId;
  readonly numberingSystem?: NumberingSystemId;
  readonly timeZone?: TimeZoneId;
  readonly fallback?: "error";
}

export type FormatDateOptions = FormatDateBaseOptions &
  (
    | {
        readonly style?: "numeric" | "short" | "medium" | "long" | "full";
        readonly preset?: never;
      }
    | {
        readonly style?: never;
        readonly preset: PresetName;
      }
  );

export interface FormatTimeOptions {
  readonly locale?: LocaleId;
  readonly numberingSystem?: NumberingSystemId;
  readonly timeZone?: TimeZoneId;
  readonly style?: "short" | "medium" | "long" | "full";
  readonly hourCycle?: "h11" | "h12" | "h23" | "h24";
}

export interface FormatDateTimeOptions extends FormatDateBaseOptions {
  readonly dateStyle?: "short" | "medium" | "long" | "full";
  readonly timeStyle?: "short" | "medium" | "long" | "full";
  readonly hourCycle?: "h11" | "h12" | "h23" | "h24";
}

export type FormatDateRangeOptions = FormatDateOptions & {
  readonly collapse?: "auto" | "none";
};

export interface FormatRelativeOptions {
  readonly relativeTo: Instant | LocalDate;
  readonly locale?: LocaleId;
  readonly numeric?: "always" | "auto";
  readonly unit?:
    "second" | "minute" | "hour" | "day" | "week" | "month" | "year";
  readonly timeZone?: TimeZoneId;
}

export interface PatternFormatOptions {
  readonly locale?: LocaleId;
  readonly calendar?: CalendarId;
  readonly numberingSystem?: NumberingSystemId;
  readonly timeZone?: TimeZoneId;
}

export interface ParseLocalDateOptions {
  readonly pattern?: string;
  readonly locale?: LocaleId;
  readonly calendar?: "gregory" | "iso8601";
  readonly numberingSystem?: NumberingSystemId;
}

export interface ParseInstantOptions {
  readonly excessFractionalSeconds?: "reject" | "truncate" | "round";
}

export interface ConvertCalendarOptions {
  readonly fallback?: "error";
}

export interface CalendarCapabilities {
  readonly calendar: CalendarId;
  readonly maturity:
    "stable" | "experimental" | "runtime-dependent" | "planned" | "unsupported";
  readonly canFormat: boolean;
  readonly canParse: boolean;
  readonly canConvertFromAbsoluteDate: boolean;
  readonly canConvertToAbsoluteDate: boolean;
  readonly canValidate: boolean;
  readonly canAddYears: boolean;
  readonly canAddMonths: boolean;
  readonly deterministic: boolean;
  readonly algorithm?: string;
  readonly dataVersion?: string;
  readonly validFrom?: LocalDate;
  readonly validTo?: LocalDate;
}

export interface RuntimeCapabilities {
  readonly hasDateTimeFormat: boolean;
  readonly hasFormatToParts: boolean;
  readonly hasFormatRange: boolean;
  readonly hasRelativeTimeFormat: boolean;
  readonly hasLocale: boolean;
  readonly hasSupportedValuesOf: boolean;
  readonly hasTemporal: boolean;
  readonly calendars: Readonly<Record<string, boolean>>;
  readonly timeZones: Readonly<Record<string, boolean>>;
}

export interface ChroneraInstance {
  formatDate(
    input: FormatDateInput,
    options?: Readonly<FormatDateOptions>,
  ): string;
  parseLocalDate(
    input: string,
    options?: Readonly<ParseLocalDateOptions>,
  ): LocalDate;
  convertCalendarDate(
    source: CalendarDate,
    targetCalendar: CalendarId,
    options?: Readonly<ConvertCalendarOptions>,
  ): CalendarConversionResult;
  resolvedOptions(): ResolvedChroneraOptions;
}

export type { IsoWeekFields } from "./core/iso-week.js";
