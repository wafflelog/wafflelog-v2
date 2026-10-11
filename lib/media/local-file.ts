import * as FileSystem from "expo-file-system/legacy";

export async function removeLocalFile(localUri: string | null) {
  const fileUri = localUri?.trim();

  if (!fileUri) {
    return;
  }

  await FileSystem.deleteAsync(fileUri, { idempotent: true });
}
