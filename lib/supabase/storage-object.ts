import { supabase } from "./client";

export async function removeStorageObject(input: {
  storageBucket: string;
  storagePath: string;
}) {
  const { error } = await supabase.storage
    .from(input.storageBucket)
    .remove([input.storagePath]);

  if (error) {
    throw error;
  }
}
