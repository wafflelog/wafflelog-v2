import { supabase } from "@/lib/supabase/client";

export const feedbackCategories = ["feedback", "bug", "help"] as const;
export const feedbackMessageLimit = 2000;

export type FeedbackCategory = (typeof feedbackCategories)[number];

export type SubmitFeedbackInput = {
  requestId: string;
  category: FeedbackCategory;
  message: string;
  appVersion?: string;
  buildNumber?: string;
  platform?: string;
  osVersion?: string;
};

type SubmitFeedbackResult = {
  ok: true;
};

type SubmitFeedbackDependencies = {
  invoke: (
    input: SubmitFeedbackInput,
  ) => Promise<{ data: SubmitFeedbackResult | null; error: Error | null }>;
};

const defaultDependencies: SubmitFeedbackDependencies = {
  invoke: (input) =>
    supabase.functions.invoke<SubmitFeedbackResult>("submit-feedback", {
      method: "POST",
      body: input,
    }),
};

export async function actionSubmitFeedback(
  input: SubmitFeedbackInput,
  dependencies: SubmitFeedbackDependencies = defaultDependencies,
) {
  const { data, error } = await dependencies.invoke(input);

  if (error || data?.ok !== true) {
    throw new Error("We couldn't send your message. Please try again.");
  }
}
