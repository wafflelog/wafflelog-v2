import { describe, expect, it } from "vitest";

import {
  buildCreatePlanningRefinementRequest,
  EMPTY_PLANNING_REFINEMENT_ERROR,
} from "./refinement-request";

describe("AI planning refinement request builder", () => {
  it("trims feedback before creating the API request", () => {
    expect(
      buildCreatePlanningRefinementRequest(
        "  Make day two more relaxed and add a garden.  ",
      ),
    ).toEqual({
      content: "Make day two more relaxed and add a garden.",
    });
  });

  it("rejects empty feedback", () => {
    expect(() => buildCreatePlanningRefinementRequest("   ")).toThrow(
      EMPTY_PLANNING_REFINEMENT_ERROR,
    );
  });
});
