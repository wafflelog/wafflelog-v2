import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import { Sparkles } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

type AiPlannerMessageBubbleProps = {
  role: "assistant" | "user";
  children: React.ReactNode;
};

export function AiPlannerMessageBubble({
  role,
  children,
}: AiPlannerMessageBubbleProps) {
  const isUser = role === "user";

  return (
    <View
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
          {children}
        </TitleRegular>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
