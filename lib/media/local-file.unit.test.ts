import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteAsync: vi.fn(),
}));

vi.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///documents/",
  deleteAsync: mocks.deleteAsync,
}));

describe("local file removal", () => {
  beforeEach(() => {
    mocks.deleteAsync.mockReset();
    mocks.deleteAsync.mockResolvedValue(undefined);
  });

  it("removes a local file idempotently", async () => {
    const { removeLocalFile } = await import("./local-file");

    await removeLocalFile("file:///documents/image.jpg");

    expect(mocks.deleteAsync).toHaveBeenCalledWith(
      "file:///documents/image.jpg",
      { idempotent: true },
    );
  });

  it("ignores an absent local URI", async () => {
    const { removeLocalFile } = await import("./local-file");

    await removeLocalFile(null);

    expect(mocks.deleteAsync).not.toHaveBeenCalled();
  });

  it("removes all Wafflelog-managed media directories", async () => {
    const { clearLocalMediaFiles } = await import("./local-file");

    await clearLocalMediaFiles();

    expect(mocks.deleteAsync.mock.calls).toEqual([
      ["file:///documents/images", { idempotent: true }],
      ["file:///documents/travel-documents", { idempotent: true }],
      ["file:///documents/place-images", { idempotent: true }],
    ]);
  });
});
