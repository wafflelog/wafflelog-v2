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

function decodeBase64(base64: string) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let buffer = 0;
  let bitsCollected = 0;
  const bytes: number[] = [];

  for (const char of base64.replace(/=+$/, "")) {
    const value = chars.indexOf(char);

    if (value === -1) {
      continue;
    }

    buffer = (buffer << 6) | value;
    bitsCollected += 6;

    if (bitsCollected >= 8) {
      bitsCollected -= 8;
      bytes.push((buffer >> bitsCollected) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

async function readLocalFileAsBytes(localUri: string) {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return decodeBase64(base64);
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
  const imageBytes = await readLocalFileAsBytes(input.localUri);
  const storagePath = buildPinImageStoragePath({
    tripId: input.tripId,
    pinId: input.pinId,
    imageId: input.imageId,
    fileName: input.fileName,
  });

  const { error } = await supabase.storage
    .from(PIN_IMAGE_STORAGE_BUCKET)
    .upload(storagePath, imageBytes, {
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
