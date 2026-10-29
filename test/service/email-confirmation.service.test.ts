import { describe, expect, it, vi } from "vitest";

import { parseAuthCallbackUrl } from "@/lib/auth/auth-callback";
import { type RegistrationError } from "@/lib/auth/registration-error";
import {
  actionRequestPasswordReset,
  actionSetSessionFromAuthCallback,
  actionSignInWithEmail,
  actionSignUpWithEmail,
  actionUpdatePassword,
} from "@/lib/supabase/actions";

import { adminClient, createPublicClient } from "./local-supabase";

vi.mock("expo-secure-store", () => ({
  deleteItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
}));

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const EMAIL_REDIRECT_URL = "wafflelogv2-dev://auth/callback";

type MailpitMessages = {
  messages: { ID: string }[];
};

type MailpitMessage = {
  HTML: string;
};

async function getMailpitJson<T>(path: string) {
  const response = await fetch(`${MAILPIT_URL}${path}`);

  if (!response.ok) {
    throw new Error(
      `Mailpit request failed (${response.status}): ${await response.text()}`,
    );
  }

  return (await response.json()) as T;
}

async function waitForAuthEmail(email: string) {
  const deadline = Date.now() + 3_000;
  const query = new URLSearchParams({
    query: `to:"${email}"`,
    start: "0",
    limit: "1",
  });

  while (Date.now() < deadline) {
    const result = await getMailpitJson<MailpitMessages>(
      `/api/v1/search?${query}`,
    );
    const message = result.messages[0];

    if (message) {
      return getMailpitJson<MailpitMessage>(
        `/api/v1/message/${encodeURIComponent(message.ID)}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(
    `Mailpit did not receive an authentication email for ${email}`,
  );
}

function getAuthActionUrl(html: string) {
  const href = html.match(
    /href=["']([^"']*\/auth\/v1\/verify[^"']*)["']/i,
  )?.[1];

  if (!href) {
    throw new Error(
      "The authentication email did not contain a verification URL",
    );
  }

  return href.replaceAll("&amp;", "&");
}

describe("email confirmation", () => {
  it("keeps existing emails private and reports a duplicate username clearly", async () => {
    const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 8);
    const email = `reg_${suffix}@service-test.local`;
    const username = `reg_${suffix}`;
    const client = createPublicClient();

    const firstSignUp = await actionSignUpWithEmail(
      {
        email,
        password: "service-test-password",
        username,
        emailRedirectTo: EMAIL_REDIRECT_URL,
      },
      client,
    );

    expect(firstSignUp.user?.email).toBe(email);
    expect(firstSignUp.session).toBeNull();

    await new Promise((resolve) => setTimeout(resolve, 1_100));

    const unconfirmedSignUp = await actionSignUpWithEmail(
      {
        email,
        password: "service-test-password",
        username,
        emailRedirectTo: EMAIL_REDIRECT_URL,
      },
      createPublicClient(),
    );

    expect(unconfirmedSignUp.session).toBeNull();

    const { error: confirmError } =
      await adminClient.auth.admin.updateUserById(firstSignUp.user!.id, {
        email_confirm: true,
      });
    expect(confirmError).toBeNull();

    const confirmedSignUp = await actionSignUpWithEmail(
      {
        email,
        password: "another-service-test-password",
        username: `other_${suffix}`,
        emailRedirectTo: EMAIL_REDIRECT_URL,
      },
      createPublicClient(),
    );

    expect(confirmedSignUp.session).toBeNull();

    await expect(
      actionSignUpWithEmail(
        {
          email: `other_${suffix}@service-test.local`,
          password: "service-test-password",
          username,
          emailRedirectTo: EMAIL_REDIRECT_URL,
        },
        createPublicClient(),
      ),
    ).rejects.toMatchObject({
      name: "RegistrationError",
      code: "username_taken",
      message: "That username is already taken. Try another.",
    } satisfies Partial<RegistrationError>);
  });

  it("confirms a signup through Mailpit and creates an app session", async () => {
    const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
    const email = `email_confirm_${suffix}@service-test.local`;
    const client = createPublicClient();
    const signUp = await actionSignUpWithEmail(
      {
        email,
        password: "service-test-password",
        username: `email_confirm_${suffix}`,
        emailRedirectTo: EMAIL_REDIRECT_URL,
      },
      client,
    );

    expect(signUp.user?.email).toBe(email);
    expect(signUp.session).toBeNull();

    const message = await waitForAuthEmail(email);
    const confirmationResponse = await fetch(getAuthActionUrl(message.HTML), {
      redirect: "manual",
    });
    const callbackUrl = confirmationResponse.headers.get("location");

    expect(confirmationResponse.status).toBeGreaterThanOrEqual(300);
    expect(confirmationResponse.status).toBeLessThan(400);
    expect(callbackUrl).toMatch(/^wafflelogv2-dev:\/\/auth\/callback(?:\?|#)/);

    const callback = parseAuthCallbackUrl(callbackUrl!);
    expect(callback.type).toBe("session");

    if (callback.type !== "session") {
      throw new Error(callback.message);
    }

    const session = await actionSetSessionFromAuthCallback(
      {
        accessToken: callback.accessToken,
        refreshToken: callback.refreshToken,
      },
      client,
    );

    expect(session.user.email).toBe(email);
    expect(session.user.email_confirmed_at).toBeTruthy();
  });

  it("resets a password through Mailpit and signs in with the new password", async () => {
    const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
    const email = `recover_${suffix}@service-test.local`;
    const oldPassword = "old-service-test-password";
    const newPassword = "new-service-test-password";
    const { data: createdUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password: oldPassword,
        email_confirm: true,
        user_metadata: { username: `recover_${suffix}` },
      });

    expect(createError).toBeNull();
    expect(createdUser.user?.email).toBe(email);

    const recoveryClient = createPublicClient();
    await actionRequestPasswordReset(
      { email, redirectTo: EMAIL_REDIRECT_URL },
      recoveryClient,
    );

    const message = await waitForAuthEmail(email);
    const recoveryResponse = await fetch(getAuthActionUrl(message.HTML), {
      redirect: "manual",
    });
    const callbackUrl = recoveryResponse.headers.get("location");

    expect(recoveryResponse.status).toBeGreaterThanOrEqual(300);
    expect(recoveryResponse.status).toBeLessThan(400);
    expect(callbackUrl).toMatch(/^wafflelogv2-dev:\/\/auth\/callback(?:\?|#)/);

    const callback = parseAuthCallbackUrl(callbackUrl!);
    expect(callback.type).toBe("session");

    if (callback.type !== "session") {
      throw new Error(callback.message);
    }

    expect(callback.flow).toBe("recovery");
    await actionSetSessionFromAuthCallback(callback, recoveryClient);
    await actionUpdatePassword({ password: newPassword }, recoveryClient);
    await recoveryClient.auth.signOut({ scope: "local" });

    const signIn = await actionSignInWithEmail(
      { email, password: newPassword },
      createPublicClient(),
    );

    expect(signIn.session?.user.email).toBe(email);
  });
});
