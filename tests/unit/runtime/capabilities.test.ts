import { describe, expect, it } from "vitest";
import { getRuntimeCapabilities } from "../../../src/runtime/capabilities.js";

describe("runtime capabilities", () => {
  it("detects basic platform capabilities", () => {
    const caps = getRuntimeCapabilities({
      calendars: ["gregory", "buddhist", "unknown-calendar"],
      timeZones: ["UTC", "Asia/Bangkok", "Invalid/Timezone"],
    });

    expect(caps.hasDateTimeFormat).toBe(true);
    expect(caps.calendars["gregory"]).toBe(true);
    expect(caps.calendars["unknown-calendar"]).toBe(false);
    expect(caps.timeZones["UTC"]).toBe(true);
    expect(caps.timeZones["Asia/Bangkok"]).toBe(true);
    expect(caps.timeZones["Invalid/Timezone"]).toBe(false);
  });
});
