import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import { MessageCircle } from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type DraftActionsProps = {
  isCustomizing: boolean;
  onAskForChanges: () => void;
  onUseDraft: () => void;
  onBackToDraft: () => void;
  onReviewSelection: () => void;
};

export function DraftActions({
  isCustomizing,
  onAskForChanges,
  onUseDraft,
  onBackToDraft,
  onReviewSelection,
}: DraftActionsProps) {
  return (
    <View style={styles.footer}>
      {isCustomizing ? (
        <>
          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={onBackToDraft}
          >
            <TitleRegular size="sm" weight="600" color={colors.purple}>
              Back to draft
            </TitleRegular>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={onReviewSelection}
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
            onPress={onUseDraft}
            activeOpacity={0.8}
          >
            <TitleRegular size="sm" weight="600" color={colors.white}>
              Use this draft
            </TitleRegular>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
