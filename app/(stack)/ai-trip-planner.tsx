import { AiPlannerConversation } from "@/components/ai-trip-planner/conversation";
import { AiPlannerPlanPreview } from "@/components/ai-trip-planner/plan-preview";
import { TitleRegular } from "@/components/title/regular";
import { Dialog } from "@/components/ui/dialog";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import {
  AI_PLANNER_INITIAL_MESSAGES,
  AI_PLANNER_PROTOTYPE_PLAN,
  type AiPlannerPrototypeMessage,
} from "@/data/ai-trip-planner-prototype";
import { useRouter } from "expo-router";
import { CalendarDays, MessageCircle, X } from "lucide-react-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PlannerView = "chat" | "draft";

export default function AiTripPlannerPrototypeScreen() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<PlannerView>("chat");
  const [messages, setMessages] = useState<AiPlannerPrototypeMessage[]>(
    AI_PLANNER_INITIAL_MESSAGES,
  );
  const [prompt, setPrompt] = useState("");
  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewSelection, setReviewSelection] = useState({
    itineraryItemCount: 8,
    checklistItemCount: 3,
  });

  const handleSend = () => {
    const content = prompt.trim();

    if (!content) {
      return;
    }

    const nextIndex = messages.length + 1;
    setMessages((current) => [
      ...current,
      {
        id: `prototype-user-${nextIndex}`,
        role: "user",
        body: content,
        time: "Now",
      },
      {
        id: `prototype-assistant-${nextIndex}`,
        role: "assistant",
        body: "That’s a useful adjustment. In the finished experience I’d research the change, explain what moved, and publish a new draft here. For now, this message is only demonstrating the conversation flow.",
        time: "Now",
      },
    ]);
    setPrompt("");
  };

  const handleAskForChanges = () => {
    setPrompt("Could you make day two a little less busy? ");
    setActiveView("chat");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.frame}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
              accessibilityLabel="Close AI trip planner"
            >
              <X size={22} color={getColor(colors.textDarkGrey)} />
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <TitleRegular size="md" weight="700" color={colors.textDarkGrey}>
                Plan with AI
              </TitleRegular>
              <TitleRegular size="xxs" color={colors.textLightGrey}>
                Osaka planning session
              </TitleRegular>
            </View>
            <View style={styles.revisionBadge}>
              <TitleRegular size="xxs" weight="600" color={colors.purple}>
                Draft #2
              </TitleRegular>
            </View>
          </View>

          <View style={styles.tabsWrapper}>
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeView === "chat" && styles.activeTab,
                ]}
                onPress={() => setActiveView("chat")}
              >
                <MessageCircle
                  size={17}
                  color={getColor(
                    activeView === "chat"
                      ? colors.purple
                      : colors.textLightGrey,
                  )}
                />
                <TitleRegular
                  size="sm"
                  weight="600"
                  color={
                    activeView === "chat"
                      ? colors.purple
                      : colors.textLightGrey
                  }
                >
                  Chat
                </TitleRegular>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeView === "draft" && styles.activeTab,
                ]}
                onPress={() => setActiveView("draft")}
              >
                <CalendarDays
                  size={17}
                  color={getColor(
                    activeView === "draft"
                      ? colors.purple
                      : colors.textLightGrey,
                  )}
                />
                <TitleRegular
                  size="sm"
                  weight="600"
                  color={
                    activeView === "draft"
                      ? colors.purple
                      : colors.textLightGrey
                  }
                >
                  Trip draft
                </TitleRegular>
                <View style={styles.itemCount}>
                  <TitleRegular size="xxs" weight="700" color={colors.purple}>
                    8
                  </TitleRegular>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.body}>
            {activeView === "chat" ? (
              <AiPlannerConversation
                messages={messages}
                prompt={prompt}
                onPromptChange={setPrompt}
                onSend={handleSend}
                onUseSuggestion={setPrompt}
                onOpenDraft={() => setActiveView("draft")}
              />
            ) : (
              <AiPlannerPlanPreview
                plan={AI_PLANNER_PROTOTYPE_PLAN}
                onAskForChanges={handleAskForChanges}
                onReview={(selection) => {
                  setReviewSelection(selection);
                  setReviewVisible(true);
                }}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <Dialog
        title="Review your trip"
        visible={reviewVisible}
        onDismiss={() => setReviewVisible(false)}
        onConfirm={() => setReviewVisible(false)}
        cancelText="Keep editing"
        confirmText="Looks good"
      >
        <View style={styles.reviewContent}>
          <View style={styles.reviewRow}>
            <TitleRegular size="xs" color={colors.textLightGrey}>
              Trip
            </TitleRegular>
            <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
              Osaka · 4 days
            </TitleRegular>
          </View>
          <View style={styles.reviewRow}>
            <TitleRegular size="xs" color={colors.textLightGrey}>
              Selected
            </TitleRegular>
            <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
              {reviewSelection.itineraryItemCount} itinerary items
            </TitleRegular>
          </View>
          <View style={styles.reviewRow}>
            <TitleRegular size="xs" color={colors.textLightGrey}>
              Checklist
            </TitleRegular>
            <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
              {reviewSelection.checklistItemCount} preparation items
            </TitleRegular>
          </View>
          <View style={styles.prototypeReviewNotice}>
            <TitleRegular size="xs" color={colors.orange}>
              Prototype only—no trip or records will be created.
            </TitleRegular>
          </View>
        </View>
      </Dialog>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: getColor(colors.textDarkGrey, 0.16),
  },
  keyboardView: { flex: 1 },
  frame: {
    flex: 1,
    width: "100%",
    maxWidth: 780,
    alignSelf: "center",
    backgroundColor: "#F7F7FA",
  },
  header: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: gaps.sm,
    borderBottomWidth: 1,
    borderBottomColor: getColor(colors.whiteGrey, 0.65),
    backgroundColor: getColor(colors.white),
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.whiteGrey, 0.35),
  },
  headerTitle: { flex: 1, alignItems: "center", gap: 2 },
  revisionBadge: {
    minWidth: 64,
    alignItems: "center",
    paddingHorizontal: gaps.xs,
    paddingVertical: 6,
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.purple, 0.1),
  },
  tabsWrapper: {
    backgroundColor: getColor(colors.white),
    paddingHorizontal: gaps.md,
    paddingVertical: gaps.xs,
  },
  tabs: {
    flexDirection: "row",
    padding: 3,
    borderRadius: borderRadiuses.sm,
    backgroundColor: getColor(colors.whiteGrey, 0.35),
  },
  tab: {
    flex: 1,
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xs,
    borderRadius: 6,
  },
  activeTab: { backgroundColor: getColor(colors.white) },
  itemCount: {
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.purple, 0.12),
  },
  body: { flex: 1 },
  reviewContent: { gap: gaps.sm },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: gaps.md,
  },
  prototypeReviewNotice: {
    marginTop: gaps.xs,
    padding: gaps.sm,
    borderRadius: borderRadiuses.sm,
    backgroundColor: getColor(colors.orange, 0.09),
  },
});
