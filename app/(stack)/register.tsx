import { AuthField } from "@/components/auth/auth-field";
import { AuthScreen } from "@/components/auth/auth-screen";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { actionSignUpWithEmail } from "@/lib/supabase/actions";
import { useMutation } from "@tanstack/react-query";
import { Link, Redirect, router } from "expo-router";
import { LockKeyhole, Mail, UserRound } from "lucide-react-native";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const USERNAME_PATTERN = /^[a-z0-9_]+$/;

export default function RegisterScreen() {
  const { isAuthenticated, isLoading } = useAuthSession();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const signUpMutation = useMutation({
    mutationFn: (input: Parameters<typeof actionSignUpWithEmail>[0]) =>
      actionSignUpWithEmail(input),
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

    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedUsername) {
      showMessage("Enter your username", "error");
      return;
    }

    if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
      showMessage("Username must be between 3 and 30 characters", "error");
      return;
    }

    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      showMessage(
        "Username can only use lowercase letters, numbers, and underscores",
        "error",
      );
      return;
    }

    if (password.length < 6) {
      showMessage("Password must be at least 6 characters", "error");
      return;
    }

    signUpMutation.mutate({
      email,
      password,
      username: normalizedUsername,
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
        eyebrow="CREATE YOUR ACCOUNT"
        title="Start with an idea. Build a plan."
        subtitle="Give us the basics. We’ll suggest ideas and draft your trip."
      >
        <View style={styles.form}>
          <AuthField
            label="Username"
            placeholder="Choose a username"
            value={username}
            onChangeText={(value) =>
              setUsername(value.toLowerCase().replace(/\s+/g, ""))
            }
            icon={UserRound}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            textContentType="username"
            autoComplete="username-new"
            returnKeyType="next"
            onSubmitEditing={() => emailInputRef.current?.focus()}
            helperText="3–30 characters · lowercase letters, numbers, or underscores"
            disabled={signUpMutation.isPending}
          />
          <AuthField
            ref={emailInputRef}
            label="Email address"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            icon={Mail}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            disabled={signUpMutation.isPending}
          />
          <AuthField
            ref={passwordInputRef}
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            icon={LockKeyhole}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            returnKeyType="done"
            onSubmitEditing={handleRegister}
            helperText="Use at least 6 characters"
            disabled={signUpMutation.isPending}
          />
          <AuthSubmitButton
            label="Create account"
            pendingLabel="Creating account..."
            isPending={signUpMutation.isPending}
            onPress={handleRegister}
          />
          <View style={styles.footer}>
            <TitleRegular size="sm" color={colors.textLightGrey}>
              Already have an account?
            </TitleRegular>
            <Link href="/login" asChild replace>
              <Pressable style={styles.switchButton} hitSlop={8}>
                <TitleRegular
                  size="sm"
                  color={colors.pineGreen}
                  weight="700"
                >
                  Log in
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
    backgroundColor: "#FFF9E8",
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
