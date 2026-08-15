import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import { buildCreatePlanningRefinementRequest } from "@/lib/ai-trip-planning/refinement-request";
import { type CreatePlanningRefinementRequest } from "@/lib/ai-trip-planning/types";
import { getFontFamily } from "@/lib/helper/utils";
import { ArrowUp, MessageCircle, Sparkles } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <View style={[styles.messageRow, styles.assistantMessageRow]}>
      <View style={styles.avatar}>
        <Sparkles size={15} color={getColor(colors.purple)} />
      </View>
      <View style={[styles.bubble, styles.assistantBubble]}>
        <TitleRegular
          size="sm"
          color={colors.textDarkGrey}
          style={styles.messageText}
        >
          {children}
        </TitleRegular>
      </View>
    </View>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <View style={[styles.messageRow, styles.userMessageRow]}>
      <View style={[styles.bubble, styles.userBubble]}>
        <TitleRegular
          size="sm"
          color={colors.white}
          style={styles.messageText}
        >
          {children}
        </TitleRegular>
      </View>
    </View>
  );
}

export function AiPlannerRefinementConversation({
  draftRevision,
  messages,
  canSubmit,
  planningProgress,
  onSubmit,
}: AiPlannerRefinementConversationProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 50);

    return () => clearTimeout(timer);
  }, [canSubmit, draftRevision, messages, planningProgress]);

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

    if (error) {
      setError(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <MessageCircle size={21} color={getColor(colors.purple)} />
          </View>
          <TitleRegular size="lg" color={colors.textDarkGrey}>
            Shape your itinerary
          </TitleRegular>
          <TitleRegular
            size="sm"
            color={colors.textLightGrey}
            style={styles.introText}
          >
            Your feedback updates the whole draft.
          </TitleRegular>
        </View>

        {messages.length === 0 ? (
          <AssistantBubble>
            Draft #{draftRevision} is ready. What would you like me to change?
          </AssistantBubble>
        ) : null}

        {messages.map((message) => (
          <UserBubble key={message.id}>{message.content}</UserBubble>
        ))}

        {planningProgress}

        {canSubmit && messages.length > 0 ? (
          <AssistantBubble>
            You&apos;re reviewing Draft #{draftRevision}. What would you like to
            adjust next?
          </AssistantBubble>
        ) : null}
      </ScrollView>

      {canSubmit ? (
        <View style={styles.composerArea}>
          {error ? (
            <TitleRegular size="xs" color={colors.red} style={styles.error}>
              {error}
            </TitleRegular>
          ) : null}
          <View style={[styles.composer, error && styles.composerError]}>
            <TextInput
              value={input}
              onChangeText={handleInputChange}
              placeholder="e.g. Make day two more relaxed…"
              placeholderTextColor={getColor(colors.paleGrey)}
              multiline
              autoFocus
              style={[styles.input, { fontFamily: getFontFamily("400") }]}
              textAlignVertical="top"
              accessibilityLabel="Trip draft feedback"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !input.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!input.trim()}
              accessibilityLabel="Send draft feedback"
            >
              <ArrowUp size={20} color={getColor(colors.white)} />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messages: { flex: 1 },
  messagesContent: {
    padding: gaps.md,
    paddingBottom: gaps.xl,
    gap: gaps.md,
  },
  intro: {
    alignItems: "center",
    paddingTop: gaps.sm,
    paddingBottom: gaps.md,
    gap: gaps.xs,
  },
  introIcon: {
    width: 46,
    height: 46,
    borderRadius: borderRadiuses.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.purple, 0.12),
    marginBottom: gaps.xxs,
  },
  introText: { textAlign: "center", lineHeight: 20 },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: gaps.xs,
  },
  assistantMessageRow: { justifyContent: "flex-start", paddingRight: gaps.xl },
  userMessageRow: { justifyContent: "flex-end", paddingLeft: gaps.xl * 2 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: borderRadiuses.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.purple, 0.12),
  },
  bubble: {
    maxWidth: 560,
    paddingHorizontal: gaps.sm,
    paddingVertical: gaps.sm,
  },
  assistantBubble: {
    backgroundColor: getColor(colors.white),
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey, 0.7),
    borderRadius: borderRadiuses.lg,
    borderBottomLeftRadius: borderRadiuses.xs,
  },
  userBubble: {
    backgroundColor: getColor(colors.purple),
    borderRadius: borderRadiuses.lg,
    borderBottomRightRadius: borderRadiuses.xs,
  },
  messageText: { lineHeight: 20 },
  composerArea: {
    paddingHorizontal: gaps.md,
    paddingTop: gaps.xs,
    paddingBottom: gaps.sm,
    gap: gaps.xs,
    borderTopWidth: 1,
    borderTopColor: getColor(colors.whiteGrey, 0.65),
    backgroundColor: getColor(colors.white),
  },
  composer: {
    minHeight: 54,
    maxHeight: 130,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: gaps.xs,
    paddingLeft: gaps.sm,
    paddingRight: gaps.xs,
    paddingVertical: gaps.xs,
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey),
    borderRadius: borderRadiuses.md,
    backgroundColor: getColor(colors.white),
  },
  composerError: { borderColor: getColor(colors.red, 0.65) },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 108,
    paddingTop: gaps.xs,
    paddingBottom: gaps.xs,
    color: getColor(colors.textDarkGrey),
    fontSize: 14,
  },
  sendButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.purple),
  },
  sendButtonDisabled: { opacity: 0.4 },
  error: { paddingHorizontal: gaps.xxs },
});
