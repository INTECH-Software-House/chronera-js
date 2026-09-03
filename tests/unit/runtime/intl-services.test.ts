import { describe, expect, it } from "vitest";
import { IntlDateTimeService } from "../../../src/runtime/intl-date-time.js";
import { IntlNumberService } from "../../../src/runtime/intl-number.js";
import { IntlRelativeTimeService } from "../../../src/runtime/intl-relative-time.js";

describe("runtime Intl services with LRU caching", () => {
  it("IntlDateTimeService caches and clears formatters", () => {
    const service = new IntlDateTimeService(4);
    const f1 = service.getFormatter("en-US", { dateStyle: "short" });
    const f2 = service.getFormatter("en-US", { dateStyle: "short" });
    expect(f1).toBe(f2);

    service.clearCache();
    const f3 = service.getFormatter("en-US", { dateStyle: "short" });
    expect(f3).not.toBe(f1);
  });

  it("IntlNumberService caches and formats numbers", () => {
    const service = new IntlNumberService(4);
    const nf1 = service.getFormatter("en-US");
    const nf2 = service.getFormatter("en-US");
    expect(nf1).toBe(nf2);
    expect(nf1.format(1234.5)).toBe("1,234.5");
  });

  it("IntlRelativeTimeService caches and formats relative time", () => {
    const service = new IntlRelativeTimeService(4);
    const rtf1 = service.getFormatter("en-US", { numeric: "auto" });
    const rtf2 = service.getFormatter("en-US", { numeric: "auto" });
    expect(rtf1).toBe(rtf2);
    expect(rtf1.format(1, "day")).toBe("tomorrow");
  });
});
