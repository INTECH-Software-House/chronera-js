import { bench, describe } from "vitest";
import { localDate } from "../src/core/local-date.js";
import { instantFromEpochMilliseconds } from "../src/core/instant.js";
import { addDays } from "../src/operations/convenience.js";
import { addBusinessDays } from "../src/operations/business-days.js";
import { parseLocalDate } from "../src/parse/parse-local-date.js";
import { formatDate } from "../src/format/format-date.js";
import { convertCalendarDate } from "../src/operations/convert-calendar-date.js";
import { chronera } from "../src/chronera.js";
import type { CalendarDate } from "../src/public-types.js";

describe("1. Instantiation Benchmark", () => {
  bench("Chronera: localDate()", () => {
    localDate(2026, 9, 27);
  });

  bench("Native: new Date(year, month, day)", () => {
    new Date(2026, 8, 27);
  });

  bench("Chronera: instantFromEpochMilliseconds()", () => {
    instantFromEpochMilliseconds(1788640000000);
  });

  bench("Native: new Date(timestamp)", () => {
    new Date(1788640000000);
  });
});

describe("2. Parsing Benchmark", () => {
  const isoStr = "2026-09-27";

  bench("Chronera: parseLocalDate(iso)", () => {
    parseLocalDate(isoStr);
  });

  bench("Native: new Date(iso)", () => {
    new Date(isoStr);
  });
});

describe("3. Arithmetic Benchmark", () => {
  const ld = localDate(2026, 9, 27);
  const nativeDate = new Date(2026, 8, 27);

  bench("Chronera: addDays(14)", () => {
    addDays(ld, 14);
  });

  bench("Native: setDate(+14) copy", () => {
    const copy = new Date(nativeDate.getTime());
    copy.setDate(copy.getDate() + 14);
  });

  bench("Chronera: addBusinessDays(10, 'TH')", () => {
    addBusinessDays(ld, 10, { holidays: "TH" });
  });
});

describe("4. Calendar Conversion Benchmark", () => {
  const calDate: CalendarDate = {
    kind: "calendar-date",
    calendar: "gregory",
    year: 2026,
    monthCode: "M09",
    month: 9,
    day: 27,
  };

  bench("Chronera: convert to Thai Buddhist", () => {
    convertCalendarDate(calDate, "buddhist");
  });
});

describe("5. Formatting Benchmark", () => {
  const ld = localDate(2026, 9, 27);
  const nativeDate = new Date(2026, 8, 27);
  const intl = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

  bench("Chronera: formatDate() with style", () => {
    formatDate(ld, { locale: "en-US", style: "long" });
  });

  bench("Native: Intl.DateTimeFormat.format()", () => {
    intl.format(nativeDate);
  });
});

describe("6. Fluent Ergonomics Benchmark", () => {
  bench("Chronera: chronera().addDays(5).addMonths(1).toString()", () => {
    chronera("2026-09-27").addDays(5).addMonths(1).toString();
  });
});
