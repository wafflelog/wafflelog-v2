import { AiPlannerChatIntro } from "@/components/ai-trip-planner/chat/chat-intro";
import { AiPlannerChatLayout } from "@/components/ai-trip-planner/chat/chat-layout";
import { AiPlannerMessageBubble } from "@/components/ai-trip-planner/chat/message-bubble";
import { AiPlannerIntakeComposer } from "@/components/ai-trip-planner/intake/intake-composer";
import {
  AI_PLANNER_INTAKE_INPUT_ID,
  INTAKE_EDIT_QUESTIONS,
  INTAKE_FIELD_ORDER,
  INTAKE_QUESTIONS,
  formatAnsweredIntakeField,
} from "@/components/ai-trip-planner/intake/intake-config";
import { AiPlannerIntakeSummary } from "@/components/ai-trip-planner/intake/intake-summary";
import { useIntakeConversation } from "@/components/ai-trip-planner/intake/use-intake-conversation";
import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import { type AiPlannerIntakeAnswers } from "@/types/ai-trip-planner";
import { Sparkles } from "lucide-react-native";
import { Fragment } from "react";
import { StyleSheet, View } from "react-native";

type AiPlannerIntakeConversationProps = {
  canEdit: boolean;
  isPlanningStarted: boolean;
  planningProgress?: React.ReactNode;
  onEditAnswers: () => void;
  onStartPlanning: (answers: AiPlannerIntakeAnswers) => void;
};

export function AiPlannerIntakeConversation({
  canEdit,
  isPlanningStarted,
  planningProgress,
  onEditAnswers,
  onStartPlanning,
}: AiPlannerIntakeConversationProps) {
  const conversation = useIntakeConversation({ canEdit, onEditAnswers });
  const visibleQuestionCount = Math.min(
    conversation.answeredCount + 1,
    INTAKE_FIELD_ORDER.length,
  );
  const visibleQuestionFields = INTAKE_FIELD_ORDER.slice(
    0,
    visibleQuestionCount,
  );
  const showComposer = !conversation.isComplete || conversation.isEditing;
  const footer = showComposer ? (
    <AiPlannerIntakeComposer
      activeField={conversation.activeField}
      answers={conversation.answers}
      input={conversation.input}
      error={conversation.error}
      onInputChange={conversation.handleInputChange}
      onSubmit={conversation.handleSubmit}
    />
  ) : (
    <View style={styles.statusFooter}>
      <View style={styles.statusDot} />
      <TitleRegular size="xxs" color={colors.textLightGrey}>
        {isPlanningStarted
          ? "Planning session · progress is saved locally"
          : "Ready to start planning"}
      </TitleRegular>
    </View>
  );
  const inputNativeId =
    showComposer && conversation.activeField !== "startDate"
      ? AI_PLANNER_INTAKE_INPUT_ID
      : undefined;
  const completedAnswers = conversation.completedAnswers;

  return (
    <AiPlannerChatLayout
      footer={footer}
      inputNativeId={inputNativeId}
      contentContainerStyle={styles.messagesContent}
      forceScrollToEndKey={[
        conversation.answeredCount,
        conversation.activeField,
        conversation.isEditing,
      ].join(":")}
    >
      <AiPlannerChatIntro
        icon={<Sparkles size={22} color={getColor(colors.purple)} />}
        title="Let’s shape your next trip"
        description="I’ll ask four quick questions, one at a time."
      />

      {visibleQuestionFields.map((field) => {
        const answer = conversation.answers[field];

        return (
          <Fragment key={field}>
            <AiPlannerMessageBubble role="assistant">
              {INTAKE_QUESTIONS[field]}
            </AiPlannerMessageBubble>
            {answer !== undefined ? (
              <AiPlannerMessageBubble role="user">
                {formatAnsweredIntakeField(field, conversation.answers)}
              </AiPlannerMessageBubble>
            ) : null}
          </Fragment>
        );
      })}

      {conversation.isEditing ? (
        <AiPlannerMessageBubble role="assistant">
          {INTAKE_EDIT_QUESTIONS[conversation.activeField]}
        </AiPlannerMessageBubble>
      ) : null}

      {completedAnswers && !conversation.isEditing ? (
        <>
          <AiPlannerMessageBubble role="assistant">
            Perfect—that gives me enough to start researching your trip.
          </AiPlannerMessageBubble>
          <AiPlannerIntakeSummary
            answers={completedAnswers}
            canEdit={canEdit}
            isPlanningStarted={isPlanningStarted}
            onEdit={conversation.handleEdit}
            onStartPlanning={() => onStartPlanning(completedAnswers)}
          />
        </>
      ) : null}

      {planningProgress}
    </AiPlannerChatLayout>
  );
}

const styles = StyleSheet.create({
  messagesContent: {
    padding: gaps.md,
    paddingBottom: gaps.xl,
    gap: gaps.md,
  },
  statusFooter: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xxs,
    borderTopWidth: 1,
    borderTopColor: getColor(colors.whiteGrey, 0.7),
    backgroundColor: getColor(colors.white),
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.orange),
  },
});
