import { readdir, readFile } from "node:fs/promises";
import { dirname, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SRC_DIR = join(process.cwd(), "src");

const NODE_BUILTINS = new Set([
  "fs",
  "path",
  "net",
  "http",
  "https",
  "crypto",
  "os",
  "child_process",
  "stream",
  "zlib",
  "url",
  "util",
  "events",
  "buffer",
  "timers",
]);

export const ADAPTER_DIRS = [
  "arktype",
  "compat",
  "drizzle",
  "react",
  "standard",
  "superjson",
  "testing",
  "valibot",
  "zod",
] as const;

export const CORE_AND_ENGINE_DIRS = [
  "core",
  "errors",
  "internal",
  "locale",
  "calendar",
  "format",
  "parse",
  "runtime",
  "holidays",
  "operations",
] as const;

export const FEATURE_SUBPATH_DIRS = ["scheduling", "thai", "temporal"] as const;

async function getFiles(dir: string): Promise<string[]> {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const dirent of dirents) {
    const res = join(dir, dirent.name);
    if (dirent.isDirectory()) {
      files.push(...(await getFiles(res)));
    } else if (res.endsWith(".ts")) {
      files.push(res);
    }
  }
  return files;
}

const STATEMENT_REGEX =
  /(?:import|export)\s+(type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;

function resolveRelativeTarget(
  fromRelPath: string,
  importSpec: string,
): string {
  if (!importSpec.startsWith(".")) {
    return importSpec;
  }
  const fromDir = dirname(fromRelPath);
  const resolved = normalize(join(fromDir, importSpec)).replace(/\\/g, "/");
  return resolved;
}

/**
 * Validates a single source file (relative to `src/`) against all 7 Clean Architecture 2.0 rules.
 * Returns an array of human-readable violation strings (empty if valid).
 */
export function validateModuleImports(
  relPath: string,
  content: string,
): string[] {
  const normalizedRelPath = relPath.replace(/\\/g, "/");
  const topDir = normalizedRelPath.includes("/")
    ? normalizedRelPath.split("/")[0]!
    : "";
  const violations: string[] = [];

  STATEMENT_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = STATEMENT_REGEX.exec(content)) !== null) {
    const isTypeOnly = Boolean(match[1]);
    const importPath = match[2]!;
    const resolvedTarget = resolveRelativeTarget(normalizedRelPath, importPath);
    const targetTopDir = resolvedTarget.includes("/")
      ? resolvedTarget.split("/")[0]!
      : "";

    // Rule 1: Universal Runtime — No Node.js built-ins anywhere in src/
    const bareBuiltin = importPath.startsWith("node:")
      ? importPath.slice(5).split("/")[0]!
      : importPath.split("/")[0]!;
    if (importPath.startsWith("node:") || NODE_BUILTINS.has(bareBuiltin)) {
      violations.push(
        `[Rule 1: Universal Runtime] ${normalizedRelPath} must not import Node.js built-ins (${importPath}).`,
      );
    }

    // Rule 2: Internal modules must not import the root public barrel
    if (
      normalizedRelPath !== "index.ts" &&
      (resolvedTarget === "index.js" || resolvedTarget === "index.ts")
    ) {
      violations.push(
        `[Rule 2: No Root Barrel Back-Import] ${normalizedRelPath} must not import the root public barrel (${importPath}).`,
      );
    }

    // Rule 3: Domain (core, errors) purity
    if (topDir === "core" || topDir === "errors") {
      if (
        targetTopDir === "calendar" ||
        targetTopDir === "operations" ||
        targetTopDir === "format" ||
        targetTopDir === "parse" ||
        targetTopDir === "runtime" ||
        targetTopDir === "holidays" ||
        resolvedTarget === "chronera.js" ||
        resolvedTarget === "create-chronera.js" ||
        (FEATURE_SUBPATH_DIRS as readonly string[]).includes(targetTopDir) ||
        (ADAPTER_DIRS as readonly string[]).includes(targetTopDir)
      ) {
        violations.push(
          `[Rule 3: Domain Purity] Domain module ${normalizedRelPath} must not import higher-level module (${importPath}).`,
        );
      }
    }

    // Rule 4: Calendar module purity
    if (topDir === "calendar") {
      if (
        targetTopDir === "format" ||
        targetTopDir === "parse" ||
        targetTopDir === "holidays" ||
        (normalizedRelPath !== "calendar/index.ts" &&
          targetTopDir === "operations")
      ) {
        violations.push(
          `[Rule 4: Calendar Engine Purity] Calendar module ${normalizedRelPath} must not import ${targetTopDir} (${importPath}).`,
        );
      }
    }

    // Rule 5: Anti-Circular Facade Rule — Lower layers must never value-import the top-level fluent facade
    if (
      (CORE_AND_ENGINE_DIRS as readonly string[]).includes(topDir) &&
      !isTypeOnly &&
      (resolvedTarget === "chronera.js" ||
        resolvedTarget === "create-chronera.js")
    ) {
      violations.push(
        `[Rule 5: Anti-Circular Facade] Engine/Operations module ${normalizedRelPath} must not value-import top-level facade (${importPath}). Use type-only import or domain primitives.`,
      );
    }

    // Rule 6: Strict Adapter Isolation Gate — Core/Operations/Subpaths/Facade must never import Ecosystem Adapters
    const isCoreOrSubpathOrFacade =
      (CORE_AND_ENGINE_DIRS as readonly string[]).includes(topDir) ||
      (FEATURE_SUBPATH_DIRS as readonly string[]).includes(topDir) ||
      normalizedRelPath === "chronera.ts" ||
      normalizedRelPath === "create-chronera.ts";

    if (
      isCoreOrSubpathOrFacade &&
      (ADAPTER_DIRS as readonly string[]).includes(targetTopDir)
    ) {
      violations.push(
        `[Rule 6: Strict Adapter Isolation] Core/Engine/Subpath module ${normalizedRelPath} must not import from Adapter layer '${targetTopDir}' (${importPath}).`,
      );
    }

    // Rule 7: Cross-Adapter Isolation Gate — Adapters must never import other Adapters
    if (
      (ADAPTER_DIRS as readonly string[]).includes(topDir) &&
      (ADAPTER_DIRS as readonly string[]).includes(targetTopDir) &&
      topDir !== targetTopDir
    ) {
      violations.push(
        `[Rule 7: Cross-Adapter Isolation] Adapter '${topDir}' (${normalizedRelPath}) must not import from sibling Adapter '${targetTopDir}' (${importPath}).`,
      );
    }
  }

  return violations;
}

export async function collectArchitectureViolations(
  srcDir: string = SRC_DIR,
): Promise<string[]> {
  const files = await getFiles(srcDir);
  const allViolations: string[] = [];

  for (const file of files) {
    const relPath = relative(srcDir, file).replace(/\\/g, "/");
    const content = await readFile(file, "utf-8");
    allViolations.push(...validateModuleImports(relPath, content));
  }

  return allViolations;
}

export async function checkArchitecture(): Promise<void> {
  const violations = await collectArchitectureViolations(SRC_DIR);

  if (violations.length > 0) {
    for (const v of violations) {
      console.error(`[Architecture Violation] ${v}`);
    }
    console.error(
      `Architecture check failed with ${violations.length} violation(s).`,
    );
    process.exit(1);
  } else {
    console.log(
      "Architecture rules verified (Clean Architecture 2.0 + Strict Adapter Isolation): zero violations.",
    );
  }
}

const isMain =
  process.argv[1] !== undefined &&
  normalize(fileURLToPath(import.meta.url)) === normalize(process.argv[1]);

if (isMain) {
  await checkArchitecture();
}
