import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "./client";

const DOCUMENT_MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const TRAVEL_DOCUMENT_STORAGE_BUCKET = "travel-documents";
const LOCAL_TRAVEL_DOCUMENT_DIRECTORY =
  `${FileSystem.documentDirectory}travel-documents`;

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();
}

function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.at(-1)?.toLowerCase() ?? "" : "";
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

export function inferDocumentMimeType(fileName: string) {
  return DOCUMENT_MIME_TYPE_BY_EXTENSION[getFileExtension(fileName)] ?? null;
}

export function isAllowedTravelDocumentMimeType(mimeType: string) {
  return Object.values(DOCUMENT_MIME_TYPE_BY_EXTENSION).includes(mimeType);
}

export function buildTravelDocumentStoragePath(input: {
  tripId: string;
  documentId: string;
  fileName: string;
}) {
  const safeFileName = sanitizeFileName(input.fileName || "document");
  return `trip/${input.tripId}/documents/${input.documentId}-${safeFileName}`;
}

export async function persistLocalTravelDocument(input: {
  localDocumentId: string;
  fileName: string;
  fileUri: string;
}) {
  const safeFileName = sanitizeFileName(input.fileName);
  const localUri =
    `${LOCAL_TRAVEL_DOCUMENT_DIRECTORY}/${input.localDocumentId}-${safeFileName}`;

  await FileSystem.makeDirectoryAsync(LOCAL_TRAVEL_DOCUMENT_DIRECTORY, {
    intermediates: true,
  });

  await FileSystem.copyAsync({
    from: input.fileUri,
    to: localUri,
  });

  return localUri;
}

export async function uploadTravelDocumentToStorage(input: {
  tripId: string;
  documentId: string;
  fileName: string;
  mimeType: string;
  localUri: string;
}) {
  const fileBytes = await readLocalFileAsBytes(input.localUri);
  const storagePath = buildTravelDocumentStoragePath({
    tripId: input.tripId,
    documentId: input.documentId,
    fileName: input.fileName,
  });

  const { error } = await supabase.storage
    .from(TRAVEL_DOCUMENT_STORAGE_BUCKET)
    .upload(storagePath, fileBytes, {
      contentType: input.mimeType,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return {
    storageBucket: TRAVEL_DOCUMENT_STORAGE_BUCKET,
    storagePath,
  };
}
