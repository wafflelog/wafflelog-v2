import { describe, expect, it, vi } from "vitest";

import { actionDeleteAccount } from "./delete-account";

vi.mock("@/lib/ai-trip-planning/client", () => ({
  planningApiClient: { deletePlanningData: vi.fn() },
}));

vi.mock("@/lib/media/local-file", () => ({
  clearLocalMediaFiles: vi.fn(),
}));

vi.mock("@/lib/sqlite/clear-local-data", () => ({
  actionClearLocalData: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: { signOut: vi.fn() },
    functions: { invoke: vi.fn() },
  },
}));

function createDependencies(calls: string[]) {
  return {
    deletePlanningData: vi.fn(async () => {
      calls.push("delete-planning-data");
    }),
    deleteSupabaseAccount: vi.fn(async () => {
      calls.push("delete-supabase-account");
    }),
    signOut: vi.fn(async () => {
      calls.push("sign-out");
    }),
    clearLocalData: vi.fn(async () => {
      calls.push("clear-local-data");
    }),
    clearLocalMediaFiles: vi.fn(async () => {
      calls.push("clear-local-media");
    }),
  };
}

describe("account deletion", () => {
  it("deletes remote data before clearing the session and local data", async () => {
    const calls: string[] = [];
    const dependencies = createDependencies(calls);

    await actionDeleteAccount(
      {
        clearClientCache: async () => {
          calls.push("clear-client-cache");
        },
      },
      dependencies,
    );

    expect(calls.slice(0, 4)).toEqual([
      "delete-planning-data",
      "delete-supabase-account",
      "clear-client-cache",
      "sign-out",
    ]);
    expect(calls).toEqual(
      expect.arrayContaining(["clear-local-data", "clear-local-media"]),
    );
  });

  it("stops before Supabase deletion when planning-data deletion fails", async () => {
    const calls: string[] = [];
    const dependencies = createDependencies(calls);
    dependencies.deletePlanningData.mockRejectedValueOnce(
      new Error("Planning API unavailable"),
    );

    await expect(
      actionDeleteAccount({}, dependencies),
    ).rejects.toThrow("Planning API unavailable");
    expect(calls).toEqual([]);
    expect(dependencies.deleteSupabaseAccount).not.toHaveBeenCalled();
    expect(dependencies.signOut).not.toHaveBeenCalled();
  });

  it("keeps the session when Supabase deletion fails so the user can retry", async () => {
    const calls: string[] = [];
    const dependencies = createDependencies(calls);
    dependencies.deleteSupabaseAccount.mockRejectedValueOnce(
      new Error("Supabase unavailable"),
    );

    await expect(
      actionDeleteAccount({}, dependencies),
    ).rejects.toThrow("Supabase unavailable");
    expect(calls).toEqual(["delete-planning-data"]);
    expect(dependencies.signOut).not.toHaveBeenCalled();
  });
});
