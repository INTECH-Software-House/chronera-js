Hey r/typescript! 👋

Over the past few months, we’ve been working on **Chronera**, an open-source, zero-dependency date and multi-calendar engine written in strict TypeScript.

One of our primary design goals was solving an architectural challenge that existing JavaScript date libraries rarely address: **how to model non-Gregorian cultural calendars (Thai Buddhist, Japanese Era, Islamic Hijri, Persian Jalali, Indian Saka) with strict compile-time type safety, zero dependencies, and without resorting to loose string parsing or `any`.**

We wanted to share how we designed the domain types and get the community's critique on our type contracts and ergonomics.

---

### 1. Discriminated Domain Primitives vs. Monolithic Objects

Instead of relying on a single mutable class like native `Date` or generic wrapper objects, we decoupled date semantics into lightweight, immutable tagged unions:

```typescript
// Date-only semantic primitive (Prevents accidental timezone offset pollution)
export interface LocalDate {
  readonly kind: "local-date";
  readonly year: number;
  readonly month: number; // 1-12
  readonly day: number; // 1-31
}

// Cultural Calendar Date primitive
export interface CalendarDate {
  readonly kind: "calendar-date";
  readonly calendar: CalendarId;
  readonly year: number;
  readonly monthCode: MonthCode; // e.g. "M01", "M05L" for lunisolar leap months
  readonly month?: number;
  readonly day: number;
  readonly era?: string; // e.g. "reiwa", "heisei", "showa"
  readonly eraYear?: number;
}

// Point-in-time exact instant
export interface Instant {
  readonly kind: "instant";
  readonly epochMilliseconds: number;
}
```

By tagging every primitive with a literal `kind`, functions prevent domain mismatches at compile time (e.g., timezone formatting rejects `LocalDate` inputs because date-only primitives have no time of day).

---

### 2. Type-Preserving Generic Arithmetic

When performing arithmetic or boundary queries, we preserve the exact input type rather than coercing back to a broad union:

```typescript
export function addDays<T extends LocalDate | CalendarDate>(
  date: T,
  amount: number,
  overflow?: "constrain" | "reject",
): T;

export function startOfMonth<T extends LocalDate | CalendarDate>(date: T): T;
```

This ensures that passing a `CalendarDate` preserves its cultural metadata, while passing a `LocalDate` retains its lightweight structure without extra type assertions:

```typescript
const local = localDate(2026, 9, 5);
const nextWeek = addDays(local, 7);
// typeof nextWeek is accurately inferred as LocalDate
```

---

### 3. Cross-Calendar Polymorphism with Astronomical Integer Days

A significant engineering challenge was enabling direct comparisons between disparate calendar systems (e.g., Thai Buddhist `2569-09-05`, Gregorian `2026-09-05`, Japanese Reiwa `令和8年9月5日`, and Islamic Hijri `1448-03-23 AH`).

We resolved this by projecting each calendar system down to an astronomical integer day (`AbsoluteDay` where 1970-01-01 CE = Day 0):

```typescript
import {
  localDate,
  convertCalendarDate,
  isEqual,
  isBetween,
} from "@intech-software/chronera";

const greg = localDate(2026, 9, 5);
const thai = convertCalendarDate(greg, "buddhist"); // Year 2569 BE
const japan = convertCalendarDate(greg, "japanese"); // Reiwa 8

// Evaluates accurately to true across calendar boundaries:
isEqual(greg, thai); // true
isEqual(thai, japan); // true

// Range checking across calendar systems:
isBetween(japan, localDate(2026, 9, 1), localDate(2026, 9, 30)); // true
```

---

### 4. Working Days Arithmetic with O(1) Weekly Block Fast-Path

For business calculations, we added weekend-skipping arithmetic (`addBusinessDays`, `diffInBusinessDays`) using an O(1) mathematical weekly acceleration block (5 business days = 7 calendar days) rather than looping through hundreds of days:

```typescript
import {
  localDate,
  addBusinessDays,
  diffInBusinessDays,
  isWeekend,
} from "@intech-software/chronera";

const friday = localDate(2026, 9, 4);
const delivery = addBusinessDays(friday, 2);
// -> 2026-09-08 (Tuesday, automatically skipping Saturday & Sunday)

diffInBusinessDays(delivery, friday); // 2
```

---

### 5. Strict Zero-Dependency & Type-Level Testing

- Compiled with `strict: true`, `exactOptionalPropertyTypes: true`, and **zero `any`** across the entire codebase.
- Verified against Clean Architecture boundary guards (`scripts/check-architecture.ts`).
- Tested with **type-level test suites (`tstyche`)** to guarantee that invalid combinations fail at compile time.
- 100% Zero third-party runtime dependencies.

---

### 🔗 Project Links

- **GitHub Repository & Type Definitions**: https://github.com/INTECH-Software-House/chronera-js
- **Live Interactive Playground**: https://intech-software-house.github.io/chronera-js/
- **NPM Package**: https://www.npmjs.com/package/@intech-software/chronera

---

### 💬 Discussion & Questions for the Community:

1. **Tagged Primitives vs. Value Objects**: Do you prefer pure object literals with `kind` discriminator tags (like above) or class instances with methods?
2. **Calendar Boundary Constraints**: For regional calendars that switch eras mid-month (such as the Heisei to Reiwa transition on May 1, 2019), what type contracts have you found most resilient in enterprise applications?

We'd love your feedback on the type contracts, ergonomics, and any tricky date edge cases you've encountered!
