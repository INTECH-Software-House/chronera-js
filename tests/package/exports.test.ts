import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import * as Root from "../../dist/index.js";
import * as Calendar from "../../dist/calendar/index.js";
import * as Format from "../../dist/format/index.js";
import * as Parse from "../../dist/parse/index.js";
import * as Holidays from "../../dist/holidays/index.js";
import * as Scheduling from "../../dist/scheduling/index.js";

describe("package exports", () => {
  it("package.json defines expected subpaths", async () => {
    const pkg = JSON.parse(await readFile("package.json", "utf-8"));
    expect(pkg.exports["."]).toBeDefined();
    expect(pkg.exports["./calendar"]).toBeDefined();
    expect(pkg.exports["./format"]).toBeDefined();
    expect(pkg.exports["./parse"]).toBeDefined();
    expect(pkg.exports["./holidays"]).toBeDefined();
    expect(pkg.exports["./scheduling"]).toBeDefined();
    expect(pkg.exports["./zod"]).toBeDefined();
    expect(pkg.exports["./valibot"]).toBeDefined();
    expect(pkg.exports["./compat"]).toBeDefined();
    expect(pkg.exports["./testing"]).toBeDefined();
    expect(pkg.exports["./standard"]).toBeDefined();
    expect(pkg.exports["./superjson"]).toBeDefined();
    expect(pkg.exports["./drizzle"]).toBeDefined();
    expect(pkg.exports["./arktype"]).toBeDefined();
    expect(pkg.exports["./react"]).toBeDefined();
    expect(pkg.exports["./thai"]).toBeDefined();
    expect(pkg.exports["./temporal"]).toBeDefined();
  });

  it("exports all expected symbols from root", () => {
    expect(typeof Root.chronera).toBe("function");
    expect(typeof Root.Chronera).toBe("function");
    expect(typeof Root.formatDate).toBe("function");
    expect(typeof Root.parseLocalDate).toBe("function");
    expect(typeof Root.createChronera).toBe("function");
    expect(typeof Root.convertCalendarDate).toBe("function");
    expect(typeof Root.localDate).toBe("function");
    expect(typeof Root.instantFromDate).toBe("function");
    expect(typeof Root.formatInTimeZone).toBe("function");
    expect(typeof Root.getTimeZoneOffset).toBe("function");
    expect(typeof Root.isSameTimeZone).toBe("function");
    expect(typeof Root.isPublicHoliday).toBe("function");
    expect(typeof Root.getPublicHolidays).toBe("function");
    expect(typeof Root.getHolidayDetails).toBe("function");
    expect(typeof Root.isBusinessDay).toBe("function");
    expect(typeof Root.addBusinessDays).toBe("function");
    expect(typeof Root.addBusinessHours).toBe("function");
    expect(typeof Root.diffInBusinessHours).toBe("function");
    // v0.1.7 — interval operations
    expect(typeof Root.rangeContains).toBe("function");
    expect(typeof Root.rangeOverlaps).toBe("function");
    expect(typeof Root.rangeIntersection).toBe("function");
    expect(typeof Root.rangeUnion).toBe("function");
    expect(typeof Root.rangeLengthInDays).toBe("function");
    expect(typeof Root.eachDayOfInterval).toBe("function");
    expect(typeof Root.eachWeekOfInterval).toBe("function");
    expect(typeof Root.eachMonthOfInterval).toBe("function");
    expect(typeof Root.splitByDay).toBe("function");
    expect(typeof Root.splitByWeek).toBe("function");
    expect(typeof Root.splitByMonth).toBe("function");
    // v0.1.7 — duration operations
    expect(typeof Root.parseDuration).toBe("function");
    expect(typeof Root.durationToISO).toBe("function");
    expect(typeof Root.durationToHuman).toBe("function");
    expect(typeof Root.addDuration).toBe("function");
    expect(typeof Root.subtractDuration).toBe("function");
    expect(typeof Root.diffAsDuration).toBe("function");
    expect(typeof Root.addDurations).toBe("function");
    expect(typeof Root.scaleDuration).toBe("function");
    expect(typeof Root.durationTotalDays).toBe("function");
    // v0.1.7 — recurrence engine
    expect(typeof Root.recur).toBe("function");
    expect(typeof Root.getOccurrences).toBe("function");
    expect(typeof Root.isOccurrence).toBe("function");
    // v0.1.8 — natural language, age & countdown, time-series
    expect(typeof Root.parseNaturalDate).toBe("function");
    expect(typeof Root.safeParseNaturalDate).toBe("function");
    expect(typeof Root.calculateAge).toBe("function");
    expect(typeof Root.nextBirthday).toBe("function");
    expect(typeof Root.daysUntilBirthday).toBe("function");
    expect(typeof Root.isBirthday).toBe("function");
    expect(typeof Root.countdown).toBe("function");
    expect(typeof Root.timeElapsed).toBe("function");
    expect(typeof Root.bucketDates).toBe("function");
    expect(typeof Root.bucketByDay).toBe("function");
    expect(typeof Root.bucketByMonth).toBe("function");
    expect(typeof Root.histogram).toBe("function");
    expect(typeof Root.sortDates).toBe("function");
    expect(typeof Root.minDate).toBe("function");
    expect(typeof Root.maxDate).toBe("function");
    // v0.1.9 — Cron, Calendar Grid, World Clock
    expect(typeof Root.parseCron).toBe("function");
    expect(typeof Root.isCronMatch).toBe("function");
    expect(typeof Root.cronNextRun).toBe("function");
    expect(typeof Root.cronNextN).toBe("function");
    expect(typeof Root.cronPrevRun).toBe("function");
    expect(typeof Root.cronToHuman).toBe("function");
    expect(typeof Root.generateMonthGrid).toBe("function");
    expect(typeof Root.getMonthMatrix).toBe("function");
    expect(typeof Root.generateYearGrid).toBe("function");
    expect(typeof Root.getAdjacentMonths).toBe("function");
    expect(typeof Root.getWeekDaysHeader).toBe("function");
    expect(typeof Root.worldClock).toBe("function");
    expect(typeof Root.findOverlapHours).toBe("function");
    expect(typeof Root.isDSTAtInstant).toBe("function");
    expect(typeof Root.getNextDSTTransition).toBe("function");
    // v0.2.0 — RRULE, iCalendar, Financial Periods, Time Buckets
    expect(typeof Root.parseRRule).toBe("function");
    expect(typeof Root.rruleToString).toBe("function");
    expect(typeof Root.rruleToHuman).toBe("function");
    expect(typeof Root.generateICS).toBe("function");
    expect(typeof Root.parseICS).toBe("function");
    expect(typeof Root.financialPeriods).toBe("function");
    expect(typeof Root.priorYearSamePeriod).toBe("function");
    expect(typeof Root.priorPeriod).toBe("function");
    expect(typeof Root.isYTD).toBe("function");
    expect(typeof Root.timeBuckets).toBe("function");
    // v0.2.1 — ZonedDateTime (Temporal)
    expect(typeof Root.zonedDateTime).toBe("function");
    expect(typeof Root.createZonedDateTime).toBe("function");
    expect(typeof Root.getZonedFields).toBe("function");
    expect(typeof Root.withTimeZone).toBe("function");
    expect(typeof Root.withCalendar).toBe("function");
    expect(typeof Root.addZonedDuration).toBe("function");
    expect(typeof Root.subtractZonedDuration).toBe("function");
    expect(typeof Root.diffZoned).toBe("function");
    expect(typeof Root.formatZonedDateTime).toBe("function");
    // v0.2.5 — IXDTF (RFC 9557) & Cross-Border Corporate Calendar
    expect(typeof Root.createCorporateCalendar).toBe("function");
    expect(typeof Root.getHolidayDetailsAll).toBe("function");
    expect(typeof Root.isIXDTF).toBe("function");
    expect(typeof Root.parseIXDTF).toBe("function");
    expect(typeof Root.formatIXDTF).toBe("function");
    // v0.2.8 — BOT Bank Holidays & Smart Relative Time
    expect(typeof Root.isBankHoliday).toBe("function");
    expect(typeof Root.getBankHolidays).toBe("function");
    expect(typeof Root.isBankBusinessDay).toBe("function");
    expect(typeof Root.addBankBusinessDays).toBe("function");
    expect(typeof Root.diffInBankBusinessDays).toBe("function");
    expect(typeof Root.timeAgo).toBe("function");
    expect(typeof Root.formatDistance).toBe("function");
    expect(typeof Root.formatDistanceToNow).toBe("function");
    expect(typeof Root.thailandBankHolidays).toBe("object");
    // v0.2.9 — Thai Fiscal, Advanced Shifts, Thai Lunar, JSON Schema, thai namespace
    expect(typeof Root.getThaiFiscalYear).toBe("function");
    expect(typeof Root.getThaiFiscalQuarter).toBe("function");
    expect(typeof Root.getThaiFiscalYearRange).toBe("function");
    expect(typeof Root.getTaxFilingDeadline).toBe("function");
    expect(typeof Root.getAllMonthlyTaxDeadlines).toBe("function");
    expect(typeof Root.calculateWorkShiftDuration).toBe("function");
    expect(typeof Root.calculateNetBusinessMinutes).toBe("function");
    expect(typeof Root.calculateSlaDeadline).toBe("function");
    expect(typeof Root.calculateOvertime).toBe("function");
    expect(typeof Root.calculateThaiOvertimePay).toBe("function");
    expect(typeof Root.getThaiLunarDate).toBe("function");
    expect(typeof Root.isWanPhra).toBe("function");
    expect(typeof Root.getWanPhraInMonth).toBe("function");
    expect(typeof Root.formatThaiLunarDate).toBe("function");
    expect(typeof Root.chroneraToJsonSchema).toBe("function");
    expect(typeof Root.thai).toBe("object");
    expect(typeof Root.thai.fiscalYear).toBe("function");
    expect(typeof Root.thai.taxDeadline).toBe("function");
    expect(typeof Root.thai.overtimePay).toBe("function");
    expect(typeof Root.thai.lunar).toBe("function");
    expect(typeof Root.thai.isWanPhra).toBe("function");
    // v0.3.0 — Thai Banking & SSO Payroll
    expect(typeof Root.adjustBusinessDate).toBe("function");
    expect(typeof Root.calculateDayCountFraction).toBe("function");
    expect(typeof Root.calculateAccruedInterest).toBe("function");
    expect(typeof Root.calculatePaymentDueDate).toBe("function");
    expect(typeof Root.getThaiSsoWageCeiling).toBe("function");
    expect(typeof Root.calculateThaiSsoContribution).toBe("function");
    expect(typeof Root.getSsoFilingDeadline).toBe("function");
    expect(typeof Root.thai.dayCountFraction).toBe("function");
    expect(typeof Root.thai.accruedInterest).toBe("function");
    expect(typeof Root.thai.paymentDueDate).toBe("function");
    expect(typeof Root.thai.ssoWageCeiling).toBe("function");
    expect(typeof Root.thai.ssoContribution).toBe("function");
    expect(typeof Root.thai.ssoDeadline).toBe("function");
    // v0.3.0 — TC39 Temporal Interop Bridge
    expect(typeof Root.temporal).toBe("object");
    expect(typeof Root.fromTemporal).toBe("function");
    expect(typeof Root.isTemporalSupported).toBe("function");
    expect(typeof Root.isTemporalObject).toBe("function");
    expect(typeof Root.toTemporalPlainDate).toBe("function");
    expect(typeof Root.toTemporalPlainTime).toBe("function");
    expect(typeof Root.toTemporalPlainDateTime).toBe("function");
    expect(typeof Root.toTemporalInstant).toBe("function");
    expect(typeof Root.toTemporalZonedDateTime).toBe("function");
    expect(typeof Root.toTemporalDuration).toBe("function");
    expect(typeof Root.fromTemporalPlainDate).toBe("function");
    expect(typeof Root.fromTemporalPlainTime).toBe("function");
    expect(typeof Root.fromTemporalPlainDateTime).toBe("function");
    expect(typeof Root.fromTemporalInstant).toBe("function");
    expect(typeof Root.fromTemporalZonedDateTime).toBe("function");
    expect(typeof Root.fromTemporalDuration).toBe("function");
  });

  it("exports calendar symbols from ./calendar", () => {
    expect(typeof Calendar.convertCalendarDate).toBe("function");
    expect(typeof Calendar.isLeapYear).toBe("function");
    expect(typeof Calendar.daysInMonth).toBe("function");
  });

  it("exports format symbols from ./format", () => {
    expect(typeof Format.formatDate).toBe("function");
    expect(typeof Format.formatTime).toBe("function");
    expect(typeof Format.formatDateTime).toBe("function");
    expect(typeof Format.formatWithPattern).toBe("function");
  });

  it("exports parse symbols from ./parse", () => {
    expect(typeof Parse.parseLocalDate).toBe("function");
    expect(typeof Parse.parseInstant).toBe("function");
    expect(typeof Parse.safeParseLocalDate).toBe("function");
    expect(typeof Parse.safeParseInstant).toBe("function");
  });

  it("exports holidays symbols from ./holidays", () => {
    expect(typeof Holidays.getHolidayCalendar).toBe("function");
    expect(typeof Holidays.resolveAnnualHolidays).toBe("function");
    expect(typeof Holidays.calculateEasterSunday).toBe("function");
    expect(typeof Holidays.thailandHolidays).toBe("object");
    expect(typeof Holidays.thailandBankHolidays).toBe("object");
    expect(typeof Holidays.japanHolidays).toBe("object");
  });

  it("exports scheduling symbols from ./scheduling", () => {
    expect(typeof Scheduling.parseCron).toBe("function");
    expect(typeof Scheduling.parseRRule).toBe("function");
    expect(typeof Scheduling.generateICS).toBe("function");
    expect(typeof Scheduling.parseICS).toBe("function");
    expect(typeof Scheduling.rangeContains).toBe("function");
    expect(typeof Scheduling.recur).toBe("function");
    expect(typeof Scheduling.financialPeriods).toBe("function");
    expect(typeof Scheduling.timeBuckets).toBe("function");
  });

  it("exports zod symbols from ./zod", async () => {
    const Zod = await import("../../dist/zod/index.js");
    expect(typeof Zod.zChronera).toBe("function");
    expect(typeof Zod.zLocalDate).toBe("function");
    expect(typeof Zod.zInstant).toBe("function");
    expect(typeof Zod.zZonedDateTime).toBe("function");
  });

  it("exports valibot symbols from ./valibot", async () => {
    const Valibot = await import("../../dist/valibot/index.js");
    expect(typeof Valibot.vChronera).toBe("function");
    expect(typeof Valibot.vLocalDate).toBe("function");
    expect(typeof Valibot.vInstant).toBe("function");
    expect(typeof Valibot.vZonedDateTime).toBe("function");
  });

  it("exports compat symbols from ./compat", async () => {
    const Compat = await import("../../dist/compat/index.js");
    expect(typeof Compat.dayjs).toBe("function");
    expect(typeof Compat.dayjsCompat).toBe("function");
    expect(typeof Compat.fromDayjs).toBe("function");
    expect(typeof Compat.fromMoment).toBe("function");
    expect(typeof Compat.convertDayjsPattern).toBe("function");
    expect(typeof Compat.formatDayjs).toBe("function");
  });

  it("exports testing symbols from ./testing", async () => {
    const Testing = await import("../../dist/testing/index.js");
    expect(typeof Testing.setSystemTime).toBe("function");
    expect(typeof Testing.restoreSystemTime).toBe("function");
    expect(typeof Testing.withMockTime).toBe("function");
    expect(typeof Testing.mockBusinessDay).toBe("function");
    expect(typeof Testing.mockHoliday).toBe("function");
  });

  it("exports standard schema symbols from ./standard", async () => {
    const Standard = await import("../../dist/standard/index.js");
    expect(typeof Standard.standardChronera).toBe("function");
    expect(typeof Standard.standardLocalDate).toBe("function");
    expect(typeof Standard.standardInstant).toBe("function");
    expect(typeof Standard.standardZonedDateTime).toBe("function");
  });

  it("exports superjson symbols from ./superjson", async () => {
    const Superjson = await import("../../dist/superjson/index.js");
    expect(typeof Superjson.registerChroneraSuperJSON).toBe("function");
    expect(typeof Superjson.chroneraSuperJSONTransformer).toBe("object");
    expect(typeof Superjson.localDateSuperJSONTransformer).toBe("object");
    expect(typeof Superjson.instantSuperJSONTransformer).toBe("object");
    expect(typeof Superjson.zonedDateTimeSuperJSONTransformer).toBe("object");
    expect(typeof Superjson.calendarDateSuperJSONTransformer).toBe("object");
  });

  it("exports drizzle symbols from ./drizzle", async () => {
    const Drizzle = await import("../../dist/drizzle/index.js");
    expect(typeof Drizzle.toSqlDate).toBe("function");
    expect(typeof Drizzle.fromSqlDate).toBe("function");
    expect(typeof Drizzle.toSqlTimestamp).toBe("function");
    expect(typeof Drizzle.fromSqlTimestamp).toBe("function");
    expect(typeof Drizzle.createChroneraDateColumn).toBe("function");
  });

  it("exports arktype symbols from ./arktype", async () => {
    const ArkType = await import("../../dist/arktype/index.js");
    expect(typeof ArkType.aChronera).toBe("function");
    expect(typeof ArkType.aLocalDate).toBe("function");
    expect(typeof ArkType.aInstant).toBe("function");
  });

  it("exports react symbols from ./react", async () => {
    const ReactExports = await import("../../dist/react/index.js");
    expect(typeof ReactExports.useNow).toBe("function");
    expect(typeof ReactExports.useTimeAgo).toBe("function");
    expect(typeof ReactExports.useCalendarGrid).toBe("function");
    expect(typeof ReactExports.useCountdown).toBe("function");
    expect(typeof ReactExports.useBusinessHours).toBe("function");
  });

  it("exports thai enterprise symbols from ./thai", async () => {
    const ThaiExports = await import("../../dist/thai/index.js");
    expect(typeof ThaiExports.thai).toBe("object");
    expect(typeof ThaiExports.getThaiFiscalYear).toBe("function");
    expect(typeof ThaiExports.getTaxFilingDeadline).toBe("function");
    expect(typeof ThaiExports.calculateThaiOvertimePay).toBe("function");
    expect(typeof ThaiExports.getThaiLunarDate).toBe("function");
    expect(typeof ThaiExports.isWanPhra).toBe("function");
  });

  it("exports temporal bridge symbols from ./temporal", async () => {
    const TemporalExports = await import("../../dist/temporal/index.js");
    expect(typeof TemporalExports.temporal).toBe("object");
    expect(typeof TemporalExports.fromTemporal).toBe("function");
    expect(typeof TemporalExports.toTemporalPlainDate).toBe("function");
    expect(typeof TemporalExports.toTemporalInstant).toBe("function");
    expect(typeof TemporalExports.toTemporalZonedDateTime).toBe("function");
    expect(typeof TemporalExports.fromTemporalPlainDate).toBe("function");
  });
});
