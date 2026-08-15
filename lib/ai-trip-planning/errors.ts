export type PlanningApiErrorKind =
  | "authentication"
  | "api"
  | "configuration"
  | "invalid-response"
  | "network"
  | "timeout";

type PlanningApiErrorOptions = {
  kind: PlanningApiErrorKind;
  status?: number;
  detail?: string;
  cause?: unknown;
};

export class PlanningApiError extends Error {
  readonly kind: PlanningApiErrorKind;
  readonly status: number | null;
  readonly detail: string | null;

  constructor(message: string, options: PlanningApiErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "PlanningApiError";
    this.kind = options.kind;
    this.status = options.status ?? null;
    this.detail = options.detail ?? null;
  }
}

export function isPlanningApiError(error: unknown): error is PlanningApiError {
  return error instanceof PlanningApiError;
}
