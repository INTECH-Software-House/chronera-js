# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
