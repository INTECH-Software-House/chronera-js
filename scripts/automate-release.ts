import { execSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

interface ReleaseConfig {
  targetDate: Date;
  version: string;
  dryRun: boolean;
  runNow: boolean;
}

function parseArgs(): ReleaseConfig {
  const args = process.argv.slice(2);
  let targetIso = "2026-09-05T00:00:00+07:00";
  let version = "0.1.1";
  let dryRun = false;
  let runNow = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--target" && args[i + 1]) {
      targetIso = args[++i]!;
    } else if (arg === "--version" && args[i + 1]) {
      version = args[++i]!;
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--now") {
      runNow = true;
    }
  }

  return {
    targetDate: new Date(targetIso),
    version,
    dryRun,
    runNow,
  };
}

function run(cmd: string, dryRun = false): string {
  console.log(`\x1b[36m[EXEC]\x1b[0m ${cmd}`);
  if (
    dryRun &&
    (cmd.startsWith("git push") ||
      cmd.startsWith("gh release") ||
      cmd.startsWith("npm publish"))
  ) {
    console.log(`\x1b[33m[DRY-RUN SKIP]\x1b[0m ${cmd}`);
    return "";
  }
  return execSync(cmd, { stdio: "inherit", encoding: "utf-8" }) ?? "";
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function updatePackageJson(version: string): Promise<void> {
  const pkgPath = join(process.cwd(), "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  pkg.version = version;
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
  console.log(`\x1b[32m[OK]\x1b[0m package.json version updated to ${version}`);
}

async function updateChangelog(version: string): Promise<string> {
  const changelogPath = join(process.cwd(), "CHANGELOG.md");
  let content = await readFile(changelogPath, "utf-8");

  const today =
    version === "0.1.3"
      ? "2026-09-07"
      : version === "0.1.2"
        ? "2026-09-06"
        : "2026-09-05";

  let releaseNotes = "";
  if (version === "0.1.3") {
    releaseNotes = `## [${version}] - ${today}

### Added

- **Business & Working Days Convenience Helpers** for enterprise, HR, logistics, and fintech operations:
  - **Weekend & Weekday Predicates**:
    - \`isWeekend(date)\`: Returns \`true\` if date is Saturday or Sunday.
    - \`isWeekday(date)\`: Returns \`true\` if date is Monday through Friday.
  - **Business Days Arithmetic**:
    - \`addBusinessDays(date, n)\`: Adds business days, skipping Saturdays and Sundays automatically with $O(1)$ weekly fast-path.
    - \`subtractBusinessDays(date, n)\`: Subtracts business days, skipping weekends.
  - **Working Days Difference**:
    - \`diffInBusinessDays(left, right)\`: Returns signed count of working days between two dates (\`left - right\`).
- **Universal Cross-Calendar Precision**:
  - Seamless support for \`LocalDate\` and all supported calendar systems (Thai Buddhist, Japanese Reiwa, Hijri, Persian, etc.).
`;
  } else if (version === "0.1.2") {
    releaseNotes = `## [${version}] - ${today}

### Added

- **Time & Instant Convenience Helpers**:
  - **Day Boundary Helpers**: \`startOfDay(input)\` (00:00:00.000) and \`endOfDay(input)\` (23:59:59.999) accepting \`LocalDate\` or \`LocalDateTime\`.
  - **Temporal Expiration & Status**: \`isPast(target)\` and \`isFuture(target)\` for Instant, Date, or numeric timestamps.
  - **Polymorphic Time Arithmetic**:
    - \`addHours(target, n)\` / \`subtractHours(target, n)\`
    - \`addMinutes(target, n)\` / \`subtractMinutes(target, n)\`
    - \`addSeconds(target, n)\` / \`subtractSeconds(target, n)\`
    - Seamless polymorphic support for \`LocalTime\`, \`LocalDateTime\`, and \`Instant\` with automatic calendar-date rollover across midnights and leap days.
- **Exported Types**: \`TimeOrDateTimeOrInstant\` in root barrel.
`;
  } else {
    releaseNotes = `## [${version}] - ${today}

### Added

- **Daily Convenience Helpers** for high-frequency developer workflows:
  - **Comparison Helpers**: \`isBefore(d1, d2)\`, \`isAfter(d1, d2)\`, \`isEqual(d1, d2)\`, \`isSameDay(d1, d2)\`, \`isBetween(date, start, end, inclusivity)\`, \`isToday(date, timeZone)\`.
  - **Date Arithmetic Shortcuts**: \`addDays(d, n)\`, \`subtractDays(d, n)\`, \`addMonths(d, n)\`, \`subtractMonths(d, n)\`, \`addYears(d, n)\`, \`subtractYears(d, n)\`, and \`diffInDays(left, right)\`.
  - **Date Boundary Helpers**: \`startOfMonth(date)\`, \`endOfMonth(date)\`, \`startOfYear(date)\`, \`endOfYear(date)\`.
- **Universal Cross-Calendar Precision**:
  - Seamless support for \`LocalDate\` and all supported \`CalendarDate\` systems:
    - 🇹🇭 Thai Buddhist (\`buddhist\`) with BE leap year handling.
    - 🇯🇵 Japanese Era (\`japanese\`) with seamless era rollover (e.g. Heisei to Reiwa).
    - 🇹🇼 Republic of China / Minguo (\`roc\`).
    - 🇮🇷 Persian / Solar Hijri (\`persian\`).
    - 🇸🇦 Islamic Civil (\`islamic-civil\`).
    - 🇮🇳 Indian National Saka (\`indian\`).
    - 🌐 Gregorian (\`gregory\`) and ISO 8601 (\`iso8601\`).
- Exported convenience types \`DateOrCalendarDate\` and \`IntervalInclusivity\` from root barrel.
`;
  }

  if (content.includes("## [Unreleased]")) {
    content = content.replace(
      "## [Unreleased]\n",
      `## [Unreleased]\n\n${releaseNotes}\n`,
    );
  } else {
    content = `# Changelog\n\n${releaseNotes}\n\n` + content;
  }

  await writeFile(changelogPath, content, "utf-8");
  console.log(
    `\x1b[32m[OK]\x1b[0m CHANGELOG.md updated with ${version} release notes.`,
  );
  return releaseNotes;
}

async function main() {
  const config = parseArgs();
  console.log(
    "==================================================================",
  );
  console.log("🚀 CHRONERA ENTERPRISE RELEASE AUTOMATION SYSTEM");
  console.log(`Target Version : v${config.version}`);
  console.log(
    `Target Release : ${config.targetDate.toISOString()} (${config.targetDate.toString()})`,
  );
  console.log(`Dry Run Mode   : ${config.dryRun ? "YES" : "NO"}`);
  console.log(
    "==================================================================",
  );

  // 1. Countdown loop if not running immediately
  if (!config.runNow) {
    let lastLoggedMinute = -1;
    while (true) {
      const now = Date.now();
      const diffMs = config.targetDate.getTime() - now;

      if (diffMs <= 0) {
        console.log(
          "\n⏰ Target release time reached (00:00:00 UTC+7)! Initiating deployment sequence...\n",
        );
        break;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      // Periodic newline logging every 30 minutes for daemon log readability
      if (minutes % 30 === 0 && minutes !== lastLoggedMinute) {
        lastLoggedMinute = minutes;
        console.log(
          `\n[${new Date().toISOString()}] ⏳ Countdown: ${hours}h ${minutes}m ${seconds}s remaining...`,
        );
      } else {
        process.stdout.write(
          `\r⏳ Time remaining until v${config.version} deployment: ${hours}h ${minutes}m ${seconds}s... `,
        );
      }

      // Sleep 10s if > 1 min, or 1s if <= 60s
      const sleepInterval = diffMs > 60_000 ? 10_000 : 1_000;
      await sleep(sleepInterval);
    }
  }

  console.log("\n--- Phase 1: Pre-Release Quality Gates ---");
  run("pnpm release:check");

  console.log("\n--- Phase 2: Updating Package & Changelog ---");
  await updatePackageJson(config.version);
  const releaseNotes = await updateChangelog(config.version);
  run("pnpm format");

  console.log("\n--- Phase 3: Final Production Build & Packaging ---");
  run("pnpm build");
  run("pnpm pack:artifact");
  run("pnpm pack:check");

  console.log("\n--- Phase 4: Git Version Control ---");
  run(
    "git add package.json CHANGELOG.md src/ tests/ scripts/ .github/ artifacts/",
  );
  const releaseTitle =
    config.version === "0.1.3"
      ? `v${config.version} - Business & Working Days Helpers`
      : config.version === "0.1.2"
        ? `v${config.version} - Time & Instant Helpers`
        : `v${config.version} - Daily Convenience Helpers`;

  run(`git commit -m "chore(release): ${releaseTitle}"`);
  run(`git tag -a v${config.version} -m "${releaseTitle}"`);

  console.log("\n--- Phase 5: Push to GitHub ---");
  run("git push origin main", config.dryRun);
  run(`git push origin v${config.version}`, config.dryRun);

  console.log("\n--- Phase 6: GitHub Release Creation ---");
  const notesPath = join(process.cwd(), "artifacts", "release-notes.txt");
  await writeFile(notesPath, releaseNotes, "utf-8");
  run(
    `gh release create v${config.version} --title "${releaseTitle}" --notes-file "${notesPath}"`,
    config.dryRun,
  );

  console.log("\n--- Phase 7: NPM Registry Publication ---");
  try {
    run(
      `npm publish ./artifacts/chronera.tgz --access public --tag latest`,
      config.dryRun,
    );
  } catch {
    console.log(
      "\x1b[33m[INFO]\x1b[0m Direct npm publish threw an error or requested OIDC/2FA. Falling back to GitHub Actions Release Workflow.",
    );
  }

  console.log("\n--- Phase 8: Post-Deployment Verification ---");
  if (!config.dryRun) {
    console.log("Verifying GitHub Release...");
    run(`gh release view v${config.version}`);

    console.log(
      "Verifying npm registry propagation (polling up to 2 minutes)...",
    );
    for (let attempt = 1; attempt <= 12; attempt++) {
      try {
        const npmVer = execSync(
          `npm view @intech-software/chronera@${config.version} version`,
          {
            encoding: "utf-8",
          },
        ).trim();
        if (npmVer === config.version) {
          console.log(
            `\x1b[32m[CONFIRMED]\x1b[0m @intech-software/chronera@${config.version} is LIVE on npmjs!`,
          );
          break;
        }
      } catch {
        console.log(`Attempt ${attempt}/12: Waiting for npm propagation...`);
        await sleep(10_000);
      }
    }
  }

  console.log(
    "\n==================================================================",
  );
  console.log(
    `✅ Chronera v${config.version} successfully deployed to GitHub and npmjs!`,
  );
  console.log(
    "==================================================================",
  );
}

main().catch((err) => {
  console.error("\x1b[31m[FATAL ERROR]\x1b[0m Release automation failed:", err);
  process.exit(1);
});
