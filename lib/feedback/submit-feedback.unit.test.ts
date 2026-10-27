import { describe, expect, it, vi } from "vitest";

import {
  actionSubmitFeedback,
  type SubmitFeedbackInput,
} from "./submit-feedback";

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    functions: { invoke: vi.fn() },
  },
}));

const input: SubmitFeedbackInput = {
  requestId: "8f11c76b-0e39-43f8-91ce-cbc92334c2e0",
  category: "feedback",
  message: "The shared trip view is very useful.",
  appVersion: "1.0.0",
  buildNumber: "42",
  platform: "ios",
  osVersion: "18.0",
};

describe("feedback submission", () => {
  it("sends the supplied feedback to the Edge Function", async () => {
    const invoke = vi.fn(async () => ({
      data: { ok: true as const },
      error: null,
    }));

    await actionSubmitFeedback(input, { invoke });

    expect(invoke).toHaveBeenCalledWith(input);
  });

  it("returns a retryable message when delivery fails", async () => {
    const invoke = vi.fn(async () => ({
      data: null,
      error: new Error("Provider unavailable"),
    }));

    await expect(actionSubmitFeedback(input, { invoke })).rejects.toThrow(
      "We couldn't send your message. Please try again.",
    );
  });
});
