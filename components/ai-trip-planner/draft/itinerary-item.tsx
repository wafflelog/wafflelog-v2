import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import { type AiPlannerPrototypeItem } from "@/data/ai-trip-planner-prototype";
import {
  Bus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  CircleHelp,
  ExternalLink,
  Landmark,
  Mountain,
  Utensils,
} from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type ItineraryItemProps = {
  item: AiPlannerPrototypeItem;
  isCustomizing: boolean;
  isIncluded: boolean;
  isResearchExpanded: boolean;
  onToggleIncluded: () => void;
  onToggleResearch: () => void;
};

const categoryLabels: Record<AiPlannerPrototypeItem["category"], string> = {
  attraction: "Culture",
  food: "Food",
  nature: "Nature",
  other: "Explore",
  transport: "Travel",
};

function ItemCategoryIcon({ item }: { item: AiPlannerPrototypeItem }) {
  const props = { size: 14, color: getColor(colors.purple) };

  switch (item.category) {
    case "attraction":
      return <Landmark {...props} />;
    case "food":
      return <Utensils {...props} />;
    case "nature":
      return <Mountain {...props} />;
    case "transport":
      return <Bus {...props} />;
    default:
      return <CircleHelp {...props} />;
  }
}

export function ItineraryItem({
  item,
  isCustomizing,
  isIncluded,
  isResearchExpanded,
  onToggleIncluded,
  onToggleResearch,
}: ItineraryItemProps) {
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
      >
        <View style={styles.itemSelection}>
          {isCustomizing ? (
            isIncluded ? (
              <CheckCircle2 size={22} color={getColor(colors.pineGreen)} />
            ) : (
              <Circle size={22} color={getColor(colors.paleGrey)} />
            )
          ) : (
            <View style={styles.readOnlyItemIcon}>
              <ItemCategoryIcon item={item} />
            </View>
          )}
        </View>
        <View style={styles.itemContent}>
          <View style={styles.itemMeta}>
            <TitleRegular size="xs" weight="700" color={colors.purple}>
              {item.time}
            </TitleRegular>
            <View style={styles.categoryPill}>
              <ItemCategoryIcon item={item} />
              <TitleRegular size="xxs" weight="600" color={colors.purple}>
                {categoryLabels[item.category]}
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
    opacity: 0.48,
    backgroundColor: getColor(colors.whiteGrey, 0.2),
  },
  itemMain: { flexDirection: "row", gap: gaps.xs },
  itemSelection: { paddingTop: 2 },
  readOnlyItemIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.purple, 0.08),
  },
  itemContent: { flex: 1, gap: gaps.xxs },
  itemMeta: { flexDirection: "row", alignItems: "center", gap: gaps.xs },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.purple, 0.08),
  },
  itemDescription: { lineHeight: 18 },
  whyButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: 30,
    marginTop: gaps.xs,
  },
  research: {
    marginLeft: 30,
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
