import { AuthField } from "@/components/auth/auth-field";
import { AuthScreen } from "@/components/auth/auth-screen";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, semanticColors } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { actionSignInWithEmail } from "@/lib/supabase/actions";
import { useMutation } from "@tanstack/react-query";
import { Link, Redirect, router } from "expo-router";
import { LockKeyhole, Mail } from "lucide-react-native";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const { isAuthenticated, isLoading } = useAuthSession();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const passwordInputRef = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signInMutation = useMutation({
    mutationFn: (input: Parameters<typeof actionSignInWithEmail>[0]) =>
      actionSignInWithEmail(input),
    onSuccess: () => {
      setPassword("");
      showMessage("Welcome back", "info");
      router.replace("/");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to log in";
      showMessage(message, "error");
    },
  });

  const handleLogin = () => {
    if (!email.trim()) {
      showMessage("Enter your email", "error");
      return;
    }

    if (!password) {
      showMessage("Enter your password", "error");
      return;
    }

    signInMutation.mutate({
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
    <>
      <AuthScreen
        eyebrow="WELCOME BACK"
        title="Get your next trip ready."
        subtitle="Keep every trip organised, everyone aligned, and all expenses tracked in one place."
      >
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
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            disabled={signInMutation.isPending}
          />
          <AuthField
            ref={passwordInputRef}
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            icon={LockKeyhole}
            secureTextEntry
            textContentType="password"
            autoComplete="current-password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            disabled={signInMutation.isPending}
          />
          <AuthSubmitButton
            label="Log in"
            pendingLabel="Logging in..."
            isPending={signInMutation.isPending}
            onPress={handleLogin}
          />
          <View style={styles.footer}>
            <TitleRegular size="sm" color={colors.textLightGrey}>
              New to Wafflelog?
            </TitleRegular>
            <Link href="/register" asChild replace>
              <Pressable style={styles.switchButton} hitSlop={8}>
                <TitleRegular
                  size="sm"
                  color={colors.purple}
                  weight="700"
                >
                  Create an account
                </TitleRegular>
              </Pressable>
            </Link>
          </View>
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
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xs,
    flexWrap: "wrap",
  },
  switchButton: {
    paddingVertical: gaps.xxs,
  },
});
