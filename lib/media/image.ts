import * as FileSystem from "expo-file-system/legacy";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { supabase } from "@/lib/supabase/client";

const LOCAL_IMAGE_DIRECTORY = `${FileSystem.documentDirectory}images`;
const PIN_IMAGE_STORAGE_BUCKET = "images";
const MAX_IMAGE_LONG_EDGE = 1024;
const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const LOSSY_IMAGE_QUALITY = 0.82;

const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

const IMAGE_OUTPUT_BY_MIME_TYPE = {
  "image/jpeg": {
    extension: "jpg",
    format: SaveFormat.JPEG,
    mimeType: "image/jpeg",
    quality: LOSSY_IMAGE_QUALITY,
  },
  "image/jpg": {
    extension: "jpg",
    format: SaveFormat.JPEG,
    mimeType: "image/jpeg",
    quality: LOSSY_IMAGE_QUALITY,
  },
  "image/png": {
    extension: "png",
    format: SaveFormat.PNG,
    mimeType: "image/png",
    quality: 1,
  },
  "image/webp": {
    extension: "webp",
    format: SaveFormat.WEBP,
    mimeType: "image/webp",
    quality: LOSSY_IMAGE_QUALITY,
  },
} as const;

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();
}

function getFileNameWithoutExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");
  return lastDotIndex > 0 ? fileName.slice(0, lastDotIndex) : fileName;
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

export function buildTripImageStoragePath(input: {
  tripId: string;
  imageId: string;
  fileName: string;
}) {
  const safeFileName = sanitizeFileName(input.fileName || "image");
  return `trip/${input.tripId}/images/${input.imageId}-${safeFileName}`;
}

export async function persistLocalImage(input: {
  tripId: string;
  pinId?: string | null;
  localImageId: string;
  fileName: string;
  fileUri: string;
  mimeType: string;
  width: number;
  height: number;
}) {
  const output = IMAGE_OUTPUT_BY_MIME_TYPE[
    input.mimeType as keyof typeof IMAGE_OUTPUT_BY_MIME_TYPE
  ];

  if (!output) {
    throw new Error("Choose a JPG, PNG, or WebP image");
  }

  const safeBaseName =
    sanitizeFileName(getFileNameWithoutExtension(input.fileName)) || "image";
  const safeFileName = `${safeBaseName}.${output.extension}`;
  const imageDirectory = input.pinId
    ? `${LOCAL_IMAGE_DIRECTORY}/trip/${input.tripId}/pin/${input.pinId}`
    : `${LOCAL_IMAGE_DIRECTORY}/trip/${input.tripId}`;
  const localUri = `${imageDirectory}/${input.localImageId}-${safeFileName}`;
  const context = ImageManipulator.manipulate(input.fileUri);

  if (Math.max(input.width, input.height) > MAX_IMAGE_LONG_EDGE) {
    context.resize(
      input.width >= input.height
        ? { width: MAX_IMAGE_LONG_EDGE }
        : { height: MAX_IMAGE_LONG_EDGE },
    );
  }

  const renderedImage = await context.renderAsync();
  const processedImage = await renderedImage.saveAsync({
    compress: output.quality,
    format: output.format,
  });

  try {
    const processedImageInfo = await FileSystem.getInfoAsync(processedImage.uri);

    if (!processedImageInfo.exists) {
      throw new Error("Failed to prepare image");
    }

    if (processedImageInfo.size > MAX_IMAGE_FILE_SIZE_BYTES) {
      throw new Error("Image must be smaller than 5 MB after optimisation");
    }

    await FileSystem.makeDirectoryAsync(imageDirectory, {
      intermediates: true,
    });

    await FileSystem.copyAsync({
      from: processedImage.uri,
      to: localUri,
    });

    return {
      localUri,
      mimeType: output.mimeType,
      width: processedImage.width,
      height: processedImage.height,
    };
  } finally {
    try {
      await FileSystem.deleteAsync(processedImage.uri, { idempotent: true });
    } catch (error) {
      console.warn("Failed to remove temporary processed image", error);
    }
  }
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

export async function uploadImageToStorage(input: {
  tripId: string;
  pinId?: string | null;
  imageId: string;
  fileName: string;
  mimeType: string;
  localUri: string;
}) {
  const imageBytes = await readLocalFileAsBytes(input.localUri);
  const storagePath = input.pinId
    ? buildPinImageStoragePath({
        tripId: input.tripId,
        pinId: input.pinId,
        imageId: input.imageId,
        fileName: input.fileName,
      })
    : buildTripImageStoragePath({
        tripId: input.tripId,
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
