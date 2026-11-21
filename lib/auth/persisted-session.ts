import { type Session } from "@supabase/supabase-js";

export function getSupabaseAuthStorageKey(supabaseUrl: string) {
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];

  return `sb-${projectRef}-auth-token`;
}

export function parsePersistedAuthSession(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const session: unknown = JSON.parse(value);

    if (
      typeof session !== "object" ||
      session === null ||
      !("access_token" in session) ||
      typeof session.access_token !== "string" ||
      !("refresh_token" in session) ||
      typeof session.refresh_token !== "string" ||
      !("expires_at" in session) ||
      typeof session.expires_at !== "number" ||
      !("user" in session) ||
      typeof session.user !== "object" ||
      session.user === null ||
      !("id" in session.user) ||
      typeof session.user.id !== "string"
    ) {
      return null;
    }

    return session as Session;
  } catch {
    return null;
  }
}
