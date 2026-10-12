export type AuthCallbackResult =
  | {
      type: "session";
      accessToken: string;
      refreshToken: string;
    }
  | {
      type: "error";
      message: string;
    };

const INVALID_LINK_MESSAGE =
  "Unable to confirm your email. The link may be invalid or expired.";

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
  };
}
