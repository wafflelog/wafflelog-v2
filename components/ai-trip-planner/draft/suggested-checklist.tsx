import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { DraftSelectionCheckbox } from "./draft-selection-checkbox";
import { DraftSelectionToggle } from "./draft-selection-toggle";

type SuggestedChecklistProps = {
  items: string[];
  isCustomizing: boolean;
  includedItems: Set<string>;
  onToggleItem: (item: string) => void;
  onToggleAll: () => void;
};

export function SuggestedChecklist({
  items,
  isCustomizing,
  includedItems,
  onToggleItem,
  onToggleAll,
}: SuggestedChecklistProps) {
  const isAllSelected =
    items.length > 0 && items.every((item) => includedItems.has(item));

  return (
    <View style={styles.checklistCard}>
      <View style={styles.checklistHeader}>
        <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
          Suggested checklist
        </TitleRegular>
        {isCustomizing && items.length > 0 ? (
          <DraftSelectionToggle
            isAllSelected={isAllSelected}
            color="turquoise"
            onPress={onToggleAll}
          />
        ) : null}
      </View>
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
  checklistHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
