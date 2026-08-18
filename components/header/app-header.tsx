import { UIText } from "@/components/ui/text";
import { colors, gaps, getColor, semanticColors } from "@/constants/theme";
import { type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AppHeaderProps = {
  leading?: ReactNode;
  sideWidth?: number;
  subtitle?: string | null;
  title: string;
  titleAlign?: "center" | "left";
  trailing?: ReactNode;
};

type HeaderTextButtonProps = {
  accessibilityLabel?: string;
  label: string;
  onPress: () => void;
};

export const AppHeader = ({
  leading,
  sideWidth = 44,
  subtitle,
  title,
  titleAlign = "center",
  trailing,
}: AppHeaderProps) => {
  const isLeftAligned = titleAlign === "left";

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.content}>
        <View
          style={[
            styles.side,
            isLeftAligned ? styles.leftAlignedSide : { width: sideWidth },
          ]}
        >
          {leading}
        </View>
        <View
          style={[
            styles.titleContainer,
            isLeftAligned
              ? styles.leftAlignedTitle
              : styles.centeredTitle,
          ]}
        >
          <UIText
            accessibilityRole="header"
            numberOfLines={1}
            style={styles.title}
            weight="700"
          >
            {title}
          </UIText>
          {subtitle ? (
            <UIText numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </UIText>
          ) : null}
        </View>
        <View
          style={[
            styles.side,
            isLeftAligned ? styles.leftAlignedSide : { width: sideWidth },
          ]}
        >
          {trailing}
        </View>
      </View>
    </SafeAreaView>
  );
};

export const HeaderTextButton = ({
  accessibilityLabel,
  label,
  onPress,
}: HeaderTextButtonProps) => (
  <Pressable
    accessibilityLabel={accessibilityLabel ?? label}
    accessibilityRole="button"
    hitSlop={4}
    onPress={onPress}
    style={({ pressed }) => [
      styles.textButton,
      pressed && styles.textButtonPressed,
    ]}
  >
    <UIText numberOfLines={1} style={styles.textButtonLabel} weight="600">
      {label}
    </UIText>
  </Pressable>
);

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: semanticColors.screen,
    borderBottomColor: semanticColors.neutralDivider,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    minHeight: 60,
    paddingHorizontal: gaps.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xs,
  },
  side: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  leftAlignedSide: {
    flexShrink: 0,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  centeredTitle: {
    alignItems: "center",
  },
  leftAlignedTitle: {
    alignItems: "flex-start",
  },
  title: {
    maxWidth: "100%",
    color: semanticColors.textPrimary,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.25,
  },
  subtitle: {
    maxWidth: "100%",
    marginTop: 1,
    color: semanticColors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  textButton: {
    minHeight: 44,
    paddingHorizontal: gaps.xs,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textButtonPressed: {
    backgroundColor: getColor(colors.waffle, 0.16),
  },
  textButtonLabel: {
    color: semanticColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
