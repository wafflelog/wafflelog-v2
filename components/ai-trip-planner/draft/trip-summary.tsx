import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
  getShadowStyle,
} from "@/constants/theme";
import { type AiPlannerPrototypePlan } from "@/data/ai-trip-planner-prototype";
import { MapPin, Sparkles } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

type TripSummaryProps = {
  plan: AiPlannerPrototypePlan;
};

export function TripSummary({ plan }: TripSummaryProps) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroEyebrow}>
        <Sparkles size={14} color={getColor(colors.purple)} />
        <TitleRegular size="xs" weight="600" color={colors.purple}>
          Draft #{plan.revision}
        </TitleRegular>
      </View>
      <TitleRegular size="xxl" color={colors.textDarkGrey}>
        {plan.title}
      </TitleRegular>
      <View style={styles.locationRow}>
        <MapPin size={15} color={getColor(colors.textLightGrey)} />
        <TitleRegular size="sm" color={colors.textLightGrey}>
          {plan.destination} · {plan.dateRange}
        </TitleRegular>
      </View>
      <TitleRegular
        size="sm"
        color={colors.textDarkGrey}
        style={styles.summary}
      >
        {plan.summary}
      </TitleRegular>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: getColor(colors.white),
    borderRadius: borderRadiuses.lg,
    padding: gaps.lg,
    gap: gaps.xs,
    ...getShadowStyle("sm"),
  },
  heroEyebrow: { flexDirection: "row", alignItems: "center", gap: gaps.xxs },
  locationRow: { flexDirection: "row", alignItems: "center", gap: gaps.xxs },
  summary: { lineHeight: 21, marginTop: gaps.xs },
});
