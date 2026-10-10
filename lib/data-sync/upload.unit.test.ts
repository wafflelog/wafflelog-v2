import { beforeEach, describe, expect, it, vi } from "vitest";

const sync = vi.hoisted(() => ({
  checklistItems: vi.fn(),
  documents: vi.fn(),
  expenses: vi.fn(),
  images: vi.fn(),
  notes: vi.fn(),
  pins: vi.fn(),
  pinLocations: vi.fn(),
  referenceLinks: vi.fn(),
  trips: vi.fn(),
}));

vi.mock("@/lib/sqlite/model/checklist-item", () => ({
  actionSyncPendingLocalChecklistItems: sync.checklistItems,
}));
vi.mock("@/lib/sqlite/model/document", () => ({
  actionSyncPendingLocalDocuments: sync.documents,
}));
vi.mock("@/lib/sqlite/model/expense", () => ({
  actionSyncPendingLocalExpenses: sync.expenses,
}));
vi.mock("@/lib/sqlite/model/image", () => ({
  actionSyncPendingLocalImages: sync.images,
}));
vi.mock("@/lib/sqlite/model/note", () => ({
  actionSyncPendingLocalNotes: sync.notes,
}));
vi.mock("@/lib/sqlite/model/pin", () => ({
  actionSyncPendingLocalPins: sync.pins,
}));
vi.mock("@/lib/sqlite/model/pin-location", () => ({
  actionSyncPendingLocalPinLocations: sync.pinLocations,
}));
vi.mock("@/lib/sqlite/model/reference-link", () => ({
  actionSyncPendingLocalReferenceLinks: sync.referenceLinks,
}));
vi.mock("@/lib/sqlite/model/trip", () => ({
  actionSyncPendingLocalTrips: sync.trips,
}));

describe("pending upload orchestration", () => {
  beforeEach(() => {
    Object.values(sync).forEach((upload) => {
      upload.mockReset();
      upload.mockResolvedValue({ hasMore: false });
    });
  });

  it("attempts image uploads after document uploads fail", async () => {
    sync.documents.mockRejectedValue(new Error("Document upload failed"));
    const { uploadPendingChanges } = await import("./upload");

    await expect(uploadPendingChanges("user-a")).rejects.toThrow(
      "Document upload failed",
    );

    expect(sync.documents).toHaveBeenCalledWith("user-a", 25);
    expect(sync.images).toHaveBeenCalledWith("user-a", 25);
  });
});
