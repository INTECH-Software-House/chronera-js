import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const SRC_DIR = join(process.cwd(), "src");

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

const IMPORT_REGEX = /(?:import|export)\s+(?:.+?\s+from\s+)?["']([^"']+)["']/g;

async function checkArchitecture(): Promise<void> {
  const files = await getFiles(SRC_DIR);
  let violations = 0;

  for (const file of files) {
    const relPath = relative(SRC_DIR, file).replace(/\\/g, "/");
    const content = await readFile(file, "utf-8");

    let match: RegExpExecArray | null;
    while ((match = IMPORT_REGEX.exec(content)) !== null) {
      const importPath = match[1]!;

      // Rule: No node built-ins in src/core, src/calendar, src/format, src/parse
      if (
        (relPath.startsWith("core/") ||
          relPath.startsWith("calendar/") ||
          relPath.startsWith("format/") ||
          relPath.startsWith("parse/")) &&
        (importPath.startsWith("node:") ||
          importPath === "fs" ||
          importPath === "path" ||
          importPath === "net" ||
          importPath === "http")
      ) {
        console.error(
          `[Architecture Violation] ${relPath} must not import Node.js built-ins (${importPath}).`,
        );
        violations++;
      }

      // Rule: Internal modules must not import the root public barrel
      if (
        relPath !== "index.ts" &&
        (importPath === "./index.js" ||
          importPath === "../index.js" ||
          importPath === "../../index.js")
      ) {
        console.error(
          `[Architecture Violation] ${relPath} must not import the root public barrel (${importPath}).`,
        );
        violations++;
      }

      // Rule: Domain (core, errors) must not import operations, format, parse, runtime
      if (relPath.startsWith("core/") || relPath.startsWith("errors/")) {
        if (
          importPath.includes("/operations/") ||
          importPath.includes("/format/") ||
          importPath.includes("/parse/") ||
          importPath.includes("/runtime/")
        ) {
          console.error(
            `[Architecture Violation] Domain module ${relPath} must not import higher-level operations or runtime (${importPath}).`,
          );
          violations++;
        }
      }

      // Rule: Calendar must not import format or parse
      if (relPath.startsWith("calendar/")) {
        if (importPath.includes("/format/") || importPath.includes("/parse/")) {
          console.error(
            `[Architecture Violation] Calendar module ${relPath} must not import format or parse (${importPath}).`,
          );
          violations++;
        }
      }
    }
  }

  if (violations > 0) {
    console.error(`Architecture check failed with ${violations} violation(s).`);
    process.exit(1);
  } else {
    console.log("Architecture rules verified: zero violations.");
  }
}

await checkArchitecture();
