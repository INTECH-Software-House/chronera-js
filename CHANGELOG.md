# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

- Initial enterprise release of `@intech/chronera`.
- Core domain date and time primitives: `AbsoluteDay`, `LocalDate`, `LocalTime`, `LocalDateTime`, `Instant`, `CalendarDate`.
- Civil calendar adapters: Gregorian, Thai Buddhist, Hijri (Tabular, Civil, Umm al-Qura), ROC (Minguo), Japanese Era (Reiwa, Heisei, Showa, Taisho, Meiji), Indian National Saka, and Persian Solar Hijri.
- High-performance LDML format string parser with zero runtime dependencies.
- Multi-package manager support verified across `npm`, `pnpm`, `yarn` (PnP), and `bun`.
