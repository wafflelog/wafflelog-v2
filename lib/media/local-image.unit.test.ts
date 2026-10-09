import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  downloadImageFromStorage: vi.fn(),
  getInfoAsync: vi.fn(),
  setLocalImageUri: vi.fn(),
}));

vi.mock("expo-file-system/legacy", () => ({
  getInfoAsync: mocks.getInfoAsync,
}));

vi.mock("@/lib/media/image", () => ({
  downloadImageFromStorage: mocks.downloadImageFromStorage,
}));

vi.mock("@/lib/sqlite/model/image", () => ({
  actionSetLocalImageUri: mocks.setLocalImageUri,
}));

const remoteImage = {
  id: "image-a",
  tripId: "trip-a",
  localUri: null,
  storageBucket: "images",
  storagePath: "trip/trip-a/images/image-a.jpeg",
  mimeType: "image/jpeg",
};

describe("local image file resolution", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.downloadImageFromStorage.mockResolvedValue(
      "file:///documents/images/cache/trip/trip-a/image-a.jpg",
    );
    mocks.setLocalImageUri.mockResolvedValue(undefined);
  });

  it("reuses an existing local image", async () => {
    mocks.getInfoAsync.mockResolvedValue({ exists: true });
    const { resolveLocalImageFile } = await import("./local-image");

    await expect(
      resolveLocalImageFile({
        ...remoteImage,
        localUri: "file:///documents/images/image-a.jpg",
      }),
    ).resolves.toBe("file:///documents/images/image-a.jpg");

    expect(mocks.downloadImageFromStorage).not.toHaveBeenCalled();
    expect(mocks.setLocalImageUri).not.toHaveBeenCalled();
  });

  it("downloads a missing image and records its device-local URI", async () => {
    const { resolveLocalImageFile } = await import("./local-image");

    await expect(resolveLocalImageFile(remoteImage)).resolves.toBe(
      "file:///documents/images/cache/trip/trip-a/image-a.jpg",
    );

    expect(mocks.downloadImageFromStorage).toHaveBeenCalledWith({
      tripId: "trip-a",
      imageId: "image-a",
      storageBucket: "images",
      storagePath: "trip/trip-a/images/image-a.jpeg",
      mimeType: "image/jpeg",
    });
    expect(mocks.setLocalImageUri).toHaveBeenCalledWith(
      "image-a",
      "file:///documents/images/cache/trip/trip-a/image-a.jpg",
    );
  });

  it("does not download an image without remote storage metadata", async () => {
    const { resolveLocalImageFile } = await import("./local-image");

    await expect(
      resolveLocalImageFile({
        ...remoteImage,
        storageBucket: "",
        storagePath: "",
      }),
    ).rejects.toThrow("This image is not available on this device");

    expect(mocks.downloadImageFromStorage).not.toHaveBeenCalled();
    expect(mocks.setLocalImageUri).not.toHaveBeenCalled();
  });
});
