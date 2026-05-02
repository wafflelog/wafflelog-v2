import * as FileSystem from "expo-file-system/legacy";

const LOCAL_PIN_IMAGE_DIRECTORY = `${FileSystem.documentDirectory}pin-images`;

const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();
}

export function isAllowedLocalImageMimeType(mimeType: string) {
  return ALLOWED_IMAGE_MIME_TYPES.includes(
    mimeType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
  );
}

export async function persistLocalPinImage(input: {
  pinId: string;
  localImageId: string;
  fileName: string;
  fileUri: string;
}) {
  const safeFileName = sanitizeFileName(input.fileName || "image");
  const pinDirectory = `${LOCAL_PIN_IMAGE_DIRECTORY}/${input.pinId}`;
  const localUri = `${pinDirectory}/${input.localImageId}-${safeFileName}`;

  await FileSystem.makeDirectoryAsync(pinDirectory, {
    intermediates: true,
  });

  await FileSystem.copyAsync({
    from: input.fileUri,
    to: localUri,
  });

  return localUri;
}
