import * as FileSystem from "expo-file-system/legacy";

const DOCUMENT_MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

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

export function inferDocumentMimeType(fileName: string) {
  return DOCUMENT_MIME_TYPE_BY_EXTENSION[getFileExtension(fileName)] ?? null;
}

export function isAllowedTravelDocumentMimeType(mimeType: string) {
  return Object.values(DOCUMENT_MIME_TYPE_BY_EXTENSION).includes(mimeType);
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
