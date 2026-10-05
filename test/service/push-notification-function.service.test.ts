import { describe, expect, it } from "vitest";

import { createTestUser } from "./local-supabase";

function requireEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Set ${name} in supabase/.env.`);
  }

  return value;
}

const functionUrl = `${requireEnv(
  process.env.SUPABASE_LOCAL_URL,
  "SUPABASE_LOCAL_URL",
)}/functions/v1/push-notification`;
const publishableKey = requireEnv(
  process.env.SUPABASE_LOCAL_PUBLISHABLE_KEY,
  "SUPABASE_LOCAL_PUBLISHABLE_KEY",
);
const secretKey = requireEnv(
  process.env.SUPABASE_LOCAL_SECRET_KEY,
  "SUPABASE_LOCAL_SECRET_KEY",
);

function createWebhookPayload(userId: string, type = "trip_invited") {
  return {
    type: "INSERT",
    table: "app_notification",
    schema: "public",
    record: {
      id: crypto.randomUUID(),
      user_id: userId,
      actor_user_id: null,
      trip_id: null,
      trip_invitation_id: null,
      type,
      title: "Trip invitation",
      body: "Someone invited you to co-edit a trip.",
      read_at: null,
      created_at: new Date().toISOString(),
    },
    old_record: null,
  };
}

async function invokeFunction(apiKey: string, body: unknown) {
  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return {
    response,
    body: await response.json(),
  };
}

describe("push notification Edge Function", () => {
  it("rejects calls authenticated with the publishable key", async () => {
    const { response } = await invokeFunction(
      publishableKey,
      createWebhookPayload(crypto.randomUUID()),
    );

    expect(response.ok).toBe(false);
    expect([401, 403]).toContain(response.status);
  });

  it("rejects an invalid database webhook payload", async () => {
    const { response, body } = await invokeFunction(secretKey, {
      type: "INSERT",
    });

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Invalid app_notification webhook payload",
    });
  });

  it("skips notification types that are not push-enabled", async () => {
    const { response, body } = await invokeFunction(
      secretKey,
      createWebhookPayload(crypto.randomUUID(), "trip_invite_accepted"),
    );

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      skipped: "notification_type_not_push_enabled",
      notificationType: "trip_invite_accepted",
      targetedDevices: 0,
    });
  });

  it("skips an invitation when the recipient has no registered devices", async () => {
    const recipient = await createTestUser("push_recipient");
    const { response, body } = await invokeFunction(
      secretKey,
      createWebhookPayload(recipient.id),
    );

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      skipped: "no_registered_devices",
      targetedDevices: 0,
    });
  });
});
