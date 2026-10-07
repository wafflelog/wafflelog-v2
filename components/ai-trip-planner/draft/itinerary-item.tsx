import { IconPinCategory } from "@/components/icon/pin-category";
import { TitleRegular } from "@/components/title/regular";
import { CATEGORIES } from "@/constants/pin-categories";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import { type AiPlannerItemViewModel } from "@/types/ai-trip-planner";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type ItineraryItemProps = {
  item: AiPlannerItemViewModel;
  isCustomizing: boolean;
  isIncluded: boolean;
  isResearchExpanded: boolean;
  onToggleIncluded: () => void;
  onToggleResearch: () => void;
};

export function ItineraryItem({
  item,
  isCustomizing,
  isIncluded,
  isResearchExpanded,
  onToggleIncluded,
  onToggleResearch,
}: ItineraryItemProps) {
  const category = CATEGORIES.find(({ id }) => id === item.category);
  const categoryColor = category
    ? colors[category.color]
    : colors.textLightGrey;

  return (
    <View
      style={[
        styles.item,
        isCustomizing && !isIncluded && styles.itemExcluded,
      ]}
    >
      <TouchableOpacity
        style={styles.itemMain}
        onPress={onToggleIncluded}
        activeOpacity={isCustomizing ? 0.7 : 1}
        disabled={!isCustomizing}
        accessibilityRole={isCustomizing ? "checkbox" : undefined}
        accessibilityState={
          isCustomizing ? { checked: isIncluded } : undefined
        }
      >
        <View
          style={[
            styles.itemContent,
            isCustomizing && !isIncluded && styles.excludedContent,
          ]}
        >
          <View style={styles.itemMeta}>
            {item.time ? (
              <TitleRegular size="xs" weight="700" color={colors.purple}>
                {item.time}
              </TitleRegular>
            ) : null}
            <View
              style={[
                styles.categoryPill,
                { backgroundColor: getColor(categoryColor, 0.08) },
              ]}
            >
              {category ? (
                <IconPinCategory category={category} size={14} />
              ) : null}
              <TitleRegular
                size="xxs"
                weight="600"
                color={colors.textDarkGrey}
                style={styles.categoryLabel}
              >
                {category?.name ?? item.category}
              </TitleRegular>
            </View>
          </View>
          <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
            {item.title}
          </TitleRegular>
          <TitleRegular
            size="xs"
            color={colors.textLightGrey}
            style={styles.itemDescription}
          >
            {item.description}
          </TitleRegular>
        </View>
        {isCustomizing ? (
          <View
            style={[
              styles.checkbox,
              isIncluded && styles.checkboxSelected,
            ]}
          >
            {isIncluded ? (
              <Check
                size={15}
                strokeWidth={3}
                color={getColor(colors.white)}
              />
            ) : null}
          </View>
        ) : null}
      </TouchableOpacity>

      <TouchableOpacity style={styles.whyButton} onPress={onToggleResearch}>
        <TitleRegular size="xxs" weight="600" color={colors.blue}>
          {isResearchExpanded ? "Hide research" : "Why this place?"}
        </TitleRegular>
        {isResearchExpanded ? (
          <ChevronUp size={14} color={getColor(colors.blue)} />
        ) : (
          <ChevronDown size={14} color={getColor(colors.blue)} />
        )}
      </TouchableOpacity>

      {isResearchExpanded ? (
        <View style={styles.research}>
          <TitleRegular
            size="xs"
            color={colors.textDarkGrey}
            style={styles.researchReason}
          >
            {item.reason}
          </TitleRegular>
          {item.sources.length ? (
            <View style={styles.sources}>
              {item.sources.map((source) => (
                <View key={source.url} style={styles.source}>
                  <ExternalLink size={13} color={getColor(colors.blue)} />
                  <TitleRegular
                    size="xxs"
                    weight="500"
                    color={colors.blue}
                    style={styles.sourceText}
                  >
                    {source.title}
                  </TitleRegular>
                </View>
              ))}
            </View>
          ) : (
            <TitleRegular size="xxs" color={colors.paleGrey}>
              No source link attached to this suggestion
            </TitleRegular>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    padding: gaps.sm,
    borderBottomWidth: 1,
    borderBottomColor: getColor(colors.whiteGrey, 0.55),
  },
  itemExcluded: {
    backgroundColor: getColor(colors.whiteGrey, 0.2),
  },
  itemMain: { flexDirection: "row", gap: gaps.xs },
  itemContent: { flex: 1, gap: gaps.xxs },
  excludedContent: { opacity: 0.48 },
  checkbox: {
    width: 22,
    height: 22,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: getColor(colors.paleGrey),
    backgroundColor: getColor(colors.white),
  },
  checkboxSelected: {
    borderColor: getColor(colors.purple),
    backgroundColor: getColor(colors.purple),
  },
  itemMeta: { flexDirection: "row", alignItems: "center", gap: gaps.xs },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: borderRadiuses.full,
  },
  categoryLabel: { textTransform: "capitalize" },
  itemDescription: { lineHeight: 18 },
  whyButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: gaps.xs,
  },
  research: {
    marginTop: gaps.xs,
    borderRadius: borderRadiuses.sm,
    padding: gaps.xs,
    backgroundColor: getColor(colors.blue, 0.05),
    gap: gaps.xs,
  },
  researchReason: { lineHeight: 18 },
  sources: { gap: gaps.xxs },
  source: { flexDirection: "row", alignItems: "center", gap: gaps.xxs },
  sourceText: { flex: 1 },
});
