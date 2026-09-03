import { readFile } from "node:fs/promises";

async function verifyReleaseTag() {
  const tag = process.env.RELEASE_TAG;
  if (!tag) {
    console.error("Error: RELEASE_TAG environment variable is required.");
    process.exit(1);
  }

  const pkgJson = JSON.parse(await readFile("package.json", "utf-8"));
  const expectedVersion = pkgJson.version;

  if (expectedVersion === "0.0.0-development") {
    console.error("Error: Cannot release with version 0.0.0-development.");
    process.exit(1);
  }

  const expectedTag = `v${expectedVersion}`;
  if (tag !== expectedTag) {
    console.error(
      `Error: Release tag "${tag}" does not match package.json version "${expectedVersion}" (expected "${expectedTag}").`,
    );
    process.exit(1);
  }

  console.log(
    `Release tag "${tag}" matches package version "${expectedVersion}".`,
  );
}

await verifyReleaseTag();
