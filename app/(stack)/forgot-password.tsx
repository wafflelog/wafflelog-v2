import { AuthField } from "@/components/auth/auth-field";
import { AuthScreen } from "@/components/auth/auth-screen";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
  semanticColors,
} from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { actionRequestPasswordReset } from "@/lib/supabase/actions";
import { useMutation } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { Redirect, router } from "expo-router";
import { Mail, MailCheck } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading } = useAuthSession();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const resetMutation = useMutation({
    mutationFn: (input: Parameters<typeof actionRequestPasswordReset>[0]) =>
      actionRequestPasswordReset(input),
    onSuccess: (_, input) => setSubmittedEmail(input.email.trim()),
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to send reset link";
      showMessage(message, "error");
    },
  });

  const handleSubmit = () => {
    if (!email.trim()) {
      showMessage("Enter your email", "error");
      return;
    }

    resetMutation.mutate({
      email,
      redirectTo: Linking.createURL("auth/callback"),
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingScreen, { paddingTop: insets.top }]}>
        <TitleRegular size="lg" color={colors.textDarkGrey}>
          Loading...
        </TitleRegular>
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <>
      <AuthScreen
        eyebrow={submittedEmail ? "CHECK YOUR EMAIL" : "PASSWORD RECOVERY"}
        title={submittedEmail ? "Reset link sent" : "Reset your password"}
        subtitle={
          submittedEmail
            ? "If an account exists for that email, a password reset link will arrive shortly."
            : "Enter your email and we'll send you a secure reset link."
        }
      >
        {submittedEmail ? (
          <View style={styles.form}>
            <View style={styles.sentIconContainer}>
              <MailCheck size={30} color={getColor(colors.purple)} />
            </View>
            <TitleRegular
              size="sm"
              color={colors.textLightGrey}
              style={styles.centeredText}
            >
              Check {submittedEmail} and follow the link to choose a new
              password.
            </TitleRegular>
            <AuthSubmitButton
              label="Back to log in"
              pendingLabel="Back to log in"
              isPending={false}
              onPress={() => router.replace("/login")}
            />
            <Pressable
              style={styles.textButton}
              onPress={() => setSubmittedEmail(null)}
              hitSlop={8}
            >
              <TitleRegular size="sm" color={colors.purple} weight="700">
                Use a different email
              </TitleRegular>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <AuthField
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              icon={Mail}
              autoFocus
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              disabled={resetMutation.isPending}
            />
            <AuthSubmitButton
              label="Send reset link"
              pendingLabel="Sending..."
              isPending={resetMutation.isPending}
              onPress={handleSubmit}
            />
            <Pressable
              style={styles.textButton}
              onPress={() => router.replace("/login")}
              hitSlop={8}
            >
              <TitleRegular size="sm" color={colors.purple} weight="700">
                Back to log in
              </TitleRegular>
            </Pressable>
          </View>
        )}
      </AuthScreen>
      <SystemMessageModal />
    </>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: semanticColors.authScreen,
  },
  form: {
    gap: gaps.lg,
  },
  sentIconContainer: {
    width: 64,
    height: 64,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.purple, 0.1),
  },
  centeredText: {
    textAlign: "center",
  },
  textButton: {
    alignSelf: "center",
    paddingVertical: gaps.xxs,
  },
});
