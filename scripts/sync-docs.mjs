import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

async function syncDocs() {
  const distDir = resolve("dist");
  const targetDir = resolve("docs/chronera");

  await mkdir(targetDir, { recursive: true });
  await cp(distDir, targetDir, { recursive: true });
  console.log("Synchronized dist/ to docs/chronera/ successfully.");
}

syncDocs().catch((err) => {
  console.error("Failed to sync docs:", err);
  process.exit(1);
});
