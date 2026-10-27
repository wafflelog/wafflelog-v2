import { describe, expect, it, vi } from "vitest";

vi.mock("./client", () => ({
  supabase: new Proxy(
    {},
    {
      get() {
        throw new Error("Supabase should not be accessed for a blank search");
      },
    },
  ),
}));

describe("Supabase actions", () => {
  it("does not query public users when the search is blank", async () => {
    const { actionListPublicUsers } = await import("./actions");

    await expect(actionListPublicUsers("   ")).resolves.toEqual([]);
  });
});
