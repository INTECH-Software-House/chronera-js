# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-09-21

### Added

- **Recurrence Rule (RFC 5545 RRULE) Engine** (`src/operations/rrule.ts`):
  - `parseRRule(expression, dtstart?)`: Parses standard RFC 5545 RRULE strings with support for `FREQ` (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`), `INTERVAL`, `COUNT`, `UNTIL`, `BYDAY` (including positional weekdays like `1MO`, `-1FR`), `BYMONTH`, `BYMONTHDAY`, and `WKST`.
  - `job.next(from?)`, `job.nextN(from, n)`, `job.all(limit?)`: High-performance recurrence evaluations.
  - `job.matches(date)`: Evaluates whether a date or instant matches the recurrence rule pattern.
  - `rruleToString(options)`: Serializes RRULE options into standard RFC 5545 recurrence strings.
  - `rruleToHuman(rrule, locale?)`: Natural language schedule descriptions in Thai (`"th"`) and English (`"en"`).
  - Exported Types: `RRuleFrequency`, `RRuleWeekday`, `ByDayRule`, `RRuleOptions`, `RRuleJob`.
- **iCalendar (RFC 5545) Engine** (`src/operations/icalendar.ts`):
  - `generateICS(events, calendarOptions?)`: Produces valid RFC 5545 `.ics` calendar files supporting single and multiple events, all-day dates (`VALUE=DATE`), timezone designations (`TZID`), event status, descriptions, locations, organizers, attendees, and RRULE integration.
  - Full compliance with RFC 5545 Section 3.1 Line Folding (75-octet limit with CRLF continuations) and RFC 5545 Section 3.3.11 text escaping.
  - `parseICS(icsContent)`: Unfolds and parses `.ics` files into structured event objects with Chronera `Instant` representations.
  - Exported Types: `ICSOrganizer`, `ICSAttendee`, `ICSEventInput`, `ICSCalendarOptions`, `ParsedICSEvent`, `ParsedICSCalendar`.
- **Financial & Accounting Periods Engine** (`src/operations/financial-periods.ts`):
  - `financialPeriods(referenceDate?, options?)`: Computes standard corporate financial accounting periods: Month-to-Date (`mtd`), Quarter-to-Date (`qtd`), Year-to-Date (`ytd`), and Last Twelve Months (`ltm`), with support for customizable `fiscalYearStartMonth` (e.g. 1 for Calendar year, 10 for Thai/US Federal Gov, 4 for UK/Japan/India, 7 for Australia).
  - `priorYearSamePeriod(range)`: Accurate Year-over-Year (YoY) comparative period generation with leap-year handling (Feb 29 $\rightarrow$ Feb 28).
  - `priorPeriod(range)`: Sequential preceding comparison periods (e.g. prior N days).
  - `isYTD(date, referenceDate?, options?)`: Checks whether a given timestamp falls within the YTD window.
  - Exported Types: `FinancialPeriodsOptions`, `FinancialPeriodsResult`.
- **Time-Series Data Binning & Gap Filling Engine** (`src/operations/time-buckets.ts`):
  - `timeBuckets(items, options)`: Groups arbitrary domain data items into time buckets (`minute`, `hour`, `day`, `week`, `month`, `quarter`, `year`) using property keys or custom selector functions.
  - Gap Filling (`fillGaps: true`): Generates empty buckets with 0 count / sums across intervals to ensure uninterrupted graph rendering in frontend dashboards.
  - Computes bucket aggregates: `count`, `sum`, `avg`, `min`, `max`.
  - Exported Types: `TimeBucketGranularity`, `TimeBucketOptions`, `TimeBucketResult`.

## [0.1.9] - 2026-09-17

### Added

- **Cron Expression Engine & Humanizer** (`src/operations/cron.ts`):
  - `parseCron(expression)`: Parses standard 5-part cron expressions with support for steps (`*/15`), ranges (`1-5`), lists (`1,15,30`), and month/day names (`MON-FRI`, `JAN-DEC`).
  - `isCronMatch(expression, date)`: Evaluates if a given date or instant matches the cron schedule.
  - `cronNextRun(expression, from?)`: Computes the exact next execution instant.
  - `cronNextN(expression, from, n)`: Computes the next `n` execution instants chronologically.
  - `cronPrevRun(expression, from?)`: Computes the previous execution instant.
  - `cronToHuman(expression, locale?)`: Human-readable cron schedule descriptions in Thai (`"th"`) and English (`"en"`).
  - Exported Types: `CronJob`, `CronFields`.
- **Calendar Grid & DatePicker Engine** (`src/operations/calendar-grid.ts`):
  - `generateMonthGrid(year, month, options?)`: Generates complete UI-ready calendar grids with leading and trailing padding cells, ISO week numbers, weekend indicators, and `isToday` flags.
  - `getMonthMatrix(year, month, options?)`: Returns a 2D matrix (`CalendarGridCell[][]`) representing the weeks of a month.
  - `generateYearGrid(year, options?)`: Generates the entire 12-month calendar grid for a given year.
  - `getAdjacentMonths(year, month)`: Calculates previous and next month/year tuples handling year transitions.
  - `getWeekDaysHeader(locale?, format?, weekStartsOn?)`: Localized weekday headers for UI date pickers supporting `'monday'` or `'sunday'` start days and `'short'`, `'narrow'`, or `'long'` formats.
  - Exported Types: `CalendarGridCell`, `MonthGridResult`, `MonthGridOptions`, `WeekStartDay`, `WeekdayHeaderFormat`.
- **World Clock & Meeting Overlap Planner** (`src/operations/world-clock.ts`):
  - `worldClock(timezones, instant?)`: Computes multi-timezone world clock entries with formatted local time, date, UTC offset string, DST status, and business hours detection.
  - `findOverlapHours(participants, referenceInstant?)`: Identifies mutual working hour overlap windows across international team members in disparate time zones.
  - `isDSTAtInstant(timeZone, instant)`: Determines whether Daylight Saving Time is active in a given IANA timezone at a specific instant.
  - `getNextDSTTransition(timeZone, fromYear?)`: Detects upcoming DST transition events (`spring-forward` or `fall-back`) with transition dates and offset shifts using binary search.
  - Exported Types: `WorldClockEntry`, `MeetingParticipant`, `MeetingWindow`, `DSTTransition`.

## [0.1.7] - 2026-09-17

### Added

- **Date Range & Interval Engine**:
  - `rangeContains(range, date)`: Returns `true` if a date falls within a DateRange (respects inclusivity).
  - `rangeOverlaps(a, b)`: Returns `true` if two ranges overlap.
  - `rangeIntersection(a, b)`: Returns the intersection of two ranges, or `null` if none.
  - `rangeUnion(a, b)`: Returns the union of two ranges.
  - `rangeLengthInDays(range)`: Returns the number of days in a range.
  - `eachDayOfInterval(start, end)`: Returns every date in an interval as an array.
  - `eachWeekOfInterval(start, end)`: Returns the first day of each week in an interval.
  - `eachMonthOfInterval(start, end)`: Returns the first day of each month in an interval.
  - `splitByDay/splitByWeek/splitByMonth(start, end)`: Splits an interval into sub-ranges.
- **Duration & Period Engine**:
  - `parseDuration(iso)`: Parses ISO 8601 duration strings (e.g. `"P1Y2M3DT4H"`).
  - `durationToISO(dur)`: Serializes a Duration to ISO 8601 string.
  - `durationToHuman(dur, locale)`: Human-readable duration in 8 locales (en, th, ja, zh, ko, fr, de, ar).
  - `addDuration/subtractDuration(date, dur)`: Date arithmetic using Duration objects.
  - `diffAsDuration(start, end)`: Returns the difference between two dates as a Duration.
  - `addDurations/scaleDuration/durationTotalDays`: Duration math utilities.
- **Recurring Schedule Engine**:
  - `recur(startDate).every(n).weeks().on(['monday','friday']).until(end).next(10)`: Fluent recurring schedule builder.
  - `getOccurrences(startDate, rule)`: Returns all occurrences matching a RecurrenceRule.
  - `isOccurrence(date, startDate, rule)`: Returns `true` if a date matches a recurrence pattern.
  - Supports daily, weekly, monthly, and yearly frequencies with interval, daysOfWeek, until, and count options.
- **Exported Types**: `RecurrenceFrequency`, `DayOfWeek`, `RecurrenceRule`.

## [0.1.6] - 2026-09-11

### Added

- **Business Hours & Shift SLA Engine**:
  - `isWithinBusinessHours(instant, schedule)`: Returns `true` if a given instant falls within configured business hours for a timezone-aware schedule.
  - `addBusinessHours(instant, n, schedule)`: Adds business hours to an instant, skipping non-working periods (nights, weekends, holidays).
  - `subtractBusinessHours(instant, n, schedule)`: Subtracts business hours from an instant, skipping non-working periods.
  - `diffInBusinessHours(start, end, schedule)`: Returns the signed count of business hours between two instants.
  - `getNextBusinessOpen(instant, schedule)`: Returns the next business open time from a given instant.
  - `getNextBusinessClose(instant, schedule)`: Returns the next business close time from a given instant.
- **Shift-Aware SLA Tracking**: Configurable work schedules with multi-shift support, per-day overrides, timezone awareness, and public holiday integration.
- **Exported Types**: `BusinessHoursSchedule`, `ShiftDefinition`, `BusinessHoursResult`.

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
