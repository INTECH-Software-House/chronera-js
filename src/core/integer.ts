import { ChroneraError } from "../errors/errors.js";

export function requireInteger(
  name: string,
  value: unknown,
): asserts value is number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      `Expected ${name} to be a safe integer; received ${String(value)}.`,
    );
  }
}
