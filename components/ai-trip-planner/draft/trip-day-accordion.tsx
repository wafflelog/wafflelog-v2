import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import { type AiPlannerPrototypeDay } from "@/data/ai-trip-planner-prototype";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { ItineraryItem } from "./itinerary-item";

type TripDayAccordionProps = {
  day: AiPlannerPrototypeDay;
  dayNumber: number;
  isExpanded: boolean;
  isCustomizing: boolean;
  includedItemIds: Set<string>;
  expandedItemIds: Set<string>;
  onToggleDay: () => void;
  onToggleItem: (itemId: string) => void;
  onToggleResearch: (itemId: string) => void;
};

export function TripDayAccordion({
  day,
  dayNumber,
  isExpanded,
  isCustomizing,
  includedItemIds,
  expandedItemIds,
  onToggleDay,
  onToggleItem,
  onToggleResearch,
}: TripDayAccordionProps) {
  const selectedItemCount = day.items.filter((item) =>
    includedItemIds.has(item.id),
  ).length;

  return (
    <View style={styles.dayCard}>
      <TouchableOpacity
        style={styles.dayHeader}
        onPress={onToggleDay}
        activeOpacity={0.72}
      >
        <View style={styles.dayNumber}>
          <TitleRegular size="xs" weight="700" color={colors.white}>
            {dayNumber}
          </TitleRegular>
        </View>
        <View style={styles.dayTitleArea}>
          <TitleRegular size="xs" weight="500" color={colors.purple}>
            {day.label}
          </TitleRegular>
          <TitleRegular size="md" weight="600" color={colors.textDarkGrey}>
            {day.title}
          </TitleRegular>
          <TitleRegular size="xs" color={colors.textLightGrey}>
            {day.summary}
          </TitleRegular>
        </View>
        <View style={styles.dayMeta}>
          <TitleRegular size="xxs" color={colors.textLightGrey}>
            {isCustomizing
              ? `${selectedItemCount}/${day.items.length}`
              : `${day.items.length} ${day.items.length === 1 ? "idea" : "ideas"}`}
          </TitleRegular>
          {isExpanded ? (
            <ChevronUp size={19} color={getColor(colors.textLightGrey)} />
          ) : (
            <ChevronDown size={19} color={getColor(colors.textLightGrey)} />
          )}
        </View>
      </TouchableOpacity>

      {isExpanded ? (
        <View style={styles.dayItems}>
          {day.items.map((item) => (
            <ItineraryItem
              key={item.id}
              item={item}
              isCustomizing={isCustomizing}
              isIncluded={includedItemIds.has(item.id)}
              isResearchExpanded={expandedItemIds.has(item.id)}
              onToggleIncluded={() => onToggleItem(item.id)}
              onToggleResearch={() => onToggleResearch(item.id)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dayCard: {
    borderRadius: borderRadiuses.md,
    backgroundColor: getColor(colors.white),
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey, 0.75),
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
    padding: gaps.sm,
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.purple),
    alignItems: "center",
    justifyContent: "center",
  },
  dayTitleArea: { flex: 1, gap: 3 },
  dayMeta: { alignItems: "center", gap: 2 },
  dayItems: {
    borderTopWidth: 1,
    borderTopColor: getColor(colors.whiteGrey, 0.65),
  },
});
