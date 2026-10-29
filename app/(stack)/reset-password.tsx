import { AuthField } from "@/components/auth/auth-field";
import { AuthScreen } from "@/components/auth/auth-screen";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, semanticColors } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { completePasswordRecoveryCallback } from "@/lib/auth/auth-callback";
import { actionUpdatePassword } from "@/lib/supabase/actions";
import { useMutation } from "@tanstack/react-query";
import { Redirect, router } from "expo-router";
import { LockKeyhole } from "lucide-react-native";
import { useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading } = useAuthSession();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const [password, setPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");

  const updatePasswordMutation = useMutation({
    mutationFn: (input: Parameters<typeof actionUpdatePassword>[0]) =>
      actionUpdatePassword(input),
    onSuccess: () => {
      setPassword("");
      setConfirmedPassword("");
      completePasswordRecoveryCallback();
      showMessage("Your password has been updated", "info");
      router.replace("/");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to update password";
      showMessage(message, "error");
    },
  });

  const handleSubmit = () => {
    if (password.length < 6) {
      showMessage("Password must be at least 6 characters", "error");
      return;
    }

    if (password !== confirmedPassword) {
      showMessage("Passwords do not match", "error");
      return;
    }

    updatePasswordMutation.mutate({ password });
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

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <>
      <AuthScreen
        eyebrow="PASSWORD RECOVERY"
        title="Choose a new password"
        subtitle="Use at least 6 characters, then you'll be ready to continue planning."
      >
        <View style={styles.form}>
          <AuthField
            label="New password"
            placeholder="Enter a new password"
            value={password}
            onChangeText={setPassword}
            icon={LockKeyhole}
            secureTextEntry
            autoFocus
            textContentType="newPassword"
            autoComplete="new-password"
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
            helperText="At least 6 characters"
            disabled={updatePasswordMutation.isPending}
          />
          <AuthField
            ref={confirmPasswordInputRef}
            label="Confirm new password"
            placeholder="Enter it again"
            value={confirmedPassword}
            onChangeText={setConfirmedPassword}
            icon={LockKeyhole}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            disabled={updatePasswordMutation.isPending}
          />
          <AuthSubmitButton
            label="Update password"
            pendingLabel="Updating..."
            isPending={updatePasswordMutation.isPending}
            onPress={handleSubmit}
          />
        </View>
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
});
