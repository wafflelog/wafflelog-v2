import { UIInputText } from "@/components/ui/input/text";
import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
  getShadowStyle,
} from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { actionSignUpWithEmail } from "@/lib/supabase/actions";
import { useMutation } from "@tanstack/react-query";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, View } from "react-native";

export default function RegisterScreen() {
  const { isAuthenticated, isLoading } = useAuthSession();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signUpMutation = useMutation({
    mutationFn: actionSignUpWithEmail,
    onSuccess: (data) => {
      setPassword("");

      if (data.session) {
        showMessage("Account created", "info");
        router.replace("/");
        return;
      }

      showMessage("Check your email to confirm your account", "info");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to create account";
      showMessage(message, "error");
    },
  });

  const handleRegister = () => {
    if (!email.trim()) {
      showMessage("Enter your email", "error");
      return;
    }

    if (!password) {
      showMessage("Enter your password", "error");
      return;
    }

    if (password.length < 6) {
      showMessage("Password must be at least 6 characters", "error");
      return;
    }

    signUpMutation.mutate({
      email,
      password,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <TitleRegular size="lg" color={colors.textDarkGrey}>
          Loading...
        </TitleRegular>
      </SafeAreaView>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.hero}>
        <TitleRegular size="xxl" color={colors.textDarkGrey} style={styles.title}>
          Welcome to Wafflelog
        </TitleRegular>
        <TitleRegular size="md" color={colors.textLightGrey} style={styles.subtitle}>
          Create an account to save trips, sync your travel log, and unlock the
          rest of the app.
        </TitleRegular>
      </View>

      <View style={styles.card}>
        <View style={styles.form}>
          <UIInputText
            placeholder="Email"
            value={email}
            onChange={setEmail}
            autoFocus
            keyboardType="email-address"
          />
          <UIInputText
            placeholder="Password"
            value={password}
            onChange={setPassword}
            secureTextEntry
          />
          <Pressable
            style={[
              styles.primaryButton,
              signUpMutation.isPending && styles.primaryButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={signUpMutation.isPending}
          >
            <TitleRegular size="md" color={colors.white} weight="600">
              {signUpMutation.isPending ? "Creating account..." : "Create account"}
            </TitleRegular>
          </Pressable>
        </View>
      </View>

      <SystemMessageModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    paddingHorizontal: gaps.lg,
    paddingVertical: gaps.xl,
    justifyContent: "center",
    gap: gaps.xl,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F7FA",
  },
  hero: {
    gap: gaps.sm,
  },
  title: {
    lineHeight: 32,
  },
  subtitle: {
    lineHeight: 24,
  },
  card: {
    backgroundColor: getColor(colors.white),
    borderRadius: borderRadiuses.lg,
    padding: gaps.lg,
    gap: gaps.md,
    ...getShadowStyle("md"),
  },
  form: {
    gap: gaps.md,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.waffle),
    borderRadius: borderRadiuses.md,
    minHeight: 52,
    paddingHorizontal: gaps.md,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
});
