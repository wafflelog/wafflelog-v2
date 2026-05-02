import * as FileSystem from "expo-file-system/legacy";

const LOCAL_PLACE_IMAGE_DIRECTORY = `${FileSystem.documentDirectory}place-images`;

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();
}

export async function persistLocalPlaceImage(input: {
  pinId: string;
  placeId: string;
  imageUrl: string;
}) {
  const pinDirectory = `${LOCAL_PLACE_IMAGE_DIRECTORY}/${input.pinId}`;
  const localUri = `${pinDirectory}/${sanitizeFileName(input.placeId)}.jpg`;

  await FileSystem.makeDirectoryAsync(pinDirectory, {
    intermediates: true,
  });

  await FileSystem.downloadAsync(input.imageUrl, localUri);

  return localUri;
}
