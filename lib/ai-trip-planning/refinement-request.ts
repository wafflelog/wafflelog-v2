import { type CreatePlanningRefinementRequest } from "./types";

export const EMPTY_PLANNING_REFINEMENT_ERROR =
  "Tell me what you’d like to change in the draft.";

export function buildCreatePlanningRefinementRequest(
  input: string,
): CreatePlanningRefinementRequest {
  const content = input.trim();

  if (!content) {
    throw new Error(EMPTY_PLANNING_REFINEMENT_ERROR);
  }

  return { content };
}
