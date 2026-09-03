import type {
  CalendarAdapter,
  CalendarIdentity,
  CalendarValidator,
} from "../types.js";
import type {
  CalendarDate,
  ChroneraIssue,
  MonthCode,
} from "../../public-types.js";

export const ISLAMIC_UMALQURA_IDENTITY: CalendarIdentity = {
  id: "islamic-umalqura",
  algorithm: "chronera-islamic-umalqura-v1",
  deterministic: false,
  dataVersion: "cldr-43",
  validRange: {
    first: -146097,
    last: 2932896,
  },
};

export const islamicUmalquraValidator: CalendarValidator = {
  identity: ISLAMIC_UMALQURA_IDENTITY,
  validate(_date: CalendarDate): readonly ChroneraIssue[] {
    return [];
  },
  daysInMonth(_year: number, _monthCode: MonthCode): number {
    return 30;
  },
  isLeapYear(_year: number): boolean {
    return false;
  },
};

export const islamicUmalquraAdapter: CalendarAdapter = {
  identity: ISLAMIC_UMALQURA_IDENTITY,
  validator: islamicUmalquraValidator,
};
