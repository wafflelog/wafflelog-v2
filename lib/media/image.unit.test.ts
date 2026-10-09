import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  copyAsync: vi.fn(),
  deleteAsync: vi.fn(),
  getInfoAsync: vi.fn(),
  makeDirectoryAsync: vi.fn(),
  manipulate: vi.fn(),
  renderAsync: vi.fn(),
  resize: vi.fn(),
  saveAsync: vi.fn(),
}));

vi.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///documents/",
  copyAsync: mocks.copyAsync,
  deleteAsync: mocks.deleteAsync,
  getInfoAsync: mocks.getInfoAsync,
  makeDirectoryAsync: mocks.makeDirectoryAsync,
}));

vi.mock("expo-image-manipulator", () => ({
  ImageManipulator: { manipulate: mocks.manipulate },
  SaveFormat: { JPEG: "jpeg", PNG: "png", WEBP: "webp" },
}));

vi.mock("@/lib/supabase/client", () => ({ supabase: {} }));

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
