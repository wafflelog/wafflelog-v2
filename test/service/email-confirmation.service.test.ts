import { describe, expect, it, vi } from "vitest";

import { parseAuthCallbackUrl } from "@/lib/auth/auth-callback";
import {
  actionSetSessionFromAuthCallback,
  actionSignUpWithEmail,
} from "@/lib/supabase/actions";

import { createPublicClient } from "./local-supabase";

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

async function waitForConfirmationEmail(email: string) {
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

  throw new Error(`Mailpit did not receive a confirmation email for ${email}`);
}

function getConfirmationUrl(html: string) {
  const href = html.match(
    /href=["']([^"']*\/auth\/v1\/verify[^"']*)["']/i,
  )?.[1];

  if (!href) {
    throw new Error(
      "The confirmation email did not contain a verification URL",
    );
  }

  return href.replaceAll("&amp;", "&");
}

describe("email confirmation", () => {
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

    const message = await waitForConfirmationEmail(email);
    const confirmationResponse = await fetch(getConfirmationUrl(message.HTML), {
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
});
