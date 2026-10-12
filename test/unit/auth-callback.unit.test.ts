import { describe, expect, it } from "vitest";

import { parseAuthCallbackUrl } from "@/lib/auth/auth-callback";

describe("parseAuthCallbackUrl", () => {
  it("reads a Supabase session from the URL fragment", () => {
    expect(
      parseAuthCallbackUrl(
        "wafflelogv2-dev://auth/callback#access_token=access-token&refresh_token=refresh-token&type=signup",
      ),
    ).toEqual({
      type: "session",
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
  });

  it("also accepts session parameters in the query string", () => {
    expect(
      parseAuthCallbackUrl(
        "wafflelogv2://auth/callback?access_token=access-token&refresh_token=refresh-token",
      ),
    ).toEqual({
      type: "session",
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
  });

  it("returns the Supabase error description", () => {
    expect(
      parseAuthCallbackUrl(
        "wafflelogv2://auth/callback#error=access_denied&error_description=Email+link+is+invalid+or+has+expired",
      ),
    ).toEqual({
      type: "error",
      message: "Email link is invalid or has expired",
    });
  });

  it("rejects a callback without both session tokens", () => {
    expect(
      parseAuthCallbackUrl(
        "wafflelogv2-preview://auth/callback#access_token=access-token",
      ),
    ).toEqual({
      type: "error",
      message:
        "Unable to confirm your email. The link may be invalid or expired.",
    });
  });
});
