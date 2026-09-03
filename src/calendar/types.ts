import type {
  CalendarDate,
  CalendarId,
  ChroneraIssue,
  Duration,
  LocalDate,
  MonthCode,
} from "../public-types.js";

export interface CalendarIdentity {
  readonly id: CalendarId;
  readonly algorithm: string;
  readonly deterministic: boolean;
  readonly dataVersion?: string;
  readonly validRange: {
    readonly first: number;
    readonly last: number;
  };
  readonly validFrom?: LocalDate;
  readonly validTo?: LocalDate;
}

export interface CalendarConverter {
  readonly identity: CalendarIdentity;
  toAbsoluteDay(date: CalendarDate): number;
  fromAbsoluteDay(day: number): CalendarDate;
}

export interface CalendarValidator {
  readonly identity: CalendarIdentity;
  validate(date: CalendarDate): readonly ChroneraIssue[];
  daysInMonth(year: number, monthCode: MonthCode): number;
  isLeapYear(year: number): boolean;
}

export interface CalendarArithmetic {
  readonly identity: CalendarIdentity;
  add(
    date: CalendarDate,
    duration: Duration,
    overflow: "constrain" | "reject",
  ): CalendarDate;
}

export interface CalendarAdapter {
  readonly identity: CalendarIdentity;
  readonly converter?: CalendarConverter;
  readonly validator: CalendarValidator;
  readonly arithmetic?: CalendarArithmetic;
}
