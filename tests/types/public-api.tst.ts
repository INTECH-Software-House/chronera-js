import { expect, test } from "tstyche";
import type { LocalDate, SafeParseResult } from "../../dist/index.js";
import { parseLocalDate, safeParseLocalDate } from "../../dist/index.js";
import {
  thai,
  type AccruedInterestResult,
  type ThaiSsoContributionResult,
  type ThaiSeverancePayResult,
} from "../../dist/thai/index.js";
import {
  temporal,
  type TemporalPlainDateLike,
} from "../../dist/temporal/index.js";

test("public API return types", () => {
  expect(parseLocalDate("2026-09-02")).type.toBe<LocalDate>();
  expect(safeParseLocalDate("2026-09-02")).type.toBe<
    SafeParseResult<LocalDate>
  >();
  expect(
    thai.accruedInterest({
      principal: 1_000_000,
      annualRate: 0.035,
      startDate: "2026-01-01",
      endDate: "2026-04-01",
    }),
  ).type.toBe<AccruedInterestResult>();
  expect(
    thai.ssoContribution({ salary: 25_000, date: "2026-03-01" }),
  ).type.toBe<ThaiSsoContributionResult>();
  expect(
    thai.severancePay({
      hireDate: "2015-01-01",
      terminationDate: "2026-06-30",
      monthlySalary: 45_000,
    }),
  ).type.toBe<ThaiSeverancePayResult>();
  expect(temporal.toPlainDate("2026-10-18")).type.toBe<TemporalPlainDateLike>();
});
