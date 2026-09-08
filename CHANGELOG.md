# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.5] - 2026-09-09

### Added

- **Public Holidays & Statutory Working Days Engine (15 Countries)**:
  - `getPublicHolidays(year, country)`: Returns all statutory public holidays for a given year and country code.
  - `isPublicHoliday(date, country)`: Returns `true` if the given date is a statutory public holiday.
  - `isWorkingDay(date, country)`: Returns `true` if the date is a working day (not weekend, not holiday).
  - `addWorkingDays(date, n, country)`: Adds working days skipping weekends AND public holidays.
  - `subtractWorkingDays(date, n, country)`: Subtracts working days skipping weekends AND public holidays.
  - `diffInWorkingDays(left, right, country)`: Returns signed count of actual working days between two dates.
- **15 Countries Supported**: 🇹🇭 Thailand, 🇯🇵 Japan, 🇺🇸 USA, 🇬🇧 UK, 🇩🇪 Germany, 🇫🇷 France, 🇸🇬 Singapore, 🇭🇰 Hong Kong, 🇨🇳 China, 🇮🇳 India, 🇦🇺 Australia, 🇸🇦 Saudi Arabia, 🇦🇪 UAE, 🇮🇷 Iran, 🇹🇼 Taiwan.
- **Holiday Rule Engine**: Fixed-date rules, floating rules (e.g. Thanksgiving), Easter-based rules, Hijri-based rules with full DST and leap-year awareness.
- **Exported Types**: `CountryCode`, `PublicHoliday`, `HolidayRule`, `HolidayRegistry`.

## [0.1.4] - 2026-09-08

### Added

- **TimeZone Engine & Cross-Zone Formatting Operations**:
  - `formatInTimeZone(date, timeZone, pattern, options?)`: Format any date, instant, or ISO string in any IANA time zone (e.g. `America/New_York`, `Asia/Tokyo`, `Europe/London`) with full LDML pattern tokens.
  - `getTimeZoneOffset(date, timeZone)`: Returns exact offset string (e.g. `"+07:00"`, `"-05:00"`) and millisecond offset with complete Daylight Saving Time (DST) transition fidelity.
  - `isSameTimeZone(tz1, tz2)`: Compares two IANA timezone identifiers for canonical or behavioral equality.
- **Pattern Tokens Expansion**:
  - Full timezone token support in pattern formatter: `z`, `zzzz`, `Z`, `ZZZZ`, `xxx`, `X`, `v`, `vvvv`, `O`, `OOOO`.
- **Exported Types**:
  - `FormatInTimeZoneOptions`, `TimeZoneOffsetResult`.

## [0.1.3] - 2026-09-07

### Added

- **Business & Working Days Convenience Helpers** for enterprise, HR, logistics, and fintech operations:
  - **Weekend & Weekday Predicates**:
    - `isWeekend(date)`: Returns `true` if date is Saturday or Sunday.
    - `isWeekday(date)`: Returns `true` if date is Monday through Friday.
  - **Business Days Arithmetic**:
    - `addBusinessDays(date, n)`: Adds business days, skipping Saturdays and Sundays automatically with $O(1)$ weekly fast-path.
    - `subtractBusinessDays(date, n)`: Subtracts business days, skipping weekends.
  - **Working Days Difference**:
    - `diffInBusinessDays(left, right)`: Returns signed count of working days between two dates (`left - right`).
- **Universal Cross-Calendar Precision**:
  - Seamless support for `LocalDate` and all supported calendar systems (Thai Buddhist, Japanese Reiwa, Hijri, Persian, etc.).

## [0.1.3] - 2026-09-07

### Added

- **Business & Working Days Convenience Helpers** for enterprise, HR, logistics, and fintech operations:
  - **Weekend & Weekday Predicates**:
    - `isWeekend(date)`: Returns `true` if date is Saturday or Sunday.
    - `isWeekday(date)`: Returns `true` if date is Monday through Friday.
  - **Business Days Arithmetic**:
    - `addBusinessDays(date, n)`: Adds business days, skipping Saturdays and Sundays automatically with $O(1)$ weekly fast-path.
    - `subtractBusinessDays(date, n)`: Subtracts business days, skipping weekends.
  - **Working Days Difference**:
    - `diffInBusinessDays(left, right)`: Returns signed count of working days between two dates (`left - right`).
- **Universal Cross-Calendar Precision**:
  - Seamless support for `LocalDate` and all supported calendar systems (Thai Buddhist, Japanese Reiwa, Hijri, Persian, etc.).

## [0.1.2] - 2026-09-06

### Added

- **Time & Instant Convenience Helpers**:
  - **Day Boundary Helpers**: `startOfDay(input)` (00:00:00.000) and `endOfDay(input)` (23:59:59.999) accepting `LocalDate` or `LocalDateTime`.
  - **Temporal Expiration & Status**: `isPast(target)` and `isFuture(target)` for Instant, Date, or numeric timestamps.
  - **Polymorphic Time Arithmetic**:
    - `addHours(target, n)` / `subtractHours(target, n)`
    - `addMinutes(target, n)` / `subtractMinutes(target, n)`
    - `addSeconds(target, n)` / `subtractSeconds(target, n)`
    - Seamless polymorphic support for `LocalTime`, `LocalDateTime`, and `Instant` with automatic calendar-date rollover across midnights and leap days.
