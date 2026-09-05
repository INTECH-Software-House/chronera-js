import type { LocalDate } from "../public-types.js";

/**
 * Supported 15 country codes (ISO 3166-1 alpha-2).
 */
export type CountryCode =
  | "TH" // Thailand 🇹🇭
  | "JP" // Japan 🇯🇵
  | "SA" // Saudi Arabia 🇸🇦
  | "AE" // United Arab Emirates 🇦🇪
  | "IR" // Iran 🇮🇷
  | "TW" // Taiwan 🇹🇼
  | "IN" // India 🇮🇳
  | "SG" // Singapore 🇸🇬
  | "US" // United States 🇺🇸
  | "GB" // United Kingdom 🇬🇧
  | "DE" // Germany 🇩🇪
  | "FR" // France 🇫🇷
  | "AU" // Australia 🇦🇺
  | "CN" // China 🇨🇳
  | "HK"; // Hong Kong 🇭🇰

/**
 * Substitution rule when a holiday falls on a weekend or statutory non-working day.
 */
export type ObservedRollRule =
  | "none"
  | "sunday-to-monday" // If Sunday -> roll to Monday (e.g., Thailand, Hong Kong, Japan)
  | "weekend-to-monday" // If Saturday or Sunday -> roll to Monday (e.g., UK, Singapore)
  | "sat-to-fri-sun-to-mon" // If Saturday -> Friday, If Sunday -> Monday (e.g., US Federal)
  | "iran-roll"; // Iran weekend roll (Thursday/Friday)

/**
 * Fixed solar calendar date rule (e.g., Songkran April 13-15, New Year Jan 1).
 */
export interface FixedHolidayRule {
  readonly type: "fixed";
  readonly id: string;
  readonly month: number; // 1-12
  readonly day: number; // 1-31
  readonly name: string;
  readonly nameEn: string;
  readonly observed?: ObservedRollRule;
  readonly validFromYear?: number;
  readonly validUntilYear?: number;
}

/**
 * Floating weekday rule (e.g., US Thanksgiving 4th Thursday of November, Japan Happy Monday 2nd Monday).
 */
export interface FloatingHolidayRule {
  readonly type: "floating";
  readonly id: string;
  readonly month: number; // 1-12
  readonly weekday: number; // 1 (Mon) .. 7 (Sun)
  readonly occurrence: 1 | 2 | 3 | 4 | 5 | -1; // -1 represents the last weekday of the month
  readonly name: string;
  readonly nameEn: string;
  readonly validFromYear?: number;
  readonly validUntilYear?: number;
}

/**
 * Western Christian astronomical Easter cycle rule (Meeus/Jones/Butcher algorithm).
 * e.g., Good Friday (offset -2), Easter Monday (offset +1), Ascension (offset +39).
 */
export interface EasterHolidayRule {
  readonly type: "easter";
  readonly id: string;
  readonly offsetDays: number;
  readonly name: string;
  readonly nameEn: string;
  readonly validFromYear?: number;
  readonly validUntilYear?: number;
}

/**
 * Islamic Lunar Hijri holiday rule mapped to solar Gregorian years via Chronera Hijri adapters.
 * e.g., Eid al-Fitr (1 Shawwal = Month 10 Day 1), Eid al-Adha (10 Dhu al-Hijjah = Month 12 Day 10).
 */
export interface HijriHolidayRule {
  readonly type: "hijri";
  readonly id: string;
  readonly hijriMonth: number; // 1-12
  readonly hijriDay: number; // 1-30
  readonly durationDays?: number; // default 1
  readonly name: string;
  readonly nameEn: string;
  readonly validFromYear?: number;
  readonly validUntilYear?: number;
}

/**
 * Dynamic custom rule for arbitrary mathematical or cultural evaluations.
 */
export interface CustomHolidayRule {
  readonly type: "custom";
  readonly id: string;
  readonly name: string;
  readonly nameEn: string;
  readonly evaluate: (year: number) => readonly PublicHoliday[];
}

export type HolidayRule =
  | FixedHolidayRule
  | FloatingHolidayRule
  | EasterHolidayRule
  | HijriHolidayRule
  | CustomHolidayRule;

/**
 * Evaluated public holiday representation.
 */
export interface PublicHoliday {
  readonly id: string;
  readonly date: LocalDate;
  readonly name: string;
  readonly nameEn: string;
  readonly country: CountryCode | (string & {});
  readonly isObserved: boolean;
  readonly originalDate?: LocalDate;
}

/**
 * Complete country holiday calendar definition.
 */
export interface HolidayCalendar {
  readonly country: CountryCode | (string & {});
  readonly countryName?: string;
  readonly defaultWeekendDays?: readonly number[]; // 1 = Mon ... 7 = Sun
  readonly rules: readonly HolidayRule[];
}

/**
 * Options for holiday queries.
 */
export interface HolidayOptions {
  /** Include substituted/observed holidays when falling on weekends (default: true) */
  readonly includeObserved?: boolean;
  /** Additional custom holidays to include */
  readonly additionalHolidays?: readonly LocalDate[];
}
