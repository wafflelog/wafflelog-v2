export type AuthCallbackResult =
  | {
      type: "session";
      accessToken: string;
      refreshToken: string;
      flow: AuthCallbackFlow;
    }
  | {
      type: "error";
      message: string;
    };

export type AuthCallbackFlow = "signup" | "recovery" | "unknown";

export type AuthCallbackSession = Extract<
  AuthCallbackResult,
  { type: "session" }
>;

type AuthCallbackSessionState = {
  status: "processing" | "recovery-ready" | "completed";
  sessionPromise: Promise<void>;
};

const authCallbackSessionStates = new Map<
  string,
  AuthCallbackSessionState
>();
let activeRecoveryAccessToken: string | null = null;

const INVALID_LINK_MESSAGE =
  "Unable to use this email link. It may be invalid or expired.";

const AUTH_CALLBACK_FLOW_BY_TYPE: Record<string, AuthCallbackFlow> = {
  signup: "signup",
  recovery: "recovery",
};

function getCallbackParameters(url: string) {
  const queryStart = url.indexOf("?");
  const fragmentStart = url.indexOf("#");
  const queryEnd = fragmentStart === -1 ? url.length : fragmentStart;
  const query =
    queryStart === -1 ? "" : url.slice(queryStart + 1, queryEnd);
  const fragment = fragmentStart === -1 ? "" : url.slice(fragmentStart + 1);
  const parameters = new URLSearchParams(query);

  new URLSearchParams(fragment).forEach((value, key) => {
    parameters.set(key, value);
  });

  return parameters;
}

export function parseAuthCallbackUrl(url: string): AuthCallbackResult {
  const parameters = getCallbackParameters(url);
  const error = parameters.get("error");
  const errorDescription = parameters.get("error_description");

  if (error || errorDescription) {
    return {
      type: "error",
      message: errorDescription || INVALID_LINK_MESSAGE,
    };
  }

  const accessToken = parameters.get("access_token");
  const refreshToken = parameters.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return {
      type: "error",
      message: INVALID_LINK_MESSAGE,
    };
  }

  return {
    type: "session",
    accessToken,
    refreshToken,
    flow:
      AUTH_CALLBACK_FLOW_BY_TYPE[parameters.get("type") ?? ""] ?? "unknown",
  };
}

export async function processAuthCallbackSessionOnce(
  callback: AuthCallbackSession,
  establishSession: () => Promise<unknown>,
) {
  let state = authCallbackSessionStates.get(callback.accessToken);

  if (!state) {
    const nextState: AuthCallbackSessionState = {
      status: "processing",
      sessionPromise: Promise.resolve(),
    };

    nextState.sessionPromise = Promise.resolve()
      .then(establishSession)
      .then(() => {
        nextState.status =
          callback.flow === "recovery" ? "recovery-ready" : "completed";

        if (callback.flow === "recovery") {
          activeRecoveryAccessToken = callback.accessToken;
        }
      })
      .catch((error) => {
        if (
          authCallbackSessionStates.get(callback.accessToken) === nextState
        ) {
          authCallbackSessionStates.delete(callback.accessToken);
        }

        if (activeRecoveryAccessToken === callback.accessToken) {
          activeRecoveryAccessToken = null;
        }

        throw error;
      });

    authCallbackSessionStates.set(callback.accessToken, nextState);
    state = nextState;
  }

  await state.sessionPromise;

  return state.status === "recovery-ready" ? "/reset-password" : "/";
}

export function completePasswordRecoveryCallback() {
  if (!activeRecoveryAccessToken) {
    return;
  }

  const state = authCallbackSessionStates.get(activeRecoveryAccessToken);

  if (state?.status === "recovery-ready") {
    state.status = "completed";
  }

  activeRecoveryAccessToken = null;
}

export function isPasswordRecoveryCallbackActive() {
  if (!activeRecoveryAccessToken) {
    return false;
  }

  return (
    authCallbackSessionStates.get(activeRecoveryAccessToken)?.status ===
    "recovery-ready"
  );
}
