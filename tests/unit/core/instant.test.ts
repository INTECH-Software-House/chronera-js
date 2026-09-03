import { describe, expect, it } from "vitest";
import {
  instantFromDate,
  instantFromEpochMilliseconds,
  MAX_EPOCH_MILLISECONDS,
  MIN_EPOCH_MILLISECONDS,
} from "../../../src/core/instant.js";
import { ChroneraError } from "../../../src/errors/errors.js";

describe("Instant", () => {
  it("constructs an Instant from valid epoch milliseconds", () => {
    const inst = instantFromEpochMilliseconds(1788307200000);
    expect(inst).toEqual({
      kind: "instant",
      epochMilliseconds: 1788307200000,
    });
  });

  it("accepts minimum and maximum epoch boundaries", () => {
    const min = instantFromEpochMilliseconds(MIN_EPOCH_MILLISECONDS);
    const max = instantFromEpochMilliseconds(MAX_EPOCH_MILLISECONDS);
    expect(min.epochMilliseconds).toBe(MIN_EPOCH_MILLISECONDS);
    expect(max.epochMilliseconds).toBe(MAX_EPOCH_MILLISECONDS);
  });

  it("rejects out of range epoch milliseconds", () => {
    expect(() =>
      instantFromEpochMilliseconds(MIN_EPOCH_MILLISECONDS - 1),
    ).toThrow(ChroneraError);
    expect(() =>
      instantFromEpochMilliseconds(MAX_EPOCH_MILLISECONDS + 1),
    ).toThrow(ChroneraError);
  });

  it("rejects non-integer epoch milliseconds", () => {
    expect(() => instantFromEpochMilliseconds(123.45)).toThrow(ChroneraError);
    expect(() => instantFromEpochMilliseconds(Number.NaN)).toThrow(
      ChroneraError,
    );
  });

  it("constructs from valid Date and does not mutate it", () => {
    const date = new Date("2026-09-02T06:45:00Z");
    const origTime = date.getTime();
    const inst = instantFromDate(date);
    expect(inst.epochMilliseconds).toBe(origTime);
    expect(date.getTime()).toBe(origTime);
  });

  it("rejects invalid Date", () => {
    const invalidDate = new Date("invalid date string");
    expect(() => instantFromDate(invalidDate)).toThrow(ChroneraError);
  });
});
