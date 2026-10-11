import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  viewDocument: vi.fn(),
}));

vi.mock("@react-native-documents/viewer", () => ({
  errorCodes: {
    NULL_PRESENTER: "NULL_PRESENTER",
    UNABLE_TO_OPEN_FILE_TYPE: "UNABLE_TO_OPEN_FILE_TYPE",
  },
  isErrorWithCode: (error: unknown) =>
    error instanceof Error && "code" in error,
  viewDocument: mocks.viewDocument,
}));

const localDocument = {
  localUri: "file:///documents/ticket.pdf",
  fileName: "Ticket.pdf",
  mimeType: "application/pdf",
};

describe("native document viewer", () => {
  beforeEach(() => {
    mocks.viewDocument.mockReset();
    mocks.viewDocument.mockResolvedValue(null);
  });

  it("opens a local document with read-only native access", async () => {
    const { openLocalDocument } = await import("./open-document");

    await expect(openLocalDocument(localDocument)).resolves.toBeUndefined();
    expect(mocks.viewDocument).toHaveBeenCalledWith({
      uri: localDocument.localUri,
      mimeType: localDocument.mimeType,
      headerTitle: localDocument.fileName,
      grantPermissions: "read",
      presentationStyle: "fullScreen",
    });
  });

  it("maps an unsupported file type to a user-facing error", async () => {
    mocks.viewDocument.mockRejectedValue(
      Object.assign(new Error("Native viewer error"), {
        code: "UNABLE_TO_OPEN_FILE_TYPE",
      }),
    );
    const { openLocalDocument } = await import("./open-document");

    await expect(openLocalDocument(localDocument)).rejects.toThrow(
      "No compatible app is available to open this document",
    );
  });

  it("preserves unexpected viewer errors", async () => {
    const error = new Error("Unexpected viewer failure");
    mocks.viewDocument.mockRejectedValue(error);
    const { openLocalDocument } = await import("./open-document");

    await expect(openLocalDocument(localDocument)).rejects.toBe(error);
  });
});
