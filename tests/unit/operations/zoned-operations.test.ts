import { describe, it, expect } from "vitest";
import { zonedDateTime } from "../../../src/core/zoned-date-time.js";
import { instantFromEpochMilliseconds } from "../../../src/core/instant.js";
import {
  createZonedDateTime,
  getZonedFields,
  withTimeZone,
  withCalendar,
  addZonedDuration,
  subtractZonedDuration,
  diffZoned,
  zonedDateTimeToLocalDate,
  zonedDateTimeToLocalTime,
  zonedDateTimeToLocalDateTime,
  zonedDateTimeToInstant,
  formatZonedDateTime,
} from "../../../src/operations/zoned-operations.js";
import { ChroneraRangeError } from "../../../src/errors/errors.js";

describe("ZonedDateTime - Core Factory & Basic Operations", () => {
  it("creates a valid ZonedDateTime using the core factory", () => {
    const instant = instantFromEpochMilliseconds(1788640000000);
    const zdt = zonedDateTime(instant, "Asia/Bangkok");

    expect(zdt.kind).toBe("zoned-date-time");
    expect(zdt.instant).toBe(instant);
    expect(zdt.timeZone).toBe("Asia/Bangkok");
    expect(zdt.calendar).toBe("gregory");
  });

  it("throws on invalid instant or timezone", () => {
    // @ts-expect-error test invalid input
    expect(() => zonedDateTime(null, "Asia/Bangkok")).toThrow();
    expect(() =>
      zonedDateTime(
        { kind: "instant", epochMilliseconds: NaN },
        "Asia/Bangkok",
      ),
    ).toThrow();
    expect(() => zonedDateTime(instantFromEpochMilliseconds(0), "")).toThrow();
  });

  it("creates ZonedDateTime from fields in a fixed-offset zone (Asia/Bangkok UTC+7)", () => {
    const zdt = createZonedDateTime(
      { year: 2026, month: 9, day: 27, hour: 14, minute: 30, second: 0 },
      "Asia/Bangkok",
    );

    const fields = getZonedFields(zdt);
    expect(fields.year).toBe(2026);
    expect(fields.month).toBe(9);
    expect(fields.day).toBe(27);
    expect(fields.hour).toBe(14);
    expect(fields.minute).toBe(30);
    expect(fields.second).toBe(0);
    expect(fields.offsetString).toBe("+07:00");
    expect(fields.offsetMilliseconds).toBe(7 * 3600 * 1000);
    expect(fields.isDST).toBe(false);
  });

  it("switches time zones using withTimeZone while preserving exact instant", () => {
    const bkk = createZonedDateTime(
      { year: 2026, month: 9, day: 27, hour: 12, minute: 0, second: 0 },
      "Asia/Bangkok",
    );

    const utc = withTimeZone(bkk, "UTC");
    expect(utc.timeZone).toBe("UTC");
    expect(utc.instant.epochMilliseconds).toBe(bkk.instant.epochMilliseconds);

    const utcFields = getZonedFields(utc);
    // 12:00 in UTC+7 is 05:00 UTC
    expect(utcFields.hour).toBe(5);
    expect(utcFields.minute).toBe(0);
    expect(utcFields.offsetString).toBe("+00:00");
  });

  it("switches calendar using withCalendar", () => {
    const zdt = createZonedDateTime(
      { year: 2026, month: 9, day: 27, hour: 12, minute: 0 },
      "Asia/Bangkok",
    );
    const buddhistZdt = withCalendar(zdt, "buddhist");
    expect(buddhistZdt.calendar).toBe("buddhist");
    expect(buddhistZdt.instant.epochMilliseconds).toBe(
      zdt.instant.epochMilliseconds,
    );
  });
});

describe("ZonedDateTime - DST Disambiguation (TC39 Temporal Rules)", () => {
  // In 2026, US Spring Forward is Sunday, March 8, 2026 (02:00 -> 03:00 jump)
  it("handles DST spring-forward gap with 'compatible' (advances past gap)", () => {
    const zdt = createZonedDateTime(
      { year: 2026, month: 3, day: 8, hour: 2, minute: 30 },
      "America/New_York",
      { disambiguation: "compatible" },
    );

    const fields = getZonedFields(zdt);
    // 2:30 doesn't exist, so compatible advances by the 1h gap => 3:30
    expect(fields.hour).toBe(3);
    expect(fields.minute).toBe(30);
    expect(fields.offsetString).toBe("-04:00"); // EDT
    expect(fields.isDST).toBe(true);
  });

  it("handles DST spring-forward gap with 'reject' (throws ChroneraRangeError)", () => {
    expect(() =>
      createZonedDateTime(
        { year: 2026, month: 3, day: 8, hour: 2, minute: 30 },
        "America/New_York",
        { disambiguation: "reject" },
      ),
    ).toThrow(ChroneraRangeError);
  });

  // In 2026, US Fall Back is Sunday, November 1, 2026 (02:00 -> 01:00 jump)
  it("handles DST fall-back overlap with 'earlier' and 'later'", () => {
    const zdtEarlier = createZonedDateTime(
      { year: 2026, month: 11, day: 1, hour: 1, minute: 30 },
      "America/New_York",
      { disambiguation: "earlier" },
    );

    const zdtLater = createZonedDateTime(
      { year: 2026, month: 11, day: 1, hour: 1, minute: 30 },
      "America/New_York",
      { disambiguation: "later" },
    );

    // Both show 1:30 wall clock
    expect(getZonedFields(zdtEarlier).hour).toBe(1);
    expect(getZonedFields(zdtLater).hour).toBe(1);

    // But earlier is 1 hour before later
    expect(
      zdtLater.instant.epochMilliseconds - zdtEarlier.instant.epochMilliseconds,
    ).toBe(3600000);
  });

  it("handles DST fall-back overlap with 'reject'", () => {
    expect(() =>
      createZonedDateTime(
        { year: 2026, month: 11, day: 1, hour: 1, minute: 30 },
        "America/New_York",
        { disambiguation: "reject" },
      ),
    ).toThrow(ChroneraRangeError);
  });
});

