import { expect, test } from "tstyche";
import type { LocalDate, SafeParseResult } from "../../dist/index.js";
import { parseLocalDate, safeParseLocalDate } from "../../dist/index.js";

test("public API return types", () => {
  expect(parseLocalDate("2026-09-02")).type.toBe<LocalDate>();
  expect(safeParseLocalDate("2026-09-02")).type.toBe<
    SafeParseResult<LocalDate>
  >();
});
