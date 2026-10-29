import { AuthScreen } from "@/components/auth/auth-screen";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { actionResendSignUpConfirmation } from "@/lib/supabase/actions";
import { useMutation } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { Link, Redirect, router, useLocalSearchParams } from "expo-router";
import { MailCheck } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailScreen() {
  const { isAuthenticated } = useAuthSession();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const { email } = useLocalSearchParams<{ email?: string | string[] }>();
  const submittedEmail = Array.isArray(email) ? email[0] : email;
  const normalizedEmail = submittedEmail?.trim() ?? "";
  const [resendCooldown, setResendCooldown] = useState(0);

  const resendMutation = useMutation({
    mutationFn: (input: Parameters<typeof actionResendSignUpConfirmation>[0]) =>
      actionResendSignUpConfirmation(input),
    onSuccess: () => {
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      showMessage(
        "If this address still needs confirmation, check your inbox for a new link",
        "info",
      );
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to resend the confirmation email";
      showMessage(message, "error");
    },
  });

  useEffect(() => {
    if (resendCooldown === 0) {
      return;
    }

    const timeout = setTimeout(() => {
      setResendCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1_000);

    return () => clearTimeout(timeout);
  }, [resendCooldown]);

  const handleResend = () => {
    if (!normalizedEmail) {
      showMessage("Return to registration and enter your email again", "error");
      return;
    }

    resendMutation.mutate({
      email: normalizedEmail,
      emailRedirectTo: Linking.createURL("auth/callback"),
    });
  };

  const isResendDisabled =
    resendMutation.isPending || resendCooldown > 0 || !normalizedEmail;
  const resendLabel = resendMutation.isPending
    ? "Sending..."
    : resendCooldown > 0
      ? `Resend in ${resendCooldown}s`
      : "Resend email";

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <>
      <AuthScreen
        eyebrow="ONE MORE STEP"
        title="Check your email"
        subtitle="If this address still needs confirming, check your inbox for a verification link."
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MailCheck size={30} color={getColor(colors.purple)} />
          </View>

          <View style={styles.message}>
            <TitleRegular size="sm" color={colors.textLightGrey}>
              Check this email for a confirmation link
            </TitleRegular>
            <TitleRegular
              size="md"
              weight="700"
              color={colors.textDarkGrey}
              style={styles.email}
            >
              {normalizedEmail || "your email address"}
            </TitleRegular>
            <TitleRegular size="sm" color={colors.textLightGrey}>
              Already confirmed your address? Return to log in.
            </TitleRegular>
          </View>

          <View style={styles.resendRow}>
            <TitleRegular size="sm" color={colors.textLightGrey}>
              Didn&apos;t receive it?
            </TitleRegular>
            <Pressable
              style={styles.resendButton}
              hitSlop={8}
              onPress={handleResend}
              disabled={isResendDisabled}
              accessibilityRole="button"
              accessibilityState={{
                disabled: isResendDisabled,
                busy: resendMutation.isPending,
              }}
            >
              <TitleRegular
                size="sm"
                color={
                  isResendDisabled ? colors.textLightGrey : colors.purple
                }
                weight="700"
              >
                {resendLabel}
              </TitleRegular>
            </Pressable>
          </View>

          <AuthSubmitButton
            label="Back to log in"
            pendingLabel="Back to log in"
            isPending={false}
            onPress={() => router.replace("/login")}
          />

          <Link href="/register" asChild replace>
            <Pressable style={styles.changeEmailButton} hitSlop={8}>
              <TitleRegular size="sm" color={colors.purple} weight="700">
                Use a different email
              </TitleRegular>
            </Pressable>
          </Link>
        </View>
      </AuthScreen>

      <SystemMessageModal />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    gap: gaps.lg,
  },
  iconContainer: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    backgroundColor: getColor(colors.purple, 0.1),
  },
  message: {
    width: "100%",
    alignItems: "center",
    gap: gaps.xs,
  },
  email: {
    maxWidth: "100%",
    textAlign: "center",
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xs,
    flexWrap: "wrap",
  },
  resendButton: {
    paddingVertical: gaps.xxs,
  },
  changeEmailButton: {
    paddingVertical: gaps.xxs,
  },
});
