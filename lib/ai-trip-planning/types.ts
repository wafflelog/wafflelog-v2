import type { components, operations } from "./generated";

export type CreatePlanningSessionRequest = NonNullable<
  operations["createPlanningSession"]["requestBody"]
>["content"]["application/json"];

export type CreatePlanningRefinementRequest = NonNullable<
  operations["createPlanningRefinement"]["requestBody"]
>["content"]["application/json"];

export type PlanningSessionAccepted = components["schemas"]["PlanningSessionAccepted"];

export type PlanningRefinementAccepted =
  components["schemas"]["PlanningRefinementAccepted"];

export type PlanningSession = components["schemas"]["PlanningSession"];

export type PlanningJob =
  operations["getPlanningJob"]["responses"][200]["content"]["application/json"];

export type PlanningResult = components["schemas"]["PlanningResult"];

export type PlanningJobStatus = PlanningJob["status"];

export type PlanningApiResponse<T> = {
  data: T;
  retryAfterMs: number | null;
};

