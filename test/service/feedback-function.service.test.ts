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
)}/functions/v1/submit-feedback`;
const publishableKey = requireEnv(
  process.env.SUPABASE_LOCAL_PUBLISHABLE_KEY,
  "SUPABASE_LOCAL_PUBLISHABLE_KEY",
);

describe("submit feedback Edge Function", () => {
  it("rejects an unauthenticated request", async () => {
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        apikey: publishableKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: crypto.randomUUID(),
        category: "feedback",
        message: "A useful idea",
      }),
    });

    expect(response.ok).toBe(false);
    expect([401, 403]).toContain(response.status);
  });

  it.each([
    { category: "other", message: "A useful idea" },
    { category: "feedback", message: "   " },
    { category: "feedback", message: "a".repeat(2001) },
  ])("rejects an invalid payload", async ({ category, message }) => {
    const user = await createTestUser("feedback");
    const { data, error } = await user.client.functions.invoke(
      "submit-feedback",
      {
        method: "POST",
        body: {
          requestId: crypto.randomUUID(),
          category,
          message,
        },
      },
    );

    expect(error).not.toBeNull();
    expect(data).toBeNull();

    const response = (error as { context?: Response }).context;
    expect(response?.status).toBe(400);
    expect(response).toBeDefined();
    expect(await response!.json()).toEqual({
      error: "Invalid feedback payload",
    });
  });
});
