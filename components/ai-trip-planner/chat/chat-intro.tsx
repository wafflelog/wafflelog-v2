import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import { StyleSheet, View } from "react-native";

type AiPlannerChatIntroProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

export function AiPlannerChatIntro({
  icon,
  title,
  description,
}: AiPlannerChatIntroProps) {
  return (
    <View style={styles.intro}>
      <View style={styles.introIcon}>{icon}</View>
      <TitleRegular size="lg" color={colors.textDarkGrey}>
        {title}
      </TitleRegular>
      <TitleRegular
        size="sm"
        color={colors.textLightGrey}
        style={styles.introText}
      >
        {description}
      </TitleRegular>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    alignItems: "center",
    paddingTop: gaps.sm,
    paddingBottom: gaps.md,
    gap: gaps.xs,
  },
  introIcon: {
    width: 46,
    height: 46,
    borderRadius: borderRadiuses.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.purple, 0.12),
    marginBottom: gaps.xxs,
  },
  introText: { textAlign: "center", lineHeight: 20, maxWidth: 460 },
});
