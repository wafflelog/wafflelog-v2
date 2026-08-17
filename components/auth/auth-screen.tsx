import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor, semanticColors } from "@/constants/theme";
import { Image } from "expo-image";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AuthScreenProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthScreen({
  eyebrow,
  title,
  subtitle,
  children,
}: AuthScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topAccent} pointerEvents="none" />
      <View style={styles.bottomAccent} pointerEvents="none" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.brand}>
              <Image
                source={require("../../assets/images/icon.png")}
                style={styles.logo}
                contentFit="cover"
                accessibilityLabel="Wafflelog logo"
              />
              <TitleRegular
                size="xl"
                weight="700"
                color={colors.textDarkGrey}
                style={styles.brandName}
              >
                Wafflelog
              </TitleRegular>
            </View>

            <View style={styles.hero}>
              <View style={styles.eyebrowContainer}>
                <View style={styles.eyebrowDot} />
                <TitleRegular
                  size="xs"
                  weight="700"
                  color={colors.purple}
                  style={styles.eyebrow}
                >
                  {eyebrow}
                </TitleRegular>
              </View>
              <TitleRegular
                size="xxl"
                weight="700"
                color={colors.textDarkGrey}
                style={styles.title}
              >
                {title}
              </TitleRegular>
              <TitleRegular
                size="sm"
                color={colors.textLightGrey}
                style={styles.subtitle}
              >
                {subtitle}
              </TitleRegular>
            </View>

            <View style={styles.card}>{children}</View>

            <TitleRegular
              size="xs"
              color={colors.textLightGrey}
              style={styles.legalText}
            >
              {/* TODO: Link the terms and privacy policy when their URLs exist. */}
              By continuing, you agree to our Terms of Service and acknowledge
              our Privacy Policy.
            </TitleRegular>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: semanticColors.authScreen,
    overflow: "hidden",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: gaps.lg,
    paddingVertical: gaps.xl,
  },
  content: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    gap: gaps.lg,
  },
  topAccent: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -145,
    right: -85,
    backgroundColor: getColor(colors.waffle, 0.22),
  },
  bottomAccent: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    bottom: -145,
    left: -100,
    backgroundColor: getColor(colors.turquoise, 0.12),
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: gaps.sm,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 15,
  },
  brandName: {
    letterSpacing: -0.5,
  },
  hero: {
    gap: gaps.sm,
  },
  eyebrowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xs,
  },
  eyebrowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: getColor(colors.turquoise),
  },
  eyebrow: {
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.8,
  },
  subtitle: {
    lineHeight: 20,
    maxWidth: 420,
  },
  card: {
    backgroundColor: semanticColors.surface,
    borderRadius: 24,
    padding: gaps.lg,
    borderWidth: 1,
    borderColor: semanticColors.brandDivider,
    shadowColor: getColor(colors.black),
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 5,
  },
  legalText: {
    textAlign: "center",
    lineHeight: 17,
  },
});
