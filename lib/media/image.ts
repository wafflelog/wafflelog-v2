import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "@/lib/supabase/client";

const LOCAL_PIN_IMAGE_DIRECTORY = `${FileSystem.documentDirectory}pin-images`;
const PIN_IMAGE_STORAGE_BUCKET = "images";

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

export function buildPinImageStoragePath(input: {
  tripId: string;
  pinId: string;
  imageId: string;
  fileName: string;
}) {
  const safeFileName = sanitizeFileName(input.fileName || "image");
  return `trip/${input.tripId}/pin/${input.pinId}/images/${input.imageId}-${safeFileName}`;
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

export async function uploadPinImageToStorage(input: {
  tripId: string;
  pinId: string;
  imageId: string;
  fileName: string;
  mimeType: string;
  localUri: string;
}) {
  const response = await fetch(input.localUri);

  if (!response.ok) {
    throw new Error("Failed to read local image file");
  }

  const imageBlob = await response.blob();
  const storagePath = buildPinImageStoragePath({
    tripId: input.tripId,
    pinId: input.pinId,
    imageId: input.imageId,
    fileName: input.fileName,
  });

  const { error } = await supabase.storage
    .from(PIN_IMAGE_STORAGE_BUCKET)
    .upload(storagePath, imageBlob, {
      contentType: input.mimeType,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return {
    storageBucket: PIN_IMAGE_STORAGE_BUCKET,
    storagePath,
  };
}
