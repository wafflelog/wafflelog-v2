import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Circle,
  Info,
} from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type BeforeYouDecideProps = {
  assumptions: string[];
  warnings: string[];
  isExpanded: boolean;
  onToggle: () => void;
};

export function BeforeYouDecide({
  assumptions,
  warnings,
  isExpanded,
  onToggle,
}: BeforeYouDecideProps) {
  return (
    <TouchableOpacity
      style={styles.notesCard}
      onPress={onToggle}
      activeOpacity={0.75}
    >
      <View style={styles.notesHeader}>
        <View style={styles.notesTitle}>
          <Info size={18} color={getColor(colors.blue)} />
          <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
            Before you decide
          </TitleRegular>
          <View style={styles.notesBadge}>
            <TitleRegular size="xxs" weight="600" color={colors.blue}>
              {assumptions.length + warnings.length}
            </TitleRegular>
          </View>
        </View>
        {isExpanded ? (
          <ChevronUp size={18} color={getColor(colors.textLightGrey)} />
        ) : (
          <ChevronDown size={18} color={getColor(colors.textLightGrey)} />
        )}
      </View>
      {isExpanded ? (
        <View style={styles.notesBody}>
          {assumptions.map((assumption) => (
            <View key={assumption} style={styles.noteRow}>
              <Circle size={7} color={getColor(colors.blue)} />
              <TitleRegular
                size="xs"
                color={colors.textDarkGrey}
                style={styles.noteText}
              >
                {assumption}
              </TitleRegular>
            </View>
          ))}
          {warnings.map((warning) => (
            <View key={warning} style={styles.warningRow}>
              <AlertTriangle size={14} color={getColor(colors.orange)} />
              <TitleRegular
                size="xs"
                color={colors.textDarkGrey}
                style={styles.noteText}
              >
                {warning}
              </TitleRegular>
            </View>
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  notesCard: {
    borderRadius: borderRadiuses.md,
    borderWidth: 1,
    borderColor: getColor(colors.blue, 0.2),
    backgroundColor: getColor(colors.blue, 0.05),
    padding: gaps.sm,
    gap: gaps.sm,
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notesTitle: { flexDirection: "row", alignItems: "center", gap: gaps.xs },
  notesBadge: {
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.blue, 0.12),
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  notesBody: { gap: gaps.xs },
  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: gaps.xs },
  warningRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: gaps.xs,
    paddingTop: gaps.xs,
    borderTopWidth: 1,
    borderTopColor: getColor(colors.orange, 0.18),
  },
  noteText: { flex: 1, lineHeight: 18 },
});
