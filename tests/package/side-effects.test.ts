import { describe, it, expect } from "vitest";

describe("side effects", () => {
  it("importing root does not mutate global prototypes or globals", async () => {
    const origDateProtoKeys = Object.getOwnPropertyNames(Date.prototype);
    const origIntlKeys = Object.getOwnPropertyNames(Intl);

    await import("../../dist/index.js");

    const newDateProtoKeys = Object.getOwnPropertyNames(Date.prototype);
    const newIntlKeys = Object.getOwnPropertyNames(Intl);

    expect(newDateProtoKeys).toEqual(origDateProtoKeys);
    expect(newIntlKeys).toEqual(origIntlKeys);
  });
});
