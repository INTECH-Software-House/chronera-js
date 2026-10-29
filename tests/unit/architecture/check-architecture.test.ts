import { describe, expect, it } from "vitest";
import {
  ADAPTER_DIRS,
  collectArchitectureViolations,
  validateModuleImports,
} from "../../../scripts/check-architecture.js";

describe("Clean Architecture 2.0 & Strict Adapter Isolation Gate (7 Rules)", () => {
  it("verifies zero architecture violations across the entire src/ codebase", async () => {
    const violations = await collectArchitectureViolations();
    expect(violations).toEqual([]);
  });

  it("Rule 1: rejects Node.js built-in imports anywhere in src/", () => {
    expect(
      validateModuleImports(
        "operations/thai-banking.ts",
        `import { readFile } from "node:fs/promises";`,
      ),
    ).toEqual([expect.stringContaining("[Rule 1: Universal Runtime]")]);

    expect(
      validateModuleImports("core/date-only.ts", `import path from "path";`),
    ).toEqual([expect.stringContaining("[Rule 1: Universal Runtime]")]);
  });

  it("Rule 2: rejects internal modules importing the root public barrel (src/index.ts)", () => {
    expect(
      validateModuleImports(
        "operations/add.ts",
        `import { chronera } from "../index.js";`,
      ),
    ).toEqual([
      expect.stringContaining("[Rule 2: No Root Barrel Back-Import]"),
    ]);
  });

  it("Rule 3: enforces 100% purity on Domain Layer (core/ and errors/)", () => {
    expect(
      validateModuleImports(
        "core/local-date.ts",
        `import { formatDate } from "../format/formatter.js";`,
      ),
    ).toEqual([expect.stringContaining("[Rule 3: Domain Purity]")]);

    expect(
      validateModuleImports(
        "errors/chronera-error.ts",
        `import { addTime } from "../operations/add.js";`,
      ),
    ).toEqual([expect.stringContaining("[Rule 3: Domain Purity]")]);

    expect(
      validateModuleImports(
        "core/instant.ts",
        `import { createLocalDate } from "./local-date.js";\nimport { createInvalidDateError } from "../errors/chronera-error.js";`,
      ),
    ).toEqual([]);
  });

  it("Rule 4: prevents Calendar Engine Layer (calendar/*) from depending on format/, parse/, operations/, or holidays/", () => {
    expect(
      validateModuleImports(
        "calendar/buddhist/converter.ts",
        `import { parseIso } from "../../parse/iso.js";`,
      ),
    ).toEqual([expect.stringContaining("[Rule 4: Calendar Engine Purity]")]);

    expect(
      validateModuleImports(
        "calendar/hijri/tabular.ts",
        `import { addDays } from "../../operations/add.js";`,
      ),
    ).toEqual([expect.stringContaining("[Rule 4: Calendar Engine Purity]")]);

    expect(
      validateModuleImports(
        "calendar/gregorian/engine.ts",
        `import { isHoliday } from "../../holidays/engine.js";`,
      ),
    ).toEqual([expect.stringContaining("[Rule 4: Calendar Engine Purity]")]);
  });

  it("Rule 5: Anti-Circular Facade Rule — blocks runtime imports of chronera.ts from core/operations/format/parse/runtime/holidays, while permitting type-only imports", () => {
    expect(
      validateModuleImports(
        "operations/thai-fiscal.ts",
        `import { Chronera } from "../chronera.js";`,
      ),
    ).toEqual([expect.stringContaining("[Rule 5: Anti-Circular Facade]")]);

    expect(
      validateModuleImports(
        "operations/thai-fiscal.ts",
        `import type { ChroneraInput } from "../chronera.js";`,
      ),
    ).toEqual([]);
  });

  it("Rule 6: Strict Adapter Isolation — blocks Core, Engine, Operations, Facade, and Feature Subpaths (thai, temporal, scheduling) from importing Ecosystem Adapters", () => {
    for (const adapter of ADAPTER_DIRS) {
      expect(
        validateModuleImports(
          "operations/temporal.ts",
          `import { something } from "../${adapter}/index.js";`,
        ),
      ).toEqual([
        expect.stringContaining("[Rule 6: Strict Adapter Isolation]"),
      ]);

      expect(
        validateModuleImports(
          "thai/index.ts",
          `export * from "../${adapter}/index.js";`,
        ),
      ).toEqual([
        expect.stringContaining("[Rule 6: Strict Adapter Isolation]"),
      ]);

      expect(
        validateModuleImports(
          "chronera.ts",
          `import { something } from "./${adapter}/index.js";`,
        ),
      ).toEqual([
        expect.stringContaining("[Rule 6: Strict Adapter Isolation]"),
      ]);
    }
  });

  it("Rule 7: Cross-Adapter Isolation — blocks any Ecosystem Adapter from importing another Ecosystem Adapter", () => {
    expect(
      validateModuleImports(
        "drizzle/index.ts",
        `import { zodChronera } from "../zod/index.js";`,
      ),
    ).toEqual([expect.stringContaining("[Rule 7: Cross-Adapter Isolation]")]);

    expect(
      validateModuleImports(
        "react/index.ts",
        `import { dayjs } from "../compat/index.js";`,
      ),
    ).toEqual([expect.stringContaining("[Rule 7: Cross-Adapter Isolation]")]);

    // Intra-adapter imports within the same adapter directory are allowed
    expect(
      validateModuleImports("compat/index.ts", `export * from "./dayjs.js";`),
    ).toEqual([]);
  });
});
