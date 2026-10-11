import * as FileSystem from "expo-file-system/legacy";

import { supabase } from "@/lib/supabase/client";

const DOCUMENT_DOWNLOAD_URL_EXPIRY_SECONDS = 60;
const LOCAL_TRAVEL_DOCUMENT_DIRECTORY =
  `${FileSystem.documentDirectory}travel-documents`;

function sanitizeFileName(fileName: string) {
  return (
    fileName
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .toLowerCase() || "document"
  );
}

export async function downloadTravelDocumentFromStorage(input: {
  tripId: string;
  documentId: string;
  fileName: string;
  storageBucket: string;
  storagePath: string;
}) {
  const documentDirectory =
    `${LOCAL_TRAVEL_DOCUMENT_DIRECTORY}/cache/trip/${input.tripId}`;
  const localUri =
    `${documentDirectory}/${input.documentId}-${sanitizeFileName(input.fileName)}`;
  const temporaryUri = `${localUri}.download`;
  const localDocumentInfo = await FileSystem.getInfoAsync(localUri);

  if (localDocumentInfo.exists) {
    return localUri;
  }

  await FileSystem.makeDirectoryAsync(documentDirectory, {
    intermediates: true,
  });
  await FileSystem.deleteAsync(temporaryUri, { idempotent: true });

  const { data, error } = await supabase.storage
    .from(input.storageBucket)
    .createSignedUrl(
      input.storagePath,
      DOCUMENT_DOWNLOAD_URL_EXPIRY_SECONDS,
    );

  if (error) {
    throw error;
  }

  if (!data?.signedUrl) {
    throw new Error("Failed to create document download URL");
  }

  try {
    const result = await FileSystem.downloadAsync(
      data.signedUrl,
      temporaryUri,
    );

    if (result.status < 200 || result.status >= 300) {
      throw new Error(
        `Document download failed with status ${result.status}`,
      );
    }

    await FileSystem.moveAsync({
      from: temporaryUri,
      to: localUri,
    });

    return localUri;
  } catch (error) {
    try {
      await FileSystem.deleteAsync(temporaryUri, { idempotent: true });
    } catch (cleanupError) {
      console.warn(
        "Failed to remove incomplete document download",
        cleanupError,
      );
    }

    throw error;
  }
}
