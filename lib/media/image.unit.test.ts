import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  copyAsync: vi.fn(),
  createSignedUrl: vi.fn(),
  deleteAsync: vi.fn(),
  downloadAsync: vi.fn(),
  getInfoAsync: vi.fn(),
  makeDirectoryAsync: vi.fn(),
  manipulate: vi.fn(),
  moveAsync: vi.fn(),
  renderAsync: vi.fn(),
  resize: vi.fn(),
  saveAsync: vi.fn(),
  storageFrom: vi.fn(),
}));

vi.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///documents/",
  copyAsync: mocks.copyAsync,
  deleteAsync: mocks.deleteAsync,
  downloadAsync: mocks.downloadAsync,
  getInfoAsync: mocks.getInfoAsync,
  makeDirectoryAsync: mocks.makeDirectoryAsync,
  moveAsync: mocks.moveAsync,
}));

vi.mock("expo-image-manipulator", () => ({
  ImageManipulator: { manipulate: mocks.manipulate },
  SaveFormat: { JPEG: "jpeg", PNG: "png", WEBP: "webp" },
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: { storage: { from: mocks.storageFrom } },
}));

describe("local image processing", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.manipulate.mockReturnValue({
      resize: mocks.resize,
      renderAsync: mocks.renderAsync,
    });
    mocks.renderAsync.mockResolvedValue({ saveAsync: mocks.saveAsync });
    mocks.saveAsync.mockResolvedValue({
      uri: "file:///cache/processed.jpg",
      width: 1024,
      height: 768,
    });
    mocks.getInfoAsync.mockResolvedValue({
      exists: true,
      uri: "file:///cache/processed.jpg",
      size: 1_000_000,
      isDirectory: false,
      modificationTime: 0,
    });
    mocks.copyAsync.mockResolvedValue(undefined);
    mocks.deleteAsync.mockResolvedValue(undefined);
    mocks.makeDirectoryAsync.mockResolvedValue(undefined);
    mocks.moveAsync.mockResolvedValue(undefined);
    mocks.createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://example.com/signed-image" },
      error: null,
    });
    mocks.storageFrom.mockReturnValue({
      createSignedUrl: mocks.createSignedUrl,
    });
  });

  it("resizes and compresses a large JPEG before persisting it", async () => {
    const { persistLocalImage } = await import("./image");

    await expect(
      persistLocalImage({
        tripId: "trip-a",
        pinId: "pin-a",
        localImageId: "image-a",
        fileName: "Holiday Photo.jpeg",
        fileUri: "file:///picker/original.jpeg",
        mimeType: "image/jpeg",
        width: 4032,
        height: 3024,
      }),
    ).resolves.toEqual({
      localUri:
        "file:///documents/images/trip/trip-a/pin/pin-a/image-a-holiday-photo.jpg",
      mimeType: "image/jpeg",
      width: 1024,
      height: 768,
    });

    expect(mocks.resize).toHaveBeenCalledWith({ width: 1024 });
    expect(mocks.saveAsync).toHaveBeenCalledWith({
      compress: 0.82,
      format: "jpeg",
    });
    expect(mocks.copyAsync).toHaveBeenCalledWith({
      from: "file:///cache/processed.jpg",
      to: "file:///documents/images/trip/trip-a/pin/pin-a/image-a-holiday-photo.jpg",
    });
    expect(mocks.deleteAsync).toHaveBeenCalledWith(
      "file:///cache/processed.jpg",
      { idempotent: true },
    );
  });

  it("preserves PNG output and does not upscale a small image", async () => {
    mocks.saveAsync.mockResolvedValue({
      uri: "file:///cache/processed.png",
      width: 800,
      height: 600,
    });
    const { persistLocalImage } = await import("./image");

    await expect(
      persistLocalImage({
        tripId: "trip-a",
        localImageId: "image-a",
        fileName: "Map.png",
        fileUri: "file:///picker/map.png",
        mimeType: "image/png",
        width: 800,
        height: 600,
      }),
    ).resolves.toEqual({
      localUri: "file:///documents/images/trip/trip-a/image-a-map.png",
      mimeType: "image/png",
      width: 800,
      height: 600,
    });

    expect(mocks.resize).not.toHaveBeenCalled();
    expect(mocks.saveAsync).toHaveBeenCalledWith({
      compress: 1,
      format: "png",
    });
  });

  it("normalises a HEIC camera image to JPEG", async () => {
    mocks.saveAsync.mockResolvedValue({
      uri: "file:///cache/processed.jpg",
      width: 1000,
      height: 750,
    });
    const { persistLocalImage } = await import("./image");

    await expect(
      persistLocalImage({
        tripId: "trip-a",
        localImageId: "image-a",
        fileName: "IMG_1234.HEIC",
        fileUri: "file:///picker/IMG_1234.HEIC",
        mimeType: "image/heic",
        width: 1000,
        height: 750,
      }),
    ).resolves.toEqual({
      localUri: "file:///documents/images/trip/trip-a/image-a-img_1234.jpg",
      mimeType: "image/jpeg",
      width: 1000,
      height: 750,
    });

    expect(mocks.saveAsync).toHaveBeenCalledWith({
      compress: 0.82,
      format: "jpeg",
    });
  });

  it("infers camera image MIME types from filenames when metadata is absent", async () => {
    const { inferLocalImageMimeType } = await import("./image");

    expect(inferLocalImageMimeType({ fileName: "IMG_1234.HEIF" })).toBe(
      "image/heif",
    );
    expect(inferLocalImageMimeType({ fileName: "screenshot.PNG" })).toBe(
      "image/png",
    );
    expect(inferLocalImageMimeType({ fileName: "unknown-format" })).toBe(
      "image/jpeg",
    );
  });

  it("rejects an optimised image that remains larger than 5 MB", async () => {
    mocks.getInfoAsync.mockResolvedValue({
      exists: true,
      uri: "file:///cache/processed.jpg",
      size: 5 * 1024 * 1024 + 1,
      isDirectory: false,
      modificationTime: 0,
    });
    const { persistLocalImage } = await import("./image");

    await expect(
      persistLocalImage({
        tripId: "trip-a",
        localImageId: "image-a",
        fileName: "Large.jpg",
        fileUri: "file:///picker/large.jpg",
        mimeType: "image/jpeg",
        width: 4032,
        height: 3024,
      }),
    ).rejects.toThrow("Image must be smaller than 5 MB after optimisation");

    expect(mocks.copyAsync).not.toHaveBeenCalled();
    expect(mocks.deleteAsync).toHaveBeenCalledWith(
      "file:///cache/processed.jpg",
      { idempotent: true },
    );
  });
});

