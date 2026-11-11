import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll } from "vitest";

// Ensure tests use an isolated temporary data directory, never polluting data/surreal.sqlite
const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "surreal-test-"));
process.env.SURREAL_DATA_DIR = testDataDir;
process.env.THREE_D_PROVIDER = "mock";
delete process.env.FAL_KEY;

afterAll(() => {
  try {
    if (globalThis.__surrealDb) {
      try {
        globalThis.__surrealDb.close();
      } catch {
        // ignore
      }
      globalThis.__surrealDb = undefined;
    }
    fs.rmSync(testDataDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
});
