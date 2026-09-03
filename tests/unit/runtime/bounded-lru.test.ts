import { describe, expect, it } from "vitest";
import { BoundedLRU } from "../../../src/runtime/bounded-lru.js";

describe("BoundedLRU", () => {
  it("stores and retrieves values", () => {
    const lru = new BoundedLRU<string>(3);
    lru.set("a", "1");
    lru.set("b", "2");
    expect(lru.get("a")).toBe("1");
    expect(lru.get("b")).toBe("2");
  });

  it("evicts oldest entry when capacity is exceeded", () => {
    const lru = new BoundedLRU<string>(2);
    lru.set("a", "1");
    lru.set("b", "2");
    lru.set("c", "3");

    expect(lru.has("a")).toBe(false);
    expect(lru.get("b")).toBe("2");
    expect(lru.get("c")).toBe("3");
  });

  it("refreshes key usage order on get", () => {
    const lru = new BoundedLRU<string>(2);
    lru.set("a", "1");
    lru.set("b", "2");
    // Access "a" so "b" becomes the oldest
    lru.get("a");
    lru.set("c", "3");

    expect(lru.has("b")).toBe(false);
    expect(lru.has("a")).toBe(true);
    expect(lru.has("c")).toBe(true);
  });
});