describe("ZonedDateTime - Arithmetic (Temporal Semantics)", () => {
  it("preserves wall-clock time when adding days across a 23h DST spring-forward transition", () => {
    // Saturday, March 7, 2026 at 09:00 AM EST
    const start = createZonedDateTime(
      { year: 2026, month: 3, day: 7, hour: 9, minute: 0, second: 0 },
      "America/New_York",
    );

    // Adding 1 calendar day
    const nextDay = addZonedDuration(start, { days: 1 });
    const fields = getZonedFields(nextDay);

    // Wall-clock time MUST be preserved: 09:00:00 AM next day (Sunday March 8)
    expect(fields.year).toBe(2026);
    expect(fields.month).toBe(3);
    expect(fields.day).toBe(8);
    expect(fields.hour).toBe(9);
    expect(fields.minute).toBe(0);

    // But the elapsed time is only 23 hours because 1 hour was skipped by DST!
    const elapsedHours =
      (nextDay.instant.epochMilliseconds - start.instant.epochMilliseconds) /
      3600000;
    expect(elapsedHours).toBe(23);
  });

  it("adds exact elapsed hours when adding hours across a DST transition", () => {
    // Saturday, March 7, 2026 at 09:00 AM EST
    const start = createZonedDateTime(
      { year: 2026, month: 3, day: 7, hour: 9, minute: 0, second: 0 },
      "America/New_York",
    );

    // Adding 24 exact hours
    const after24h = addZonedDuration(start, { hours: 24 });
    const fields = getZonedFields(after24h);

    // Since the day was 23 hours long, 24 hours later is 10:00:00 AM!
    expect(fields.hour).toBe(10);
    expect(fields.minute).toBe(0);
  });

  it("subtracts duration correctly", () => {
    const start = createZonedDateTime(
      { year: 2026, month: 9, day: 27, hour: 15, minute: 0 },
      "Asia/Bangkok",
    );

    const sub = subtractZonedDuration(start, { days: 2, hours: 3 });
    const fields = getZonedFields(sub);
    expect(fields.day).toBe(25);
    expect(fields.hour).toBe(12);
  });

  it("computes difference between two ZonedDateTimes", () => {
    const a = createZonedDateTime(
      { year: 2026, month: 9, day: 27, hour: 18, minute: 0 },
      "Asia/Bangkok",
    );
    const b = createZonedDateTime(
      { year: 2026, month: 9, day: 27, hour: 12, minute: 0 },
      "Asia/Bangkok",
    );

    expect(diffZoned(a, b, "hours")).toBe(6);
    expect(diffZoned(a, b, "minutes")).toBe(360);
  });
});

describe("ZonedDateTime - Conversion & Formatting", () => {
  it("converts to LocalDate, LocalTime, LocalDateTime, and Instant", () => {
    const zdt = createZonedDateTime(
      {
        year: 2026,
        month: 9,
        day: 27,
        hour: 14,
        minute: 45,
        second: 30,
        millisecond: 500,
      },
      "Asia/Bangkok",
    );

    const ld = zonedDateTimeToLocalDate(zdt);
    expect(ld.kind).toBe("local-date");
    expect(ld.year).toBe(2026);
    expect(ld.month).toBe(9);
    expect(ld.day).toBe(27);

    const lt = zonedDateTimeToLocalTime(zdt);
    expect(lt.kind).toBe("local-time");
    expect(lt.hour).toBe(14);
    expect(lt.minute).toBe(45);
    expect(lt.second).toBe(30);
    expect(lt.millisecond).toBe(500);

    const ldt = zonedDateTimeToLocalDateTime(zdt);
    expect(ldt.kind).toBe("local-date-time");
    expect(ldt.date.day).toBe(27);
    expect(ldt.time.hour).toBe(14);

    const inst = zonedDateTimeToInstant(zdt);
    expect(inst.kind).toBe("instant");
    expect(inst.epochMilliseconds).toBe(zdt.instant.epochMilliseconds);
  });

  it("formats ZonedDateTime with custom pattern", () => {
    const zdt = createZonedDateTime(
      { year: 2026, month: 9, day: 27, hour: 14, minute: 30, second: 0 },
      "Asia/Bangkok",
    );

    const formatted = formatZonedDateTime(zdt, "yyyy-MM-dd HH:mm:ss XXX");
    expect(formatted).toBe("2026-09-27 14:30:00 +07:00");
  });
});
