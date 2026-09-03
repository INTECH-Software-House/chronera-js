import { describe, expect, it } from "vitest";
import {
  ChroneraError,
  ChroneraParseError,
  ChroneraRangeError,
  ChroneraUnsupportedError,
} from "../../../src/errors/errors.js";

describe("errors", () => {
  it("creates ChroneraError with code and details", () => {
    const err = new ChroneraError("CHRONERA_INVALID_DATE", "Test message", {
      field: "day",
    });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ChroneraError);
    expect(err.name).toBe("ChroneraError");
    expect(err.code).toBe("CHRONERA_INVALID_DATE");
    expect(err.message).toBe("Test message");
    expect(err.details).toEqual({ field: "day" });
  });

  it("subclasses inherit ChroneraError", () => {
    const pErr = new ChroneraParseError(
      "CHRONERA_PARSE_FAILED",
      "Parse failed",
    );
    expect(pErr).toBeInstanceOf(ChroneraError);
    expect(pErr.name).toBe("ChroneraParseError");

    const rErr = new ChroneraRangeError(
      "CHRONERA_OUT_OF_RANGE",
      "Out of range",
    );
    expect(rErr).toBeInstanceOf(ChroneraError);

    const uErr = new ChroneraUnsupportedError(
      "CHRONERA_UNSUPPORTED_OPERATION",
      "Unsupported",
    );
    expect(uErr).toBeInstanceOf(ChroneraError);
  });
});
