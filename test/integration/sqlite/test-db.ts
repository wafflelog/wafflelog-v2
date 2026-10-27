import Database from "better-sqlite3";

type SqliteParams = unknown[] | undefined;

type TestSqliteTransaction = {
  execAsync: (sql: string) => Promise<void>;
  getAllAsync: <Result>(sql: string, params?: SqliteParams) => Promise<Result[]>;
  getFirstAsync: <Result>(
    sql: string,
    params?: SqliteParams,
  ) => Promise<Result | null>;
  runAsync: (
    sql: string,
    params?: SqliteParams,
  ) => Promise<{ changes: number; lastInsertRowId: number }>;
};

export type TestSqliteDatabase = TestSqliteTransaction & {
  close: () => void;
  withTransactionAsync: <Result>(
    callback: () => Promise<Result>,
  ) => Promise<Result>;
  withExclusiveTransactionAsync: <Result>(
    callback: (transaction: TestSqliteTransaction) => Promise<Result>,
  ) => Promise<Result>;
};

export function createTestSqliteDatabase(): TestSqliteDatabase {
  const db = new Database(":memory:");
  const transaction: TestSqliteTransaction = {
    async execAsync(sql: string) {
      db.exec(sql);
    },
    async getAllAsync<Result>(sql: string, params?: SqliteParams) {
      return db.prepare(sql).all(...(params ?? [])) as Result[];
    },
    async getFirstAsync<Result>(sql: string, params?: SqliteParams) {
      return (db.prepare(sql).get(...(params ?? [])) ?? null) as Result | null;
    },
    async runAsync(sql: string, params?: SqliteParams) {
      const result = db.prepare(sql).run(...(params ?? []));

      return {
        changes: result.changes,
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
  };

  return {
    ...transaction,
    close() {
      db.close();
    },
    async withTransactionAsync<Result>(callback: () => Promise<Result>) {
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
    async withExclusiveTransactionAsync<Result>(
      callback: (exclusiveTransaction: TestSqliteTransaction) => Promise<Result>,
    ) {
      await db.exec("begin exclusive");

      try {
        const result = await callback(transaction);
        await db.exec("commit");
        return result;
      } catch (error) {
        await db.exec("rollback");
        throw error;
      }
    },
  };
}
