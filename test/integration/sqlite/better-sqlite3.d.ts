declare module "better-sqlite3" {
  type SqliteValue = string | number | bigint | Buffer | null;

  type Statement = {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): unknown;
  };

  export default class Database {
    constructor(filename: string);
    close(): void;
    exec(sql: string): void;
    prepare(sql: string): Statement;
  }
}

