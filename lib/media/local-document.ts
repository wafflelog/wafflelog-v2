import * as FileSystem from "expo-file-system/legacy";

import { downloadTravelDocumentFromStorage } from "@/lib/media/document";
import {
  actionSetLocalDocumentUri,
  type LocalDocument,
} from "@/lib/sqlite/model/document";

type ResolvableLocalDocument = Pick<
  LocalDocument,
  | "id"
  | "tripId"
  | "fileName"
  | "localUri"
  | "storageBucket"
  | "storagePath"
>;

export async function resolveLocalDocumentFile(
  document: ResolvableLocalDocument,
) {
  if (document.localUri) {
    const localDocumentInfo = await FileSystem.getInfoAsync(document.localUri);

    if (localDocumentInfo.exists) {
      return document.localUri;
    }
  }

  if (!document.storageBucket || !document.storagePath) {
    throw new Error("This document is not available on this device");
  }

  const localUri = await downloadTravelDocumentFromStorage({
    tripId: document.tripId,
    documentId: document.id,
    fileName: document.fileName,
    storageBucket: document.storageBucket,
    storagePath: document.storagePath,
  });

  await actionSetLocalDocumentUri(document.id, localUri);

  return localUri;
}
