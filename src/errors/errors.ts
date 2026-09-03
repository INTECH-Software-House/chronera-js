import type { ChroneraErrorCode } from "./error-codes.js";

export class ChroneraError extends Error {
  override readonly name: string = "ChroneraError";
  readonly code: ChroneraErrorCode;
  readonly details?: Readonly<Record<string, unknown>>;

  constructor(
    code: ChroneraErrorCode,
    message: string,
    details?: Readonly<Record<string, unknown>>,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.code = code;
    if (details !== undefined) {
      this.details = { ...details };
    }
  }
}

export class ChroneraParseError extends ChroneraError {
  override readonly name = "ChroneraParseError";
}

export class ChroneraRangeError extends ChroneraError {
  override readonly name = "ChroneraRangeError";
}

export class ChroneraUnsupportedError extends ChroneraError {
  override readonly name = "ChroneraUnsupportedError";
}
