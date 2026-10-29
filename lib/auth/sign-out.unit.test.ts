import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/notifications/push-device", () => ({
  removeCurrentPushDevice: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
    },
  },
}));

import { actionSignOutCurrentDevice } from "./sign-out";

describe("current-device sign out", () => {
  it("removes the push device before signing out", async () => {
    const events: string[] = [];

    await actionSignOutCurrentDevice({
      removePushDevice: vi.fn(async () => {
        events.push("push-device-removed");
      }),
      signOut: vi.fn(async () => {
        events.push("signed-out");
      }),
    });

    expect(events).toEqual(["push-device-removed", "signed-out"]);
  });

  it("still signs out when push-device cleanup fails", async () => {
    const signOut = vi.fn(async () => undefined);
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});

    await actionSignOutCurrentDevice({
      removePushDevice: vi.fn(async () => {
        throw new Error("Push cleanup failed");
      }),
      signOut,
    });

    expect(signOut).toHaveBeenCalledOnce();
    expect(warning).toHaveBeenCalledOnce();
    warning.mockRestore();
  });
});
