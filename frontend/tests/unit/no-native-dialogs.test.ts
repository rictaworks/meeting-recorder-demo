import * as fs from "fs";
import * as path from "path";

function getAllSourceFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".next") {
      results.push(...getAllSourceFiles(fullPath, extensions));
    } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

const SRC_DIR = path.join(__dirname, "../../src");
const SOURCE_FILES = getAllSourceFiles(SRC_DIR, [".ts", ".tsx"]);

const FORBIDDEN_PATTERNS = [
  /\bwindow\.alert\s*\(/,
  /\bwindow\.confirm\s*\(/,
  /\bwindow\.prompt\s*\(/,
  /(?<![.\w])alert\s*\(/,
  /(?<![.\w])confirm\s*\(/,
  /(?<![.\w])prompt\s*\(/,
];

describe("no-native-dialogs", () => {
  test("source files exist", () => {
    expect(SOURCE_FILES.length).toBeGreaterThan(0);
  });

  SOURCE_FILES.forEach((filePath) => {
    const relPath = path.relative(SRC_DIR, filePath);

    test(`${relPath} does not use native alert/confirm/prompt`, () => {
      const content = fs.readFileSync(filePath, "utf-8");
      FORBIDDEN_PATTERNS.forEach((pattern) => {
        expect(content).not.toMatch(pattern);
      });
    });
  });
});
