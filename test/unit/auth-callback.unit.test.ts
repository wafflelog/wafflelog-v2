import { describe, expect, it, vi } from "vitest";

import {
  completePasswordRecoveryCallback,
  isPasswordRecoveryCallbackActive,
  parseAuthCallbackUrl,
  processAuthCallbackSessionOnce,
  type AuthCallbackSession,
} from "@/lib/auth/auth-callback";

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
      flow: "signup",
    });
  });

  it("identifies a password recovery callback", () => {
    expect(
      parseAuthCallbackUrl(
        "wafflelogv2-dev://auth/callback#access_token=access-token&refresh_token=refresh-token&type=recovery",
      ),
    ).toEqual({
      type: "session",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      flow: "recovery",
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
      flow: "unknown",
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
      message: "Unable to use this email link. It may be invalid or expired.",
    });
  });
});

describe("auth callback session lifecycle", () => {
  it("establishes one recovery session across repeated callback mounts", async () => {
    const callback: AuthCallbackSession = {
      type: "session",
      accessToken: "repeated-recovery-access-token",
      refreshToken: "repeated-recovery-refresh-token",
      flow: "recovery",
    };
    const establishSession = vi.fn(async () => undefined);

    const destinations = await Promise.all([
      processAuthCallbackSessionOnce(callback, establishSession),
      processAuthCallbackSessionOnce(callback, establishSession),
    ]);

    expect(establishSession).toHaveBeenCalledOnce();
    expect(destinations).toEqual(["/reset-password", "/reset-password"]);
  });

  it("does not reuse a completed password-recovery callback", async () => {
    const callback: AuthCallbackSession = {
      type: "session",
      accessToken: "completed-recovery-access-token",
      refreshToken: "completed-recovery-refresh-token",
      flow: "recovery",
    };
    const establishSession = vi.fn(async () => undefined);

    await processAuthCallbackSessionOnce(callback, establishSession);
    expect(isPasswordRecoveryCallbackActive()).toBe(true);

    completePasswordRecoveryCallback();
    expect(isPasswordRecoveryCallbackActive()).toBe(false);

    const repeatedSession = vi.fn(async () => undefined);
    await expect(
      processAuthCallbackSessionOnce(callback, repeatedSession),
    ).resolves.toBe("/");
    expect(repeatedSession).not.toHaveBeenCalled();
  });

  it("allows a callback to be retried after session creation fails", async () => {
    const callback: AuthCallbackSession = {
      type: "session",
      accessToken: "retry-recovery-access-token",
      refreshToken: "retry-recovery-refresh-token",
      flow: "recovery",
    };

    await expect(
      processAuthCallbackSessionOnce(callback, async () => {
        throw new Error("Temporary session error");
      }),
    ).rejects.toThrow("Temporary session error");

    const retrySession = vi.fn(async () => undefined);
    await expect(
      processAuthCallbackSessionOnce(callback, retrySession),
    ).resolves.toBe("/reset-password");
    expect(retrySession).toHaveBeenCalledOnce();
    completePasswordRecoveryCallback();
  });
});
