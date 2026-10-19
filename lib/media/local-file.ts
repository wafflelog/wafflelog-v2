import * as FileSystem from "expo-file-system/legacy";

const localMediaDirectories = [
  `${FileSystem.documentDirectory}images`,
  `${FileSystem.documentDirectory}travel-documents`,
  `${FileSystem.documentDirectory}place-images`,
];

export async function clearLocalMediaFiles() {
  await Promise.all(
    localMediaDirectories.map((directory) =>
      FileSystem.deleteAsync(directory, { idempotent: true }),
    ),
  );
}

export async function removeLocalFile(localUri: string | null) {
  const fileUri = localUri?.trim();

  if (!fileUri) {
    return;
  }

  await FileSystem.deleteAsync(fileUri, { idempotent: true });
}
