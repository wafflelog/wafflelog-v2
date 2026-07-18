import Database from "better-sqlite3";

type SqliteParams = unknown[] | undefined;

export type TestSqliteDatabase = ReturnType<typeof createTestSqliteDatabase>;

export function createTestSqliteDatabase() {
  const db = new Database(":memory:");

  return {
    close() {
      db.close();
    },
    async execAsync(sql: string) {
      db.exec(sql);
    },
    async getAllAsync<T>(sql: string, params?: SqliteParams) {
      return db.prepare(sql).all(...(params ?? [])) as T[];
    },
    async getFirstAsync<T>(sql: string, params?: SqliteParams) {
      return (db.prepare(sql).get(...(params ?? [])) ?? null) as T | null;
    },
    async runAsync(sql: string, params?: SqliteParams) {
      db.prepare(sql).run(...(params ?? []));
    },
    async withTransactionAsync<T>(callback: () => Promise<T>) {
      await db.exec("begin");

      try {
        const result = await callback();
        await db.exec("commit");
        return result;
      } catch (error) {
        await db.exec("rollback");
        throw error;
      }
    },
  };
}

