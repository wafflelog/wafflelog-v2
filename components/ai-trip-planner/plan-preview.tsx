import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
  getShadowStyle,
} from "@/constants/theme";
import {
  type AiPlannerPrototypeItem,
  type AiPlannerPrototypePlan,
} from "@/data/ai-trip-planner-prototype";
import {
  AlertTriangle,
  Bus,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  CircleHelp,
  ExternalLink,
  Info,
  Landmark,
  MapPin,
  MessageCircle,
  Mountain,
  Sparkles,
  Utensils,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type AiPlannerPlanPreviewProps = {
  plan: AiPlannerPrototypePlan;
  onAskForChanges: () => void;
  onReview: (selection: {
    itineraryItemCount: number;
    checklistItemCount: number;
  }) => void;
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

export function AiPlannerPlanPreview({
  plan,
  onAskForChanges,
  onReview,
}: AiPlannerPlanPreviewProps) {
  const allItemIds = useMemo(
    () => plan.days.flatMap((day) => day.items.map((item) => item.id)),
    [plan.days],
  );
  const [includedItemIds, setIncludedItemIds] = useState(
    () => new Set(allItemIds),
  );
  const [includedChecklistItems, setIncludedChecklistItems] = useState(
    () => new Set(plan.checklist),
  );
  const [expandedDayIds, setExpandedDayIds] = useState(
    () => new Set([plan.days[0]?.id]),
  );
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [showNotes, setShowNotes] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const toggleSetValue = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    value: string,
  ) => {
    setter((current) => {
      const next = new Set(current);

      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }

      return next;
    });
  };

  const handleUseDraft = () => {
    setIncludedItemIds(new Set(allItemIds));
    setIncludedChecklistItems(new Set(plan.checklist));
    setIsCustomizing(true);
  };

  const handleBackToDraft = () => {
    setIncludedItemIds(new Set(allItemIds));
    setIncludedChecklistItems(new Set(plan.checklist));
    setIsCustomizing(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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

        <TouchableOpacity
          style={styles.notesCard}
          onPress={() => setShowNotes((current) => !current)}
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
                  {plan.assumptions.length + plan.warnings.length}
                </TitleRegular>
              </View>
            </View>
            {showNotes ? (
              <ChevronUp size={18} color={getColor(colors.textLightGrey)} />
            ) : (
              <ChevronDown size={18} color={getColor(colors.textLightGrey)} />
            )}
          </View>
          {showNotes ? (
            <View style={styles.notesBody}>
              {plan.assumptions.map((assumption) => (
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
              {plan.warnings.map((warning) => (
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

        {isCustomizing ? (
          <View style={styles.customizationNotice}>
            <View style={styles.customizationIcon}>
              <CheckCircle2 size={20} color={getColor(colors.pineGreen)} />
            </View>
            <View style={styles.customizationCopy}>
              <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
                Choose what to add
              </TitleRegular>
              <TitleRegular size="xs" color={colors.textLightGrey}>
                Nothing is saved until you confirm the complete trip.
              </TitleRegular>
            </View>
          </View>
        ) : null}

        <View style={styles.sectionHeading}>
          <View>
            <TitleRegular size="lg" color={colors.textDarkGrey}>
              Your itinerary
            </TitleRegular>
            <TitleRegular size="xs" color={colors.textLightGrey}>
              {isCustomizing
                ? "Choose the suggestions to create as pins"
                : "Review the complete draft before choosing what to add"}
            </TitleRegular>
          </View>
          {isCustomizing ? (
            <View style={styles.selectedBadge}>
              <Check size={13} color={getColor(colors.pineGreen)} />
              <TitleRegular size="xs" weight="600" color={colors.pineGreen}>
                {includedItemIds.size}/{allItemIds.length}
              </TitleRegular>
            </View>
          ) : (
            <View style={styles.draftCountBadge}>
              <TitleRegular size="xs" weight="600" color={colors.purple}>
                {allItemIds.length} ideas
              </TitleRegular>
            </View>
          )}
        </View>

        <View style={styles.days}>
          {plan.days.map((day, dayIndex) => {
            const isExpanded = expandedDayIds.has(day.id);
            const selectedDayItems = day.items.filter((item) =>
              includedItemIds.has(item.id),
            ).length;

            return (
              <View key={day.id} style={styles.dayCard}>
                <TouchableOpacity
                  style={styles.dayHeader}
                  onPress={() => toggleSetValue(setExpandedDayIds, day.id)}
                  activeOpacity={0.72}
                >
                  <View style={styles.dayNumber}>
                    <TitleRegular size="xs" weight="700" color={colors.white}>
                      {dayIndex + 1}
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
                        ? `${selectedDayItems}/${day.items.length}`
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
                    {day.items.map((item) => {
                      const isIncluded = includedItemIds.has(item.id);
                      const isItemExpanded = expandedItemIds.has(item.id);

                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.item,
                            isCustomizing && !isIncluded && styles.itemExcluded,
                          ]}
                        >
                          <TouchableOpacity
                            style={styles.itemMain}
                            onPress={() =>
                              isCustomizing
                                ? toggleSetValue(setIncludedItemIds, item.id)
                                : undefined
                            }
                            activeOpacity={isCustomizing ? 0.7 : 1}
                            disabled={!isCustomizing}
                          >
                            <View style={styles.itemSelection}>
                              {isCustomizing ? (
                                isIncluded ? (
                                  <CheckCircle2
                                    size={22}
                                    color={getColor(colors.pineGreen)}
                                  />
                                ) : (
                                  <Circle
                                    size={22}
                                    color={getColor(colors.paleGrey)}
                                  />
                                )
                              ) : (
                                <View style={styles.readOnlyItemIcon}>
                                  <ItemCategoryIcon item={item} />
                                </View>
                              )}
                            </View>
                            <View style={styles.itemContent}>
                              <View style={styles.itemMeta}>
                                <TitleRegular
                                  size="xs"
                                  weight="700"
                                  color={colors.purple}
                                >
                                  {item.time}
                                </TitleRegular>
                                <View style={styles.categoryPill}>
                                  <ItemCategoryIcon item={item} />
                                  <TitleRegular
                                    size="xxs"
                                    weight="600"
                                    color={colors.purple}
                                  >
                                    {categoryLabels[item.category]}
                                  </TitleRegular>
                                </View>
                              </View>
                              <TitleRegular
                                size="sm"
                                weight="600"
                                color={colors.textDarkGrey}
                              >
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

                          <TouchableOpacity
                            style={styles.whyButton}
                            onPress={() =>
                              toggleSetValue(setExpandedItemIds, item.id)
                            }
                          >
                            <TitleRegular
                              size="xxs"
                              weight="600"
                              color={colors.blue}
                            >
                              {isItemExpanded
                                ? "Hide research"
                                : "Why this place?"}
                            </TitleRegular>
                            {isItemExpanded ? (
                              <ChevronUp size={14} color={getColor(colors.blue)} />
                            ) : (
                              <ChevronDown size={14} color={getColor(colors.blue)} />
                            )}
                          </TouchableOpacity>

                          {isItemExpanded ? (
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
                                      <ExternalLink
                                        size={13}
                                        color={getColor(colors.blue)}
                                      />
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
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={styles.checklistCard}>
          <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
            Suggested checklist
          </TitleRegular>
          {plan.checklist.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.checklistRow,
                isCustomizing &&
                  !includedChecklistItems.has(item) &&
                  styles.checklistRowExcluded,
              ]}
              onPress={() =>
                toggleSetValue(setIncludedChecklistItems, item)
              }
              disabled={!isCustomizing}
              activeOpacity={isCustomizing ? 0.7 : 1}
            >
              {isCustomizing && !includedChecklistItems.has(item) ? (
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
      </ScrollView>

      <View style={styles.footer}>
        {isCustomizing ? (
          <>
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={handleBackToDraft}
            >
              <TitleRegular size="sm" weight="600" color={colors.purple}>
                Back to draft
              </TitleRegular>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() =>
                onReview({
                  itineraryItemCount: includedItemIds.size,
                  checklistItemCount: includedChecklistItems.size,
                })
              }
              activeOpacity={0.8}
            >
              <TitleRegular size="sm" weight="600" color={colors.white}>
                Review selection
              </TitleRegular>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={onAskForChanges}
            >
              <MessageCircle size={18} color={getColor(colors.purple)} />
              <TitleRegular size="sm" weight="600" color={colors.purple}>
                Ask for changes
              </TitleRegular>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={handleUseDraft}
              activeOpacity={0.8}
            >
              <TitleRegular size="sm" weight="600" color={colors.white}>
                Use this draft
              </TitleRegular>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: gaps.md, paddingBottom: gaps.xl, gap: gaps.md },
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
  customizationNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
    padding: gaps.sm,
    borderRadius: borderRadiuses.md,
    borderWidth: 1,
    borderColor: getColor(colors.pineGreen, 0.2),
    backgroundColor: getColor(colors.pineGreen, 0.06),
  },
  customizationIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.pineGreen, 0.1),
  },
  customizationCopy: { flex: 1, gap: 3 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xxs,
    borderRadius: borderRadiuses.full,
    paddingHorizontal: gaps.xs,
    paddingVertical: gaps.xxs,
    backgroundColor: getColor(colors.pineGreen, 0.1),
  },
  draftCountBadge: {
    borderRadius: borderRadiuses.full,
    paddingHorizontal: gaps.xs,
    paddingVertical: gaps.xxs,
    backgroundColor: getColor(colors.purple, 0.08),
  },
  days: { gap: gaps.sm },
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
  checklistCard: {
    borderRadius: borderRadiuses.md,
    padding: gaps.md,
    backgroundColor: getColor(colors.turquoise, 0.08),
    gap: gaps.xs,
  },
  checklistRow: { flexDirection: "row", alignItems: "flex-start", gap: gaps.xs },
  checklistRowExcluded: { opacity: 0.45 },
  checklistText: { flex: 1, lineHeight: 18 },
  footer: {
    flexDirection: "row",
    gap: gaps.xs,
    paddingHorizontal: gaps.md,
    paddingTop: gaps.sm,
    paddingBottom: gaps.sm,
    borderTopWidth: 1,
    borderTopColor: getColor(colors.whiteGrey),
    backgroundColor: getColor(colors.white),
  },
  feedbackButton: {
    flex: 1,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xs,
    borderRadius: borderRadiuses.sm,
    borderWidth: 1,
    borderColor: getColor(colors.purple, 0.35),
  },
  reviewButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadiuses.sm,
    backgroundColor: getColor(colors.purple),
  },
});
