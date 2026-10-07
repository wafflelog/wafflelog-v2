import { AiPlannerChatIntro } from "@/components/ai-trip-planner/chat/chat-intro";
import { AiPlannerChatLayout } from "@/components/ai-trip-planner/chat/chat-layout";
import { AiPlannerMessageBubble } from "@/components/ai-trip-planner/chat/message-bubble";
import { AiPlannerTextComposer } from "@/components/ai-trip-planner/chat/text-composer";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import { buildCreatePlanningRefinementRequest } from "@/lib/ai-trip-planning/refinement-request";
import { type CreatePlanningRefinementRequest } from "@/lib/ai-trip-planning/types";
import { MessageCircle } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

export type AiPlannerRefinementMessage = {
  id: string;
  content: string;
};

type AiPlannerRefinementConversationProps = {
  draftRevision: number;
  messages: AiPlannerRefinementMessage[];
  canSubmit: boolean;
  planningProgress?: React.ReactNode;
  onSubmit: (request: CreatePlanningRefinementRequest) => void;
};

const REFINEMENT_INPUT_ID = "ai-planner-refinement-input";

export function AiPlannerRefinementConversation({
  draftRevision,
  messages,
  canSubmit,
  planningProgress,
  onSubmit,
}: AiPlannerRefinementConversationProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    try {
      const request = buildCreatePlanningRefinementRequest(input);

      setError(null);
      setInput("");
      onSubmit(request);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Tell me what you’d like to change in the draft.",
      );
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    setError(null);
  };

  const footer = canSubmit ? (
    <View style={styles.composerArea}>
      {error ? (
        <TitleRegular size="xs" color={colors.red} style={styles.error}>
          {error}
        </TitleRegular>
      ) : null}
      <AiPlannerTextComposer
        value={input}
        placeholder="e.g. Make day two more relaxed…"
        accessibilityLabel="Trip draft feedback"
        nativeID={REFINEMENT_INPUT_ID}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        error={Boolean(error)}
        multiline
      />
    </View>
  ) : undefined;

  return (
    <AiPlannerChatLayout
      footer={footer}
      inputNativeId={canSubmit ? REFINEMENT_INPUT_ID : undefined}
      contentContainerStyle={styles.messagesContent}
      forceScrollToEndKey={messages.length}
    >
      <AiPlannerChatIntro
        icon={<MessageCircle size={21} color={getColor(colors.purple)} />}
        title="Shape your itinerary"
        description="Your feedback updates the whole draft."
      />

      {messages.length === 0 ? (
        <AiPlannerMessageBubble role="assistant">
          Draft #{draftRevision} is ready. What would you like me to change?
        </AiPlannerMessageBubble>
      ) : null}

      {messages.map((message) => (
        <AiPlannerMessageBubble key={message.id} role="user">
          {message.content}
        </AiPlannerMessageBubble>
      ))}

      {planningProgress}

      {canSubmit && messages.length > 0 ? (
        <AiPlannerMessageBubble role="assistant">
          You&apos;re reviewing Draft #{draftRevision}. What would you like to
          adjust next?
        </AiPlannerMessageBubble>
      ) : null}
    </AiPlannerChatLayout>
  );
}

const styles = StyleSheet.create({
  messagesContent: {
    padding: gaps.md,
    paddingBottom: gaps.xl,
    gap: gaps.md,
  },
  composerArea: {
    paddingHorizontal: gaps.md,
    paddingTop: gaps.xs,
    paddingBottom: gaps.sm,
    gap: gaps.xs,
    borderTopWidth: 1,
    borderTopColor: getColor(colors.whiteGrey, 0.65),
    backgroundColor: getColor(colors.white),
  },
  error: { paddingHorizontal: gaps.xxs },
});
