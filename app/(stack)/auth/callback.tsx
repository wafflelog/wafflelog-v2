import { AuthScreen } from "@/components/auth/auth-screen";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import {
  parseAuthCallbackUrl,
  type AuthCallbackFlow,
} from "@/lib/auth/auth-callback";
import { actionSetSessionFromAuthCallback } from "@/lib/supabase/actions";
import { sendTrackingEvent } from "@/lib/tracking";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { CircleAlert } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

const CALLBACK_COPY_BY_FLOW: Record<
  AuthCallbackFlow,
  {
    eyebrow: string;
    title: string;
    message: string;
    destination: "/" | "/reset-password";
  }
> = {
  signup: {
    eyebrow: "EMAIL CONFIRMATION",
    title: "Confirming your email",
    message: "Verifying your confirmation link and securely signing you in.",
    destination: "/",
  },
  recovery: {
    eyebrow: "PASSWORD RECOVERY",
    title: "Opening password reset",
    message: "Verifying your reset link and securely opening your account.",
    destination: "/reset-password",
  },
  unknown: {
    eyebrow: "SECURE SIGN IN",
    title: "Opening Wafflelog",
    message: "Verifying your email link and securely signing you in.",
    destination: "/",
  },
};

export default function AuthCallbackScreen() {
  const linkingUrl = Linking.useLinkingURL();
  const lastProcessedUrl = useRef<string | null>(null);
  const [sessionError, setSessionError] = useState<{
    url: string;
    message: string;
  } | null>(null);
  const callback = useMemo(
    () => (linkingUrl ? parseAuthCallbackUrl(linkingUrl) : null),
    [linkingUrl],
  );

  useEffect(() => {
    if (
      !linkingUrl ||
      callback?.type !== "session" ||
      lastProcessedUrl.current === linkingUrl
    ) {
      return;
    }

    lastProcessedUrl.current = linkingUrl;
    let isActive = true;

    const createSession = async () => {
      try {
        await actionSetSessionFromAuthCallback(callback);

        if (callback.flow === "signup") {
          void sendTrackingEvent("email_verified", { method: "email" });
        }

        if (isActive) {
          router.replace(CALLBACK_COPY_BY_FLOW[callback.flow].destination);
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        setSessionError({
          url: linkingUrl,
          message:
            error instanceof Error
              ? error.message
              : "Unable to use this email link. Please try again.",
        });
      }
    };

    createSession();

    return () => {
      isActive = false;
    };
  }, [callback, linkingUrl]);

  const callbackError = callback?.type === "error" ? callback.message : null;
  const activeSessionError =
    sessionError?.url === linkingUrl ? sessionError.message : null;
  const errorMessage = callbackError || activeSessionError;
  const hasError = Boolean(errorMessage);
  const flow = callback?.type === "session" ? callback.flow : "unknown";
  const copy = CALLBACK_COPY_BY_FLOW[flow];

  return (
    <AuthScreen
      eyebrow={copy.eyebrow}
      title={hasError ? "We couldn't open this link" : copy.title}
      subtitle={
        hasError
          ? "Return to log in or open a newer email and try again."
          : "This should only take a moment."
      }
    >
      <View style={styles.content}>
        {hasError ? (
          <>
            <View style={styles.errorIconContainer}>
              <CircleAlert size={30} color={getColor(colors.red)} />
            </View>
            <TitleRegular
              size="sm"
              color={colors.textLightGrey}
              style={styles.message}
            >
              {errorMessage}
            </TitleRegular>
            <AuthSubmitButton
              label="Back to log in"
              pendingLabel="Back to log in"
              isPending={false}
              onPress={() => router.replace("/login")}
            />
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={getColor(colors.purple)} />
            <TitleRegular
              size="sm"
              color={colors.textLightGrey}
              style={styles.message}
            >
              {copy.message}
            </TitleRegular>
          </>
        )}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    gap: gaps.lg,
  },
  errorIconContainer: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    backgroundColor: getColor(colors.red, 0.1),
  },
  message: {
    width: "100%",
    textAlign: "center",
  },
});
