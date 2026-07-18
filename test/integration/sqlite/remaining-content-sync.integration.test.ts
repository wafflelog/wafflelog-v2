import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestSqliteDatabase, type TestSqliteDatabase } from "./test-db";

const remote = vi.hoisted(() => ({
  expenseDelete: vi.fn(), expenseUpsert: vi.fn(),
  linkDelete: vi.fn(), linkUpsert: vi.fn(),
  noteDelete: vi.fn(), noteUpsert: vi.fn(),
}));
let testDb: TestSqliteDatabase;

vi.mock("@/lib/sqlite/client", () => ({ get sqlite() { return testDb; } }));
vi.mock("@/lib/supabase/actions", () => ({
  actionSoftDeleteRemoteExpense: remote.expenseDelete,
  actionUpsertRemoteExpenseFromLocal: remote.expenseUpsert,
  actionSoftDeleteRemoteNote: remote.noteDelete,
  actionUpsertRemoteNoteFromLocal: remote.noteUpsert,
  actionSoftDeleteRemoteReferenceLink: remote.linkDelete,
  actionUpsertRemoteReferenceLinkFromLocal: remote.linkUpsert,
}));

describe("immutable content sync", () => {
  beforeEach(async () => {
    testDb = createTestSqliteDatabase();
    Object.values(remote).forEach((fn) => fn.mockReset());
    const { initializeDatabase } = await import("@/lib/sqlite/init");
    await initializeDatabase();
  });
  afterEach(() => testDb.close());

  it("syncs, retries, and deletes expenses through the remote action boundary", async () => {
    remote.expenseUpsert.mockResolvedValue(undefined);
    remote.expenseDelete.mockResolvedValue(undefined);
    const model = await import("@/lib/sqlite/model/expense");
    const expense = await model.actionCreateLocalExpense({ tripId: "trip-a", userId: "user-a", description: "Lunch", amount: 12, currency: "GBP", paidByUserId: "user-a", paidByName: "Alice" });
    await model.actionSyncLocalExpense(expense);
    expect(remote.expenseUpsert).toHaveBeenCalledWith(expect.objectContaining({ id: expense.id, description: "Lunch" }));
    await model.actionSoftDeleteLocalExpense(expense.id, "user-a");
    const [tombstone] = await model.actionListPendingLocalExpenses("user-a");
    await model.actionSyncLocalExpense(tombstone);
    expect(remote.expenseDelete).toHaveBeenCalledWith(expense.id);
    await expect(testDb.getFirstAsync("select id from expense where id = ?", [expense.id])).resolves.toBeNull();
  });

  it("syncs notes and retains a failed local row for retry", async () => {
    remote.noteUpsert.mockRejectedValueOnce(new Error("Offline"));
    const model = await import("@/lib/sqlite/model/note");
    const note = await model.actionCreateLocalNote({ tripId: "trip-a", userId: "user-a", text: "Remember this" });
    await expect(model.actionSyncLocalNote(note)).rejects.toThrow("Offline");
    await expect(testDb.getFirstAsync<{ sync_status: string; sync_error: string | null }>("select sync_status, sync_error from note where id = ?", [note.id])).resolves.toEqual({ sync_status: "failed", sync_error: "Offline" });
    remote.noteUpsert.mockResolvedValue(undefined);
    await expect(model.actionSyncPendingLocalNotes("user-a", 1)).resolves.toEqual({ processed: 1, hasMore: true });
    await model.actionSoftDeleteLocalNote(note.id, "user-a");
    const [tombstone] = await model.actionListPendingLocalNotes("user-a");
    remote.noteDelete.mockResolvedValue(undefined);
    await model.actionSyncLocalNote(tombstone);
    expect(remote.noteDelete).toHaveBeenCalledWith(note.id);
  });

  it("syncs and deletes reference links through the remote action boundary", async () => {
    remote.linkUpsert.mockResolvedValue(undefined);
    remote.linkDelete.mockResolvedValue(undefined);
    const model = await import("@/lib/sqlite/model/reference-link");
    const link = await model.actionCreateLocalReferenceLink({ tripId: "trip-a", userId: "user-a", url: "https://example.com" });
    await model.actionSyncLocalReferenceLink(link);
    expect(remote.linkUpsert).toHaveBeenCalledWith(expect.objectContaining({ id: link.id, url: "https://example.com" }));
    await model.actionSoftDeleteLocalReferenceLink(link.id, "user-a");
    const [tombstone] = await model.actionListPendingLocalReferenceLinks("user-a");
    await model.actionSyncLocalReferenceLink(tombstone);
    expect(remote.linkDelete).toHaveBeenCalledWith(link.id);
    await expect(testDb.getFirstAsync("select id from reference_link where id = ?", [link.id])).resolves.toBeNull();
  });
});
