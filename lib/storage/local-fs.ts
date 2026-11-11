import fs from "node:fs/promises";
import path from "node:path";
import type { StorageBackend } from "./types";

function assertSafeKey(key: string): void {
  if (!key || key.includes("\0") || path.isAbsolute(key)) {
    throw new Error("Invalid storage key");
  }
  const normalized = path.normalize(key);
  if (normalized.startsWith("..") || normalized.includes(`${path.sep}..`)) {
    throw new Error("Path traversal rejected");
  }
}

export class LocalFsStorage implements StorageBackend {
  constructor(private readonly rootDir: string) {}

  private resolve(key: string): string {
    assertSafeKey(key);
    const full = path.resolve(this.rootDir, key);
    const root = path.resolve(this.rootDir);
    if (full !== root && !full.startsWith(root + path.sep)) {
      throw new Error("Path traversal rejected");
    }
    return full;
  }

  async putObject(key: string, data: Buffer, mimeType: string): Promise<void> {
    void mimeType;
    const full = this.resolve(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
  }

  async getObject(key: string): Promise<Buffer | null> {
    try {
      return await fs.readFile(this.resolve(key));
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "ENOENT") return null;
      throw err;
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(key));
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "ENOENT") return;
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }
}