- **Exported Types**: `TimeOrDateTimeOrInstant` in root barrel.

## [0.1.1] - 2026-09-05

### Added

- **Daily Convenience Helpers** for high-frequency developer workflows:
  - **Comparison Helpers**: `isBefore(d1, d2)`, `isAfter(d1, d2)`, `isEqual(d1, d2)`, `isSameDay(d1, d2)`, `isBetween(date, start, end, inclusivity)`, `isToday(date, timeZone)`.
  - **Date Arithmetic Shortcuts**: `addDays(d, n)`, `subtractDays(d, n)`, `addMonths(d, n)`, `subtractMonths(d, n)`, `addYears(d, n)`, `subtractYears(d, n)`, and `diffInDays(left, right)`.
  - **Date Boundary Helpers**: `startOfMonth(date)`, `endOfMonth(date)`, `startOfYear(date)`, `endOfYear(date)`.
- **Universal Cross-Calendar Precision**:
  - Seamless support for `LocalDate` and all supported `CalendarDate` systems:
    - 🇹🇭 Thai Buddhist (`buddhist`) with BE leap year handling.
    - 🇯🇵 Japanese Era (`japanese`) with seamless era rollover (e.g. Heisei to Reiwa).
    - 🇹🇼 Republic of China / Minguo (`roc`).
    - 🇮🇷 Persian / Solar Hijri (`persian`).
    - 🇸🇦 Islamic Civil (`islamic-civil`).
    - 🇮🇳 Indian National Saka (`indian`).
    - 🌐 Gregorian (`gregory`) and ISO 8601 (`iso8601`).
- Exported convenience types `DateOrCalendarDate` and `IntervalInclusivity` from root barrel.

## [0.1.1] - 2026-09-05

### Added

- **Daily Convenience Helpers** for high-frequency developer workflows:
  - **Comparison Helpers**: `isBefore(d1, d2)`, `isAfter(d1, d2)`, `isEqual(d1, d2)`, `isSameDay(d1, d2)`, `isBetween(date, start, end, inclusivity)`, `isToday(date, timeZone)`.
  - **Date Arithmetic Shortcuts**: `addDays(d, n)`, `subtractDays(d, n)`, `addMonths(d, n)`, `subtractMonths(d, n)`, `addYears(d, n)`, `subtractYears(d, n)`, and `diffInDays(left, right)`.
  - **Date Boundary Helpers**: `startOfMonth(date)`, `endOfMonth(date)`, `startOfYear(date)`, `endOfYear(date)`.
- **Universal Cross-Calendar Precision**:
  - Seamless support for `LocalDate` and all supported `CalendarDate` systems:
    - 🇹🇭 Thai Buddhist (`buddhist`) with BE leap year handling.
    - 🇯🇵 Japanese Era (`japanese`) with seamless era rollover (e.g. Heisei to Reiwa).
    - 🇹🇼 Republic of China / Minguo (`roc`).
    - 🇮🇷 Persian / Solar Hijri (`persian`).
    - 🇸🇦 Islamic Civil (`islamic-civil`).
    - 🇮🇳 Indian National Saka (`indian`).
    - 🌐 Gregorian (`gregory`) and ISO 8601 (`iso8601`).
- Exported convenience types `DateOrCalendarDate` and `IntervalInclusivity` from root barrel.

### Added

- Worldwide official native presets for 10 world regions: US (`en-US`), UK (`en-GB`), Germany (`de-DE`), France (`fr-FR`), China (`zh-CN`), Taiwan (`zh-TW`), Spain (`es-ES`), Saudi Arabia (`ar-SA`), Japan (`ja-JP`), and Thailand (`th-TH`).
- ISO 8601 Ordinal Date (Day of Year) computation (`getDayOfYear`, `formatOrdinalDate`).
- NASA/IAU benchmark astronomical Julian Day Number (`toJulianDayNumber`) and Modified Julian Day (`toModifiedJulianDay`).
- Fiscal Year & Calendar Quarter engines with configurable starting months for enterprise accounting.
- Strict RFC 2822 / RFC 5322 HTTP-date and SMTP email timestamp formatter (`formatRfc2822`).
- OpenSSF Scorecard supply chain auditing and CodeQL AST semantic security workflows.
- GitHub Branch Ruleset protection with exclusive CODEOWNERS authorization for `@ParkPawapon`.

### Changed

- Upgraded package tooling to pnpm 11.25.0 and Node types to 26.4.0.
- Enhanced Clean Architecture static boundary verification.
- Enforced zero runtime dependencies guarantee (`dependencies: {}`).

---

## [0.1.0] - 2026-09-03

### Added

- Initial enterprise release of `@intech-software/chronera`.
- Core domain date and time primitives: `AbsoluteDay`, `LocalDate`, `LocalTime`, `LocalDateTime`, `Instant`, `CalendarDate`.
- Civil calendar adapters: Gregorian, Thai Buddhist, Hijri (Tabular, Civil, Umm al-Qura), ROC (Minguo), Japanese Era (Reiwa, Heisei, Showa, Taisho, Meiji), Indian National Saka, and Persian Solar Hijri.
- High-performance LDML format string parser with zero runtime dependencies.
- Multi-package manager support verified across `npm`, `pnpm`, `yarn` (PnP), and `bun`.
