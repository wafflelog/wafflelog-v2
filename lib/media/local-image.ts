import * as FileSystem from "expo-file-system/legacy";

import { downloadImageFromStorage } from "@/lib/media/image";
import {
  actionSetLocalImageUri,
  type LocalImage,
} from "@/lib/sqlite/model/image";

type ResolvableLocalImage = Pick<
  LocalImage,
  | "id"
  | "tripId"
  | "localUri"
  | "storageBucket"
  | "storagePath"
  | "mimeType"
>;

export async function resolveLocalImageFile(image: ResolvableLocalImage) {
  if (image.localUri) {
    const localImageInfo = await FileSystem.getInfoAsync(image.localUri);

    if (localImageInfo.exists) {
      return image.localUri;
    }
  }

  if (!image.storageBucket || !image.storagePath) {
    throw new Error("This image is not available on this device");
  }

  const localUri = await downloadImageFromStorage({
    tripId: image.tripId,
    imageId: image.id,
    storageBucket: image.storageBucket,
    storagePath: image.storagePath,
    mimeType: image.mimeType,
  });

  await actionSetLocalImageUri(image.id, localUri);

  return localUri;
}
