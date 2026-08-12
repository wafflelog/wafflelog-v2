import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import { CheckCircle2, Circle } from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type SuggestedChecklistProps = {
  items: string[];
  isCustomizing: boolean;
  includedItems: Set<string>;
  onToggleItem: (item: string) => void;
};

export function SuggestedChecklist({
  items,
  isCustomizing,
  includedItems,
  onToggleItem,
}: SuggestedChecklistProps) {
  return (
    <View style={styles.checklistCard}>
      <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
        Suggested checklist
      </TitleRegular>
      {items.map((item) => (
        <TouchableOpacity
          key={item}
          style={[
            styles.checklistRow,
            isCustomizing &&
              !includedItems.has(item) &&
              styles.checklistRowExcluded,
          ]}
          onPress={() => onToggleItem(item)}
          disabled={!isCustomizing}
          activeOpacity={isCustomizing ? 0.7 : 1}
        >
          {isCustomizing && !includedItems.has(item) ? (
            <Circle size={16} color={getColor(colors.paleGrey)} />
          ) : (
            <CheckCircle2 size={16} color={getColor(colors.turquoise)} />
          )}
          <TitleRegular
            size="xs"
            color={colors.textDarkGrey}
            style={styles.checklistText}
          >
            {item}
          </TitleRegular>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  checklistCard: {
    borderRadius: borderRadiuses.md,
    padding: gaps.md,
    backgroundColor: getColor(colors.turquoise, 0.08),
    gap: gaps.xs,
  },
  checklistRow: { flexDirection: "row", alignItems: "flex-start", gap: gaps.xs },
  checklistRowExcluded: { opacity: 0.45 },
  checklistText: { flex: 1, lineHeight: 18 },
});
