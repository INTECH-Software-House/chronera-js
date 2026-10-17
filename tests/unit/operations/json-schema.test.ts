import { describe, expect, it } from "vitest";
import { chroneraToJsonSchema } from "../../../src/operations/json-schema.js";

describe("JSON Schema & OpenAPI Generator", () => {
  it("generates date format schema", () => {
    const schema = chroneraToJsonSchema("date", { title: "BirthDate" });
    expect(schema.type).toBe("string");
    expect(schema.format).toBe("date");
    expect(schema.title).toBe("BirthDate");
    expect(schema.pattern).toBe("^\\d{4}-\\d{2}-\\d{2}$");
  });

  it("generates date-time format schema", () => {
    const schema = chroneraToJsonSchema("date-time");
    expect(schema.type).toBe("string");
    expect(schema.format).toBe("date-time");
  });

  it("generates time format schema", () => {
    const schema = chroneraToJsonSchema("time");
    expect(schema.type).toBe("string");
    expect(schema.format).toBe("time");
  });

  it("generates duration format schema", () => {
    const schema = chroneraToJsonSchema("duration");
    expect(schema.type).toBe("string");
    expect(schema.format).toBe("duration");
  });
});
