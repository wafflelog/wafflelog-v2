import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  message: string;
};

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>{icon}</View>
      <TitleRegular size="md" weight="600" color={colors.textDarkGrey}>
        {title}
      </TitleRegular>
      <TitleRegular
        size="sm"
        color={colors.textLightGrey}
        style={styles.message}
      >
        {message}
      </TitleRegular>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: gaps.lg,
  },
  icon: {
    width: 48,
    height: 48,
    marginBottom: gaps.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: getColor(colors.purple, 0.1),
  },
  message: {
    marginTop: gaps.xs,
    textAlign: "center",
  },
});
