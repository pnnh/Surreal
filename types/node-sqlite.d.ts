declare module "node:sqlite" {
  export type StatementSyncResult = {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  };

  export class StatementSync {
    run(...params: unknown[]): StatementSyncResult;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }

  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