describe("remote image download", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.deleteAsync.mockResolvedValue(undefined);
    mocks.makeDirectoryAsync.mockResolvedValue(undefined);
    mocks.moveAsync.mockResolvedValue(undefined);
    mocks.getInfoAsync.mockResolvedValue({
      exists: false,
      uri: "file:///documents/images/cache/trip/trip-a/image-a.jpg",
      isDirectory: false,
    });
    mocks.createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://example.com/signed-image" },
      error: null,
    });
    mocks.storageFrom.mockReturnValue({
      createSignedUrl: mocks.createSignedUrl,
    });
    mocks.downloadAsync.mockResolvedValue({
      uri: "file:///documents/images/cache/trip/trip-a/image-a.jpg.download",
      status: 200,
      headers: {},
      mimeType: "image/jpeg",
    });
  });

  it("streams a private image into the durable local cache", async () => {
    const { downloadImageFromStorage } = await import("./image");

    await expect(
      downloadImageFromStorage({
        tripId: "trip-a",
        imageId: "image-a",
        storageBucket: "images",
        storagePath: "trip/trip-a/images/image-a.jpeg",
        mimeType: "image/jpeg",
      }),
    ).resolves.toBe(
      "file:///documents/images/cache/trip/trip-a/image-a.jpg",
    );

    expect(mocks.storageFrom).toHaveBeenCalledWith("images");
    expect(mocks.createSignedUrl).toHaveBeenCalledWith(
      "trip/trip-a/images/image-a.jpeg",
      60,
    );
    expect(mocks.downloadAsync).toHaveBeenCalledWith(
      "https://example.com/signed-image",
      "file:///documents/images/cache/trip/trip-a/image-a.jpg.download",
    );
    expect(mocks.moveAsync).toHaveBeenCalledWith({
      from: "file:///documents/images/cache/trip/trip-a/image-a.jpg.download",
      to: "file:///documents/images/cache/trip/trip-a/image-a.jpg",
    });
  });

  it("reuses a previously downloaded cache file", async () => {
    mocks.getInfoAsync.mockResolvedValue({
      exists: true,
      uri: "file:///documents/images/cache/trip/trip-a/image-a.jpg",
      size: 100,
      isDirectory: false,
      modificationTime: 0,
    });
    const { downloadImageFromStorage } = await import("./image");

    await expect(
      downloadImageFromStorage({
        tripId: "trip-a",
        imageId: "image-a",
        storageBucket: "images",
        storagePath: "trip/trip-a/images/image-a.jpeg",
        mimeType: "image/jpeg",
      }),
    ).resolves.toBe(
      "file:///documents/images/cache/trip/trip-a/image-a.jpg",
    );

    expect(mocks.createSignedUrl).not.toHaveBeenCalled();
    expect(mocks.downloadAsync).not.toHaveBeenCalled();
  });

  it("removes an incomplete download when the request fails", async () => {
    mocks.downloadAsync.mockResolvedValue({
      uri: "file:///documents/images/cache/trip/trip-a/image-a.jpg.download",
      status: 404,
      headers: {},
      mimeType: "application/json",
    });
    const { downloadImageFromStorage } = await import("./image");

    await expect(
      downloadImageFromStorage({
        tripId: "trip-a",
        imageId: "image-a",
        storageBucket: "images",
        storagePath: "trip/trip-a/images/image-a.jpeg",
        mimeType: "image/jpeg",
      }),
    ).rejects.toThrow("Image download failed with status 404");

    expect(mocks.deleteAsync).toHaveBeenLastCalledWith(
      "file:///documents/images/cache/trip/trip-a/image-a.jpg.download",
      { idempotent: true },
    );
    expect(mocks.moveAsync).not.toHaveBeenCalled();
  });
});
