import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const CONFORMANCE_DIR = join(process.cwd(), "tests", "conformance");

async function findFixtureFiles(dir: string): Promise<string[]> {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const dirent of dirents) {
    const res = join(dir, dirent.name);
    if (dirent.isDirectory()) {
      files.push(...(await findFixtureFiles(res)));
    } else if (res.endsWith(".json")) {
      files.push(res);
    }
  }
  return files;
}

async function validateFixtures(): Promise<void> {
  const files = await findFixtureFiles(CONFORMANCE_DIR);
  let totalCases = 0;

  for (const file of files) {
    const content = await readFile(file, "utf-8");
    const data = JSON.parse(content);

    if (
      !data.calendar ||
      !data.algorithm ||
      !data.source ||
      !Array.isArray(data.cases)
    ) {
      throw new Error(`Fixture ${file} missing required top-level fields.`);
    }

    for (const c of data.cases) {
      if (!c.gregorian || !c.target) {
        throw new Error(
          `Fixture ${file} case missing gregorian or target field.`,
        );
      }
      if (
        typeof c.gregorian.year !== "number" ||
        typeof c.gregorian.monthCode !== "string" ||
        typeof c.gregorian.day !== "number"
      ) {
        throw new Error(`Fixture ${file} case has invalid gregorian fields.`);
      }
      totalCases++;
    }
  }

  console.log(
    `Successfully validated ${files.length} fixture files containing ${totalCases} test cases.`,
  );
}

await validateFixtures();
