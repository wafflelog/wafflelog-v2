import { describe, expect, it } from "vitest";

import {
  getSupabaseAuthStorageKey,
  parsePersistedAuthSession,
} from "./persisted-session";

const persistedSession = {
  access_token: "access-token",
  refresh_token: "refresh-token",
  expires_at: 1,
  expires_in: 3600,
  token_type: "bearer",
  user: {
    id: "user-id",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00.000Z",
  },
};

describe("persisted Supabase auth session", () => {
  it("uses the same storage key format as the Supabase client", () => {
    expect(
      getSupabaseAuthStorageKey("https://project-ref.supabase.co"),
    ).toBe("sb-project-ref-auth-token");
  });

  it("restores a structurally valid session even after it expires", () => {
    expect(
      parsePersistedAuthSession(JSON.stringify(persistedSession)),
    ).toEqual(persistedSession);
  });

  it.each([null, "", "not-json", JSON.stringify({ access_token: "token" })])(
    "rejects an invalid stored session",
    (value) => {
      expect(parsePersistedAuthSession(value)).toBeNull();
    },
  );
});
