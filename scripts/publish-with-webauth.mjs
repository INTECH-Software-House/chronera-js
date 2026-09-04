import { exec } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const NPM_ROOT = "C:/Program Files/nodejs/node_modules/npm";
const auth = require(`${NPM_ROOT}/lib/utils/auth.js`);
const { webAuthCheckLogin } = require(`${NPM_ROOT}/node_modules/npm-profile`);
const Npm = require(`${NPM_ROOT}/lib/npm.js`);

// Patch otplease to handle WebAuth even without a TTY
auth.otplease = async (npm, opts, fn) => {
  try {
    return await fn(opts);
  } catch (err) {
    if (err.code === "EOTP" && err.body?.authUrl && err.body?.doneUrl) {
      console.log("\n========================================================");
      console.log("🔐 NPM Web Authorization Required");
      console.log(`🔗 URL: ${err.body.authUrl}`);
      console.log("========================================================\n");

      // Automatically launch default browser on Windows
      exec(`start "" "${err.body.authUrl}"`);
      console.log(
        "🌐 Browser opened automatically! Please click 'Approve' or complete 2FA in your browser.",
      );
      console.log("⏳ Waiting for authorization from npmjs.com...\n");

      const { token: otp } = await webAuthCheckLogin(err.body.doneUrl, {
        ...opts,
        cache: false,
      });

      console.log("✅ 2FA Authorization successful! Publishing package...");
      return await fn({ ...opts, otp });
    }
    throw err;
  }
};

async function main() {
  const tarballPath =
    process.argv[2] || "./artifacts/intech-software-chronera-0.1.1.tgz";

  // Set process.argv for npm CLI parser
  process.argv = [
    "node",
    "npm",
    "publish",
    tarballPath,
    "--access",
    "public",
    "--provenance=false",
    ...process.argv.slice(3),
  ];

  console.log(`📦 Initiating publish for ${tarballPath}...`);
  const npm = new Npm();
  await npm.load();

  try {
    await npm.exec("publish", [tarballPath]);
    console.log("\n🎉 Package successfully published to npmjs.org!");
  } catch (err) {
    console.error("\n❌ Publish failed:", err.message || err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
