import { describe, expect, it } from "vitest";

import { matchesAccountDeletionConfirmation } from "./delete-account-confirmation";

describe("account deletion confirmation", () => {
  it("requires the exact lowercase word delete", () => {
    expect(matchesAccountDeletionConfirmation("delete")).toBe(true);
    expect(matchesAccountDeletionConfirmation("DELETE")).toBe(false);
    expect(matchesAccountDeletionConfirmation("Delete")).toBe(false);
  });

  it("ignores surrounding whitespace", () => {
    expect(matchesAccountDeletionConfirmation("  delete  ")).toBe(true);
  });
});
