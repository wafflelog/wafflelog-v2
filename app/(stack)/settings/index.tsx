import { AppHeader } from "@/components/header/app-header";
import { HeaderBackButton } from "@/components/header/icon-button";
import { UIText } from "@/components/ui/text";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
  semanticColors,
} from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "expo-router";
import { LogOut as LogOutIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const username = session?.user.user_metadata.username || "Traveler";
  const usernameInitial = username.trim().charAt(0).toUpperCase() || "T";

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <AppHeader
        title="Settings"
        leading={<HeaderBackButton onPress={() => router.back()} />}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <UIText style={styles.sectionLabel} weight="700">
          Account
        </UIText>

        <View style={styles.accountCard}>
          <View style={styles.avatar}>
            <UIText style={styles.avatarText} weight="700">
              {usernameInitial}
            </UIText>
          </View>
          <View style={styles.accountDetails}>
            <UIText style={styles.accountLabel}>Username</UIText>
            <UIText style={styles.username} weight="700">
              @{username}
            </UIText>
          </View>
        </View>

        <Pressable
          accessibilityLabel="Sign out"
          accessibilityRole="button"
          disabled={isSigningOut}
          onPress={() => void handleSignOut()}
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && styles.signOutButtonPressed,
            isSigningOut && styles.signOutButtonDisabled,
          ]}
        >
          <LogOutIcon size={20} color={getColor(colors.red)} />
          <UIText style={styles.signOutText} weight="700">
            {isSigningOut ? "Signing out…" : "Sign out"}
          </UIText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.screen,
  },
  content: {
    padding: gaps.md,
    paddingBottom: gaps.xl,
  },
  sectionLabel: {
    marginBottom: gaps.xs,
    color: semanticColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
    padding: gaps.md,
    borderWidth: 1,
    borderColor: semanticColors.neutralDivider,
    borderRadius: borderRadiuses.md,
    backgroundColor: semanticColors.surface,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadiuses.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.purple, 0.12),
  },
  avatarText: {
    color: getColor(colors.purple),
    fontSize: 20,
    lineHeight: 26,
  },
  accountDetails: {
    flex: 1,
    minWidth: 0,
  },
  accountLabel: {
    color: semanticColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  username: {
    marginTop: 2,
    color: semanticColors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
  signOutButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xs,
    marginTop: gaps.lg,
    paddingHorizontal: gaps.md,
    borderWidth: 1,
    borderColor: getColor(colors.red, 0.35),
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.red, 0.06),
  },
  signOutButtonPressed: {
    backgroundColor: getColor(colors.red, 0.12),
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutText: {
    color: getColor(colors.red),
    fontSize: 14,
    lineHeight: 20,
  },
});
