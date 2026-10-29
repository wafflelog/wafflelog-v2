import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { DraftSelectionCheckbox } from "./draft-selection-checkbox";

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
      <View>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.checklistRow,
              index < items.length - 1 && styles.checklistRowDivider,
            ]}
            onPress={() => onToggleItem(item)}
            disabled={!isCustomizing}
            activeOpacity={isCustomizing ? 0.7 : 1}
            accessibilityRole={isCustomizing ? "checkbox" : undefined}
            accessibilityState={
              isCustomizing
                ? { checked: includedItems.has(item) }
                : undefined
            }
          >
            <TitleRegular
              size="xs"
              color={colors.textDarkGrey}
              style={[
                styles.checklistText,
                isCustomizing &&
                  !includedItems.has(item) &&
                  styles.checklistTextExcluded,
              ]}
            >
              {item}
            </TitleRegular>
            {isCustomizing ? (
              <DraftSelectionCheckbox
                isSelected={includedItems.has(item)}
                variant="checklist"
              />
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  checklistCard: {
    borderRadius: borderRadiuses.md,
    padding: gaps.md,
    backgroundColor: getColor(colors.turquoise, 0.08),
    gap: gaps.sm,
  },
  checklistRow: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xs,
    paddingVertical: gaps.xs,
  },
  checklistRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: getColor(colors.turquoise, 0.18),
  },
  checklistText: { flex: 1, lineHeight: 20 },
  checklistTextExcluded: { opacity: 0.45 },
});
