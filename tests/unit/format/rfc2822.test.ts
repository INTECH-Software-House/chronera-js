import { describe, expect, it } from "vitest";
import {
  formatRfc2822,
  instantFromEpochMilliseconds,
} from "../../../src/index.js";

describe("RFC 2822 / RFC 5322 HTTP & Email Date Formatter", () => {
  it("formats standard epoch instant (1970-01-01 00:00:00 GMT)", () => {
    const epoch = instantFromEpochMilliseconds(0);
    const formatted = formatRfc2822(epoch);
    expect(formatted).toBe("Thu, 01 Jan 1970 00:00:00 GMT");
  });

  it("formats target modern instant (2026-09-02 14:30:00 GMT)", () => {
    // 2026-09-02T14:30:00Z: Date.UTC(2026, 8, 2, 14, 30, 0)
    const ms = Date.UTC(2026, 8, 2, 14, 30, 0);
    const instant = instantFromEpochMilliseconds(ms);

    // Default with GMT
    const formattedGmt = formatRfc2822(instant);
    expect(formattedGmt).toBe("Wed, 02 Sep 2026 14:30:00 GMT");

    // With explicit +0000 offset
    const formattedOffset = formatRfc2822(instant, { useGmt: false });
    expect(formattedOffset).toBe("Wed, 02 Sep 2026 14:30:00 +0000");

    // Without seconds
    const formattedNoSec = formatRfc2822(instant, { includeSeconds: false });
    expect(formattedNoSec).toBe("Wed, 02 Sep 2026 14:30 GMT");
  });

  it("formats pre-epoch historical date accurately", () => {
    // 1945-05-08 23:01:00 (Victory in Europe day)
    const ms = Date.UTC(1945, 4, 8, 23, 1, 0);
    const instant = instantFromEpochMilliseconds(ms);
    const formatted = formatRfc2822(instant);
    expect(formatted).toBe("Tue, 08 May 1945 23:01:00 GMT");
  });
});
