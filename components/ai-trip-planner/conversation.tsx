import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  fontSizes,
  gaps,
  getColor,
} from "@/constants/theme";
import {
  AI_PLANNER_PROMPT_SUGGESTIONS,
  type AiPlannerPrototypeMessage,
} from "@/data/ai-trip-planner-prototype";
import { getFontFamily } from "@/lib/helper/utils";
import { ArrowUp, CalendarDays, Sparkles } from "lucide-react-native";
import { useEffect, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type AiPlannerConversationProps = {
  messages: AiPlannerPrototypeMessage[];
  prompt: string;
  onPromptChange: (value: string) => void;
  onSend: () => void;
  onUseSuggestion: (value: string) => void;
  onOpenDraft: () => void;
};

export function AiPlannerConversation({
  messages,
  prompt,
  onPromptChange,
  onSend,
  onUseSuggestion,
  onOpenDraft,
}: AiPlannerConversationProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 50);

    return () => clearTimeout(timer);
  }, [messages.length]);

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
            <Sparkles size={22} color={getColor(colors.purple)} />
          </View>
          <TitleRegular size="lg" color={colors.textDarkGrey}>
            Let&apos;s shape your next trip
          </TitleRegular>
          <TitleRegular
            size="sm"
            color={colors.textLightGrey}
            style={styles.introText}
          >
            Start broad. You can refine the pace, places and priorities after
            seeing the first draft.
          </TitleRegular>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestions}
          >
            {AI_PLANNER_PROMPT_SUGGESTIONS.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestion}
                onPress={() => onUseSuggestion(suggestion)}
              >
                <TitleRegular size="xs" weight="500" color={colors.purple}>
                  {suggestion}
                </TitleRegular>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                isUser ? styles.userMessageRow : styles.assistantMessageRow,
              ]}
            >
              {!isUser ? (
                <View style={styles.avatar}>
                  <Sparkles size={15} color={getColor(colors.purple)} />
                </View>
              ) : null}
              <View
                style={[
                  styles.bubble,
                  isUser ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <TitleRegular
                  size="sm"
                  color={isUser ? colors.white : colors.textDarkGrey}
                  style={styles.messageText}
                >
                  {message.body}
                </TitleRegular>
                {message.draftRevision ? (
                  <TouchableOpacity
                    style={styles.draftCard}
                    onPress={onOpenDraft}
                    activeOpacity={0.75}
                  >
                    <View style={styles.draftIcon}>
                      <CalendarDays
                        size={18}
                        color={getColor(colors.purple)}
                      />
                    </View>
                    <View style={styles.draftCopy}>
                      <TitleRegular
                        size="sm"
                        weight="600"
                        color={colors.textDarkGrey}
                      >
                        Trip draft #{message.draftRevision}
                      </TitleRegular>
                      <TitleRegular size="xs" color={colors.textLightGrey}>
                        4 days · 8 suggestions
                      </TitleRegular>
                    </View>
                    <TitleRegular size="xs" weight="600" color={colors.purple}>
                      View
                    </TitleRegular>
                  </TouchableOpacity>
                ) : null}
                <TitleRegular
                  size="xxs"
                  color={isUser ? colors.whiteGrey : colors.paleGrey}
                  style={styles.messageTime}
                >
                  {message.time}
                </TitleRegular>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.composerArea}>
        <View style={styles.prototypeNotice}>
          <View style={styles.prototypeDot} />
          <TitleRegular size="xxs" color={colors.textLightGrey}>
            UI prototype · messages are not sent
          </TitleRegular>
        </View>
        <View style={styles.composer}>
          <TextInput
            value={prompt}
            onChangeText={onPromptChange}
            placeholder="Share an idea or ask for a change…"
            placeholderTextColor={getColor(colors.paleGrey)}
            multiline
            maxLength={1000}
            style={[styles.input, { fontFamily: getFontFamily("400") }]}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !prompt.trim() && styles.sendButtonDisabled,
            ]}
            onPress={onSend}
            disabled={!prompt.trim()}
            accessibilityLabel="Send message"
          >
            <ArrowUp size={20} color={getColor(colors.white)} />
          </TouchableOpacity>
        </View>
      </View>
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
  introText: { textAlign: "center", lineHeight: 20, maxWidth: 460 },
  suggestions: {
    gap: gaps.xs,
    paddingTop: gaps.sm,
    paddingHorizontal: gaps.xxs,
  },
  suggestion: {
    borderWidth: 1,
    borderColor: getColor(colors.purple, 0.25),
    backgroundColor: getColor(colors.purple, 0.06),
    paddingHorizontal: gaps.sm,
    paddingVertical: gaps.xs,
    borderRadius: borderRadiuses.full,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: gaps.xs,
  },
  userMessageRow: { justifyContent: "flex-end", paddingLeft: gaps.xl * 2 },
  assistantMessageRow: { justifyContent: "flex-start", paddingRight: gaps.xl },
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
    gap: gaps.xs,
  },
  userBubble: {
    backgroundColor: getColor(colors.purple),
    borderRadius: borderRadiuses.lg,
    borderBottomRightRadius: borderRadiuses.xs,
  },
  assistantBubble: {
    backgroundColor: getColor(colors.white),
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey, 0.7),
    borderRadius: borderRadiuses.lg,
    borderBottomLeftRadius: borderRadiuses.xs,
  },
  messageText: { lineHeight: 20 },
  messageTime: { alignSelf: "flex-end" },
  draftCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xs,
    padding: gaps.xs,
    borderRadius: borderRadiuses.sm,
    backgroundColor: getColor(colors.purple, 0.08),
    marginTop: gaps.xxs,
  },
  draftIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadiuses.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.white),
  },
  draftCopy: { flex: 1, gap: 2 },
  composerArea: {
    borderTopWidth: 1,
    borderTopColor: getColor(colors.whiteGrey, 0.7),
    backgroundColor: getColor(colors.white),
    paddingHorizontal: gaps.md,
    paddingTop: gaps.xs,
    paddingBottom: gaps.sm,
    gap: gaps.xs,
  },
  prototypeNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xxs,
  },
  prototypeDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.orange),
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: gaps.xs,
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey),
    borderRadius: borderRadiuses.lg,
    paddingLeft: gaps.sm,
    paddingRight: 6,
    paddingVertical: 6,
    backgroundColor: getColor(colors.white),
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 104,
    paddingTop: 8,
    paddingBottom: 7,
    fontSize: fontSizes.sm,
    color: getColor(colors.textDarkGrey),
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadiuses.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.purple),
  },
  sendButtonDisabled: { backgroundColor: getColor(colors.paleGrey) },
});
