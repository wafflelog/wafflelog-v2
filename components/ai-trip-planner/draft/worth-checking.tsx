import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import { AlertTriangle } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

type WorthCheckingProps = {
  warnings: string[];
};

export function WorthChecking({ warnings }: WorthCheckingProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <AlertTriangle size={16} color={getColor(colors.orange)} />
        <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
          Worth checking
        </TitleRegular>
      </View>

      <View style={styles.warnings}>
        {warnings.map((warning) => (
          <TitleRegular
            key={warning}
            size="xs"
            color={colors.textDarkGrey}
            style={styles.warning}
          >
            {warning}
          </TitleRegular>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadiuses.md,
    borderWidth: 1,
    borderColor: getColor(colors.orange, 0.2),
    backgroundColor: getColor(colors.orange, 0.06),
    padding: gaps.sm,
    gap: gaps.xs,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xs,
  },
  warnings: { gap: gaps.xs },
  warning: { lineHeight: 18 },
});
