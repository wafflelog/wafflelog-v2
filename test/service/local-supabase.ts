import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name} in supabase/.env.`);
  }

  return value;
}

const url = requireEnv("SUPABASE_LOCAL_URL");
const publishableKey = requireEnv("SUPABASE_LOCAL_PUBLISHABLE_KEY");
const secretKey = requireEnv("SUPABASE_LOCAL_SECRET_KEY");

export const adminClient = createClient<Database>(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export function createPublicClient() {
  return createClient<Database>(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function createUserClient(accessToken: string) {
  return createClient<Database>(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export async function createTestUser(label: string) {
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
  const username = `${label}_${suffix}`;
  const email = `${username}@service-test.local`;
  const password = "service-test-password";
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });

  if (error || !data.user) {
    throw error ?? new Error("Failed to create test user");
  }

  const { data: sessionData, error: signInError } = await createClient<Database>(
    url,
    publishableKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  ).auth.signInWithPassword({ email, password });

  if (signInError || !sessionData.session) {
    throw signInError ?? new Error("Failed to sign in test user");
  }

  return {
    id: data.user.id,
    client: createUserClient(sessionData.session.access_token),
  };
}
