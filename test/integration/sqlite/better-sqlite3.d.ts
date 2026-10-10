declare module "better-sqlite3" {
  type SqliteValue = string | number | bigint | Buffer | null;

  type RunResult = {
    changes: number;
    lastInsertRowid: number | bigint;
  };

  type Statement = {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): RunResult;
  };

  export default class Database {
    constructor(filename: string);
    close(): void;
    exec(sql: string): void;
    prepare(sql: string): Statement;
  }
}
