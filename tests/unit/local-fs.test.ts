import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LocalFsStorage } from "@/lib/storage/local-fs";

describe("LocalFsStorage", () => {
  it("writes and reads objects under root", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "surreal-fs-"));
    const storage = new LocalFsStorage(root);
    await storage.putObject("a/b.png", Buffer.from("hello"), "image/png");
    const got = await storage.getObject("a/b.png");
    expect(got?.toString()).toBe("hello");
    await storage.deleteObject("a/b.png");
    expect(await storage.getObject("a/b.png")).toBeNull();
  });

  it("rejects path traversal", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "surreal-fs-"));
    const storage = new LocalFsStorage(root);
    await expect(
      storage.putObject("../evil.txt", Buffer.from("x"), "text/plain"),
    ).rejects.toThrow(/traversal|Invalid/i);
  });
});
