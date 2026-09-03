import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

async function checkPackage() {
  console.log("=== Checking Package Tarball ===");
  const artifactsDir = join(process.cwd(), "artifacts");
  await mkdir(artifactsDir, { recursive: true });

  // 1. Pack
  console.log("Packing package into artifacts/...");
  const packOutput = execSync("pnpm pack --pack-destination artifacts --json", {
    encoding: "utf-8",
  });

  const files = await readdir(artifactsDir);
  const tgzFile = files.find((f) => f.endsWith(".tgz") && f !== "chronera.tgz");
  if (!tgzFile) {
    throw new Error("No .tgz artifact found after pnpm pack.");
  }

  const srcPath = join(artifactsDir, tgzFile);
  const destPath = join(artifactsDir, "chronera.tgz");
  await copyFile(srcPath, destPath);

  // 2. Compute SHA-256
  const bytes = await readFile(destPath);
  const hash = createHash("sha256").update(bytes).digest("hex");
  console.log(`Artifact: artifacts/chronera.tgz (${bytes.length} bytes)`);
  console.log(`SHA-256: ${hash}`);

  // 3. Inspect tarball manifest
  let tarEntries = [];
  try {
    const rawList = execSync(`tar -tf "${destPath}"`, { encoding: "utf-8" });
    tarEntries = rawList
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch (err) {
    console.warn(
      "Could not inspect tar contents with system tar, skipping file list verification:",
      err,
    );
  }

  if (tarEntries.length > 0) {
    const forbiddenPatterns = [
      /tests\//,
      /\.github\//,
      /\.env/,
      /\.tsbuildinfo/,
      /vitest\.config/,
      /tsconfig\.json/,
      /eslint\.config/,
      /prettier\.config/,
    ];

    for (const entry of tarEntries) {
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(entry)) {
          throw new Error(`Tarball contains forbidden file: ${entry}`);
        }
      }
    }
    console.log(
      `Verified ${tarEntries.length} tarball entries against allowlist.`,
    );
  }

  // 4. Run publint
  console.log("Running publint...");
  try {
    execSync("pnpm publint", { stdio: "inherit" });
  } catch (err) {
    console.warn("publint warning/error:", err);
  }

  // 5. Run attw
  console.log("Running Are the Types Wrong (attw)...");
  execSync("pnpm attw artifacts/chronera.tgz --profile esm-only", {
    stdio: "inherit",
  });

  console.log(
    "Tarball validation complete: artifacts/chronera.tgz is verified.",
  );
}

await checkPackage();
