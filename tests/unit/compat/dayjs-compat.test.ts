import { describe, expect, it } from "vitest";
import {
  dayjs,
  dayjsCompat,
  DayjsCompat,
  fromDayjs,
  fromMoment,
  toDayjs,
  toMoment,
  chroneraDayjsPlugin,
} from "../../../src/compat/index.js";
import { chronera, Chronera } from "../../../src/chronera.js";

describe("Day.js & Moment Compatibility Engine", () => {
  it("creates a DayjsCompat instance and formats with Day.js syntax", () => {
    const d = dayjs("2026-10-13T09:30:00Z");
    expect(d.format("YYYY-MM-DD")).toBe("2026-10-13");
    expect(d.format("DD/MM/YYYY [at] HH:mm")).toBe("13/10/2026 at 09:30");
  });

  it("supports arithmetic operations: add and subtract", () => {
    const d = dayjs("2026-10-13T00:00:00Z");
    expect(d.add(3, "day").format("YYYY-MM-DD")).toBe("2026-10-16");
    expect(d.subtract(2, "days").format("YYYY-MM-DD")).toBe("2026-10-11");
    expect(d.add(1, "month").format("YYYY-MM-DD")).toBe("2026-11-13");
    expect(d.add(1, "year").format("YYYY-MM-DD")).toBe("2027-10-13");
    expect(d.add(2, "hours").toDate().getUTCHours()).toBe(2);
  });

  it("supports startOf and endOf boundaries", () => {
    const d = dayjs("2026-10-13T14:35:22.500Z");
    const startM = d.startOf("month");
    expect(startM.date()).toBe(1);
    expect(startM.hour()).toBe(0);

    const endM = d.endOf("month");
    expect(endM.date()).toBe(31);
    expect(endM.hour()).toBe(23);
  });

  it("supports comparison methods: isSame, isBefore, isAfter, isBetween", () => {
    const a = dayjs("2026-10-10");
    const b = dayjs("2026-10-15");
    const c = dayjs("2026-10-20");

    expect(a.isBefore(b)).toBe(true);
    expect(c.isAfter(b)).toBe(true);
    expect(b.isSame("2026-10-15", "day")).toBe(true);
    expect(b.isBetween(a, c)).toBe(true);
    expect(a.isBetween(b, c)).toBe(false);
  });

  it("supports diff calculation", () => {
    const a = dayjs("2026-10-20");
    const b = dayjs("2026-10-10");
    expect(a.diff(b, "day")).toBe(10);
    expect(b.diff(a, "day")).toBe(-10);
  });

  it("supports getters and setters: year, month (0-indexed), date", () => {
    const d = dayjs("2026-10-13");
    expect(d.year()).toBe(2026);
    expect(d.month()).toBe(9); // October is month index 9 in Day.js
    expect(d.date()).toBe(13);

    const modified = d.month(11); // Set to December
    expect(modified.month()).toBe(11);
  });

  it("supports conversion helpers fromMoment, toDayjs, toMoment and dayjsCompat alias", () => {
    expect(dayjsCompat).toBe(dayjs);
    const d = new DayjsCompat("2026-10-13");
    expect(d.format("YYYY-MM-DD")).toBe("2026-10-13");

    const momentLike = { toDate: () => new Date("2026-10-13") };
    expect(fromMoment(momentLike).format("yyyy-MM-dd")).toBe("2026-10-13");

    const dayjsResult = toDayjs(d, (jsDate) => jsDate.toISOString());
    expect(dayjsResult).toBe("2026-10-13T00:00:00.000Z");

    const momentResult = toMoment(d, (jsDate) => jsDate.toISOString());
    expect(momentResult).toBe("2026-10-13T00:00:00.000Z");
  });

  it("converts to and from Chronera seamlessly", () => {
    const d = dayjs("2026-10-13");
    const c = d.toChronera();
    expect(c instanceof Chronera).toBe(true);
    expect(c.format("yyyy-MM-dd")).toBe("2026-10-13");

    const backToDay = fromDayjs(d);
    expect(backToDay instanceof Chronera).toBe(true);
  });

  it("supports universal duck typing: chronera(dayjsObject) works natively", () => {
    const dayjsLike = {
      toDate: () => new Date("2026-10-13T10:00:00Z"),
    };
    const c1 = chronera(dayjsLike);
    expect(c1.format("yyyy-MM-dd")).toBe("2026-10-13");

    const momentLike = {
      valueOf: () => 1791885600000,
    };
    const c2 = chronera(momentLike);
    expect(c2.toInstant().epochMilliseconds).toBe(1791885600000);
  });

  it("supports Day.js plugin installation", () => {
    class MockDayjs {
      readonly date: Date;
      constructor(d: Date) {
        this.date = d;
      }
      toDate() {
        return this.date;
      }
    }
    chroneraDayjsPlugin(
      null,
      MockDayjs as unknown as { prototype: Record<string, unknown> },
    );

    const inst = new MockDayjs(new Date("2026-10-13")) as unknown as {
      toChronera: () => Chronera;
    };
    expect(typeof inst.toChronera).toBe("function");
    const c = inst.toChronera();
    expect(c.format("yyyy-MM-dd")).toBe("2026-10-13");
  });
});
