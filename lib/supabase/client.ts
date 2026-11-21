import { createClient } from "@supabase/supabase-js";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import {
  getSupabaseAuthStorageKey,
  parsePersistedAuthSession,
} from "@/lib/auth/persisted-session";
import { Database } from "./types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAuthStorageKey = getSupabaseAuthStorageKey(supabaseUrl);

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (value.length > 2048) {
      console.warn(
        "Value being stored in SecureStore is larger than 2048 bytes and it may not be stored successfully. In a future SDK version, this call may throw an error.",
      );
    }
    return setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return deleteItemAsync(key);
  },
};

export async function getPersistedAuthSession() {
  const value = await ExpoSecureStoreAdapter.getItem(supabaseAuthStorageKey);

  return parsePersistedAuthSession(value);
}

export const supabase = createClient<Database>(
  supabaseUrl,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  {
    auth: {
      storage: ExpoSecureStoreAdapter as any,
      storageKey: supabaseAuthStorageKey,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
