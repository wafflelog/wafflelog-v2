import { BeforeYouDecide } from "@/components/ai-trip-planner/draft/before-you-decide";
import { CustomizationNotice } from "@/components/ai-trip-planner/draft/customization-notice";
import { DraftActions } from "@/components/ai-trip-planner/draft/draft-actions";
import { SuggestedChecklist } from "@/components/ai-trip-planner/draft/suggested-checklist";
import { TripDayAccordion } from "@/components/ai-trip-planner/draft/trip-day-accordion";
import { TripSummary } from "@/components/ai-trip-planner/draft/trip-summary";
import { TitleRegular } from "@/components/title/regular";
import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import { type AiPlannerPrototypePlan } from "@/data/ai-trip-planner-prototype";
import { Check } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

type AiPlannerPlanPreviewProps = {
  plan: AiPlannerPrototypePlan;
  onAskForChanges: () => void;
  onReview: (selection: {
    itineraryItemCount: number;
    checklistItemCount: number;
  }) => void;
};

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
        <TripSummary plan={plan} />

        <BeforeYouDecide
          assumptions={plan.assumptions}
          warnings={plan.warnings}
          isExpanded={showNotes}
          onToggle={() => setShowNotes((current) => !current)}
        />

        {isCustomizing ? <CustomizationNotice /> : null}

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
          {plan.days.map((day, dayIndex) => (
            <TripDayAccordion
              key={day.id}
              day={day}
              dayNumber={dayIndex + 1}
              isExpanded={expandedDayIds.has(day.id)}
              isCustomizing={isCustomizing}
              includedItemIds={includedItemIds}
              expandedItemIds={expandedItemIds}
              onToggleDay={() =>
                toggleSetValue(setExpandedDayIds, day.id)
              }
              onToggleItem={(itemId) =>
                toggleSetValue(setIncludedItemIds, itemId)
              }
              onToggleResearch={(itemId) =>
                toggleSetValue(setExpandedItemIds, itemId)
              }
            />
          ))}
        </View>

        <SuggestedChecklist
          items={plan.checklist}
          isCustomizing={isCustomizing}
          includedItems={includedChecklistItems}
          onToggleItem={(item) =>
            toggleSetValue(setIncludedChecklistItems, item)
          }
        />
      </ScrollView>

      <DraftActions
        isCustomizing={isCustomizing}
        onAskForChanges={onAskForChanges}
        onUseDraft={handleUseDraft}
        onBackToDraft={handleBackToDraft}
        onReviewSelection={() =>
          onReview({
            itineraryItemCount: includedItemIds.size,
            checklistItemCount: includedChecklistItems.size,
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: gaps.md, paddingBottom: gaps.xl, gap: gaps.md },
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
});
