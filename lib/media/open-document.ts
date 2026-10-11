import {
  errorCodes,
  isErrorWithCode,
  viewDocument,
} from "@react-native-documents/viewer";

const DOCUMENT_VIEWER_ERROR_MESSAGES: Record<string, string> = {
  [errorCodes.UNABLE_TO_OPEN_FILE_TYPE]:
    "No compatible app is available to open this document",
  [errorCodes.NULL_PRESENTER]: "Document preview is unavailable right now",
};

export async function openLocalDocument(input: {
  localUri: string;
  fileName: string;
  mimeType: string;
}) {
  try {
    await viewDocument({
      uri: input.localUri,
      mimeType: input.mimeType,
      headerTitle: input.fileName,
      grantPermissions: "read",
      presentationStyle: "fullScreen",
    });
  } catch (error) {
    const message = isErrorWithCode(error)
      ? DOCUMENT_VIEWER_ERROR_MESSAGES[error.code]
      : undefined;

    if (message) {
      throw new Error(message);
    }

    throw error;
  }
}
