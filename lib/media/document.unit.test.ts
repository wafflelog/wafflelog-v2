import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSignedUrl: vi.fn(),
  deleteAsync: vi.fn(),
  downloadAsync: vi.fn(),
  getInfoAsync: vi.fn(),
  makeDirectoryAsync: vi.fn(),
  moveAsync: vi.fn(),
  storageFrom: vi.fn(),
}));

vi.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///documents/",
  deleteAsync: mocks.deleteAsync,
  downloadAsync: mocks.downloadAsync,
  getInfoAsync: mocks.getInfoAsync,
  makeDirectoryAsync: mocks.makeDirectoryAsync,
  moveAsync: mocks.moveAsync,
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: { storage: { from: mocks.storageFrom } },
}));

const remoteDocument = {
  tripId: "trip-a",
  documentId: "document-a",
  fileName: "Boarding Pass.pdf",
  storageBucket: "travel-documents",
  storagePath: "trip/trip-a/documents/document-a-boarding-pass.pdf",
};

describe("remote document download", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.deleteAsync.mockResolvedValue(undefined);
    mocks.makeDirectoryAsync.mockResolvedValue(undefined);
    mocks.moveAsync.mockResolvedValue(undefined);
    mocks.getInfoAsync.mockResolvedValue({
      exists: false,
      uri: "file:///documents/travel-documents/cache/trip/trip-a/document-a-boarding-pass.pdf",
      isDirectory: false,
    });
    mocks.createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://example.com/signed-document" },
      error: null,
    });
    mocks.storageFrom.mockReturnValue({
      createSignedUrl: mocks.createSignedUrl,
    });
    mocks.downloadAsync.mockResolvedValue({
      uri: "file:///documents/travel-documents/cache/trip/trip-a/document-a-boarding-pass.pdf.download",
      status: 200,
      headers: {},
      mimeType: "application/pdf",
    });
  });

  it("downloads a private document into durable local storage", async () => {
    const { downloadTravelDocumentFromStorage } = await import("./document");

    await expect(
      downloadTravelDocumentFromStorage(remoteDocument),
    ).resolves.toBe(
      "file:///documents/travel-documents/cache/trip/trip-a/document-a-boarding-pass.pdf",
    );

    expect(mocks.storageFrom).toHaveBeenCalledWith("travel-documents");
    expect(mocks.createSignedUrl).toHaveBeenCalledWith(
      remoteDocument.storagePath,
      60,
    );
    expect(mocks.downloadAsync).toHaveBeenCalledWith(
      "https://example.com/signed-document",
      "file:///documents/travel-documents/cache/trip/trip-a/document-a-boarding-pass.pdf.download",
    );
    expect(mocks.moveAsync).toHaveBeenCalledWith({
      from: "file:///documents/travel-documents/cache/trip/trip-a/document-a-boarding-pass.pdf.download",
      to: "file:///documents/travel-documents/cache/trip/trip-a/document-a-boarding-pass.pdf",
    });
  });

  it("reuses an existing downloaded document", async () => {
    mocks.getInfoAsync.mockResolvedValue({
      exists: true,
      uri: "file:///documents/travel-documents/cache/trip/trip-a/document-a-boarding-pass.pdf",
      isDirectory: false,
    });
    const { downloadTravelDocumentFromStorage } = await import("./document");

    await expect(
      downloadTravelDocumentFromStorage(remoteDocument),
    ).resolves.toBe(
      "file:///documents/travel-documents/cache/trip/trip-a/document-a-boarding-pass.pdf",
    );

    expect(mocks.createSignedUrl).not.toHaveBeenCalled();
    expect(mocks.downloadAsync).not.toHaveBeenCalled();
  });

  it("removes an incomplete document after a failed download", async () => {
    mocks.downloadAsync.mockResolvedValue({
      uri: "file:///documents/travel-documents/cache/trip/trip-a/document-a-boarding-pass.pdf.download",
      status: 404,
      headers: {},
      mimeType: "application/json",
    });
    const { downloadTravelDocumentFromStorage } = await import("./document");

    await expect(
      downloadTravelDocumentFromStorage(remoteDocument),
    ).rejects.toThrow("Document download failed with status 404");

    expect(mocks.deleteAsync).toHaveBeenLastCalledWith(
      "file:///documents/travel-documents/cache/trip/trip-a/document-a-boarding-pass.pdf.download",
      { idempotent: true },
    );
    expect(mocks.moveAsync).not.toHaveBeenCalled();
  });
});
