import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  downloadTravelDocumentFromStorage: vi.fn(),
  getInfoAsync: vi.fn(),
  setLocalDocumentUri: vi.fn(),
}));

vi.mock("expo-file-system/legacy", () => ({
  getInfoAsync: mocks.getInfoAsync,
}));

vi.mock("@/lib/media/document", () => ({
  downloadTravelDocumentFromStorage:
    mocks.downloadTravelDocumentFromStorage,
}));

vi.mock("@/lib/sqlite/model/document", () => ({
  actionSetLocalDocumentUri: mocks.setLocalDocumentUri,
}));

const remoteDocument = {
  id: "document-a",
  tripId: "trip-a",
  fileName: "Boarding Pass.pdf",
  localUri: null,
  storageBucket: "travel-documents",
  storagePath: "trip/trip-a/documents/document-a-boarding-pass.pdf",
};

describe("local document file resolution", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.downloadTravelDocumentFromStorage.mockResolvedValue(
      "file:///documents/travel-documents/cache/trip/trip-a/document-a-boarding-pass.pdf",
    );
    mocks.setLocalDocumentUri.mockResolvedValue(undefined);
  });

  it("reuses an existing local document", async () => {
    mocks.getInfoAsync.mockResolvedValue({ exists: true });
    const { resolveLocalDocumentFile } = await import("./local-document");

    await expect(
      resolveLocalDocumentFile({
        ...remoteDocument,
        localUri: "file:///documents/travel-documents/document-a.pdf",
      }),
    ).resolves.toBe("file:///documents/travel-documents/document-a.pdf");

    expect(mocks.downloadTravelDocumentFromStorage).not.toHaveBeenCalled();
    expect(mocks.setLocalDocumentUri).not.toHaveBeenCalled();
  });

  it("downloads a missing document and records its device-local URI", async () => {
    const { resolveLocalDocumentFile } = await import("./local-document");

    await expect(resolveLocalDocumentFile(remoteDocument)).resolves.toBe(
      "file:///documents/travel-documents/cache/trip/trip-a/document-a-boarding-pass.pdf",
    );

    expect(mocks.downloadTravelDocumentFromStorage).toHaveBeenCalledWith({
      tripId: "trip-a",
      documentId: "document-a",
      fileName: "Boarding Pass.pdf",
      storageBucket: "travel-documents",
      storagePath: remoteDocument.storagePath,
    });
    expect(mocks.setLocalDocumentUri).toHaveBeenCalledWith(
      "document-a",
      "file:///documents/travel-documents/cache/trip/trip-a/document-a-boarding-pass.pdf",
    );
  });

  it("does not download a document without remote storage metadata", async () => {
    const { resolveLocalDocumentFile } = await import("./local-document");

    await expect(
      resolveLocalDocumentFile({
        ...remoteDocument,
        storageBucket: "",
        storagePath: "",
      }),
    ).rejects.toThrow("This document is not available on this device");

    expect(mocks.downloadTravelDocumentFromStorage).not.toHaveBeenCalled();
    expect(mocks.setLocalDocumentUri).not.toHaveBeenCalled();
  });
});
