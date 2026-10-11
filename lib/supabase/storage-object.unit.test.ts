import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  remove: vi.fn(),
  storageFrom: vi.fn(),
}));

vi.mock("./client", () => ({
  supabase: { storage: { from: mocks.storageFrom } },
}));

describe("Storage object removal", () => {
  beforeEach(() => {
    mocks.remove.mockReset();
    mocks.storageFrom.mockReset();
    mocks.remove.mockResolvedValue({ data: [], error: null });
    mocks.storageFrom.mockReturnValue({ remove: mocks.remove });
  });

  it("removes the requested object from its bucket", async () => {
    const { removeStorageObject } = await import("./storage-object");

    await removeStorageObject({
      storageBucket: "images",
      storagePath: "trip/trip-a/images/image-a.jpg",
    });

    expect(mocks.storageFrom).toHaveBeenCalledWith("images");
    expect(mocks.remove).toHaveBeenCalledWith([
      "trip/trip-a/images/image-a.jpg",
    ]);
  });

  it("propagates a Storage removal failure", async () => {
    const storageError = new Error("Storage removal failed");
    mocks.remove.mockResolvedValue({ data: null, error: storageError });
    const { removeStorageObject } = await import("./storage-object");

    await expect(
      removeStorageObject({
        storageBucket: "travel-documents",
        storagePath: "trip/trip-a/documents/document-a.pdf",
      }),
    ).rejects.toBe(storageError);
  });
});
