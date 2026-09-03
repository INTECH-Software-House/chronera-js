import { rm } from "node:fs/promises";

const targets = ["dist", "artifacts", ".cache", "coverage"];

for (const target of targets) {
  try {
    await rm(target, { recursive: true, force: true });
    console.log(`Cleaned ${target}`);
  } catch (err) {
    console.error(`Failed to clean ${target}:`, err);
  }
}
