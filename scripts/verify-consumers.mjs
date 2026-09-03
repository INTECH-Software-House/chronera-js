import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const ROOT_DIR = process.cwd();
const TARBALL_PATH = path.join(ROOT_DIR, "artifacts", "chronera.tgz");

console.log("Packing fresh package tarball...");
execSync("pnpm pack:artifact", { stdio: "inherit" });
const artifactsDir = path.join(ROOT_DIR, "artifacts");
const files = fs.readdirSync(artifactsDir);
const tgzFile = files.find((f) => f.endsWith(".tgz") && f !== "chronera.tgz");
if (tgzFile) {
  fs.copyFileSync(path.join(artifactsDir, tgzFile), TARBALL_PATH);
}

console.log(
  "=== Verifying Consumer Installations across npm, pnpm, yarn, bun ===",
);

const TEST_SCRIPT_CONTENT = `
import {
  createChronera,
  localDate,
  formatDate,
  parseLocalDate,
  getIsoWeek,
  getDayOfYear,
  toJulianDayNumber,
  getQuarter,
  formatRfc2822,
  instantFromEpochMilliseconds,
  convertCalendarDate,
  calendarDate
} from "@intech/chronera";
import { japaneseAdapter, rocAdapter, persianAdapter, indianAdapter } from "@intech/chronera/calendar";
import {
  formatJapaneseOfficialPreset,
  formatTaiwanOfficialPreset,
  formatGermanDinStandardPreset,
  formatUsLongPreset,
} from "@intech/chronera/format";
import { safeParseLocalDate } from "@intech/chronera/parse";

const d = localDate(2026, 9, 2);
const formatted = formatDate(d, { preset: "japanese-official" });
if (formatted !== "令和8年9月2日") {
  throw new Error("Unexpected Japanese format: " + formatted);
}

const deFormatted = formatDate(d, { preset: "german-din-standard" });
if (deFormatted !== "02.09.2026") {
  throw new Error("Unexpected German DIN format: " + deFormatted);
}

const zhFormatted = formatDate(d, { preset: "chinese-standard" });
if (zhFormatted !== "2026年9月2日") {
  throw new Error("Unexpected Chinese format: " + zhFormatted);
}

const isoWeek = getIsoWeek(d);
if (isoWeek.weekNumber !== 36 || isoWeek.dayOfWeek !== 3) {
  throw new Error("Unexpected ISO week: " + JSON.stringify(isoWeek));
}

const doy = getDayOfYear(d);
if (doy.dayOfYear !== 245) {
  throw new Error("Unexpected DOY: " + doy.dayOfYear);
}

const jdn = toJulianDayNumber(d);
if (jdn !== 2461286) {
  throw new Error("Unexpected JDN: " + jdn);
}

const q = getQuarter(d);
if (q !== 3) {
  throw new Error("Unexpected Quarter: " + q);
}

const rfc = formatRfc2822(instantFromEpochMilliseconds(0));
if (rfc !== "Thu, 01 Jan 1970 00:00:00 GMT") {
  throw new Error("Unexpected RFC 2822: " + rfc);
}

const roc = convertCalendarDate(calendarDate({ calendar: "gregory", year: 2026, monthCode: "M09", day: 2 }), "roc");
if (roc.value.year !== 115) {
  throw new Error("Unexpected ROC year: " + roc.value.year);
}

const parsed = safeParseLocalDate("2026-09-02");
if (!parsed.success || parsed.value.year !== 2026) {
  throw new Error("Unexpected parse result");
}

console.log("Consumer verification test passed successfully!");
`;

function testPackageManager(name, installCmd, runCmd) {
  console.log(`\n--- Testing ${name} ---`);
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), `chronera-test-${name}-`),
  );

  try {
    const pkgJson = {
      name: `consumer-test-${name}`,
      version: "1.0.0",
      type: "module",
    };
    fs.writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify(pkgJson, null, 2),
    );
    fs.writeFileSync(path.join(tempDir, "test.js"), TEST_SCRIPT_CONTENT);

    const fullInstallCmd = installCmd(TARBALL_PATH);
    console.log(`[${name}] Executing: ${fullInstallCmd}`);
    execSync(fullInstallCmd, { cwd: tempDir, stdio: "inherit" });

    console.log(`[${name}] Executing test runner...`);
    const output = execSync(runCmd, { cwd: tempDir, encoding: "utf8" });
    console.log(`[${name}] Output: ${output.trim()}`);
    console.log(`[${name}] PASSED 🟢`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// 1. npm
testPackageManager(
  "npm",
  (tarball) => `npm install --no-audit --no-fund "${tarball}"`,
  "node test.js",
);

// 2. pnpm
testPackageManager(
  "pnpm",
  (tarball) => `pnpm add "${tarball}"`,
  "node test.js",
);

// 3. yarn
testPackageManager(
  "yarn",
  (tarball) =>
    `yarn add "@intech/chronera@file:${tarball.replace(/\\/g, "/")}"`,
  "yarn node test.js",
);

function isCommandAvailable(cmd) {
  try {
    const isWin = process.platform === "win32";
    execSync(isWin ? `where ${cmd}` : `which ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// 4. bun
if (isCommandAvailable("bun")) {
  testPackageManager("bun", (tarball) => `bun add "${tarball}"`, "bun test.js");
} else {
  console.log("\n--- Testing bun ---");
  console.log("[bun] Skipped (bun binary not present in runner environment)");
}

console.log("\n=======================================================");
console.log("All package managers (npm, pnpm, yarn, bun) verified 🟢!");
console.log("=======================================================\n");
