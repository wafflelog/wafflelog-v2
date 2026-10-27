import { AppHeader } from "@/components/header/app-header";
import { HeaderBackButton } from "@/components/header/icon-button";
import { UIText } from "@/components/ui/text";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
  semanticColors,
} from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import {
  actionSubmitFeedback,
  feedbackCategories,
  feedbackMessageLimit,
  type FeedbackCategory,
} from "@/lib/feedback/submit-feedback";
import { getFontFamily } from "@/lib/helper/utils";
import { buildUUID } from "@/lib/sqlite/utils";
import { useMutation } from "@tanstack/react-query";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Check as CheckIcon, Send as SendIcon } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
  KeyboardController,
} from "react-native-keyboard-controller";

const feedbackCategoryLabels: Record<FeedbackCategory, string> = {
  feedback: "Feedback",
  bug: "Bug",
  help: "Help",
};

export default function FeedbackScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const [requestId, setRequestId] = useState(buildUUID);
  const [category, setCategory] = useState<FeedbackCategory>("feedback");
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const email = session?.user.email;
  const isMessageValid = message.trim().length > 0;
  const feedbackMutation = useMutation({
    mutationFn: (input: Parameters<typeof actionSubmitFeedback>[0]) =>
      actionSubmitFeedback(input),
    onSuccess: () => setIsSubmitted(true),
    onError: (error) => {
      showMessage(
        error instanceof Error
          ? error.message
          : "We couldn't send your message. Please try again.",
        "error",
      );
    },
  });

  const handleSubmit = () => {
    if (!isMessageValid || feedbackMutation.isPending) {
      return;
    }

    void KeyboardController.dismiss();
    feedbackMutation.mutate({
      requestId,
      category,
      message,
      appVersion: Constants.expoConfig?.version,
      buildNumber: Platform.select({
        ios: Constants.expoConfig?.ios?.buildNumber,
        android: Constants.expoConfig?.android?.versionCode?.toString(),
      }),
      platform: Platform.OS,
      osVersion: String(Platform.Version),
    });
  };

  const handleReset = () => {
    setMessage("");
    setCategory("feedback");
    setRequestId(buildUUID());
    setIsSubmitted(false);
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Contact us"
        leading={<HeaderBackButton onPress={() => router.back()} />}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior="padding"
        automaticOffset
      >
        <KeyboardAwareScrollView
          bottomOffset={gaps.lg}
          contentContainerStyle={styles.content}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isSubmitted ? (
            <View style={styles.successCard}>
              <View style={styles.successIcon}>
                <CheckIcon size={28} color={getColor(colors.pineGreen)} />
              </View>
              <UIText style={styles.successTitle} weight="700">
                Thanks for getting in touch
              </UIText>
              <UIText style={styles.successMessage}>
                Your message has been sent to the Wafflelog team.
              </UIText>
              <Pressable
                accessibilityRole="button"
                onPress={handleReset}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <UIText style={styles.secondaryButtonText} weight="700">
                  Send another message
                </UIText>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.intro}>
                <UIText style={styles.title} weight="700">
                  We&apos;d love to hear from you
                </UIText>
                <UIText style={styles.description}>
                  Tell us what is working well, what could be better, or where
                  you need a hand.
                </UIText>
              </View>

              <View style={styles.fieldGroup}>
                <UIText style={styles.fieldLabel} weight="700">
                  What can we help with?
                </UIText>
                <View style={styles.categoryList}>
                  {feedbackCategories.map((item) => {
                    const isSelected = item === category;

                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        key={item}
                        onPress={() => setCategory(item)}
                        style={({ pressed }) => [
                          styles.categoryButton,
                          isSelected && styles.categoryButtonSelected,
                          pressed && styles.categoryButtonPressed,
                        ]}
                      >
                        <UIText
                          style={[
                            styles.categoryText,
                            isSelected && styles.categoryTextSelected,
                          ]}
                          weight="600"
                        >
                          {feedbackCategoryLabels[item]}
                        </UIText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.messageLabelRow}>
                  <UIText style={styles.fieldLabel} weight="700">
                    Your message
                  </UIText>
                  <UIText style={styles.characterCount}>
                    {message.length}/{feedbackMessageLimit}
                  </UIText>
                </View>
                <TextInput
                  accessibilityLabel="Your message"
                  autoCapitalize="sentences"
                  autoCorrect
                  maxLength={feedbackMessageLimit}
                  multiline
                  onChangeText={setMessage}
                  placeholder="Share your thoughts or describe the problem…"
                  placeholderTextColor={semanticColors.textSecondary}
                  style={styles.messageInput}
                  textAlignVertical="top"
                  value={message}
                />
              </View>

              <View style={styles.replyNote}>
                <UIText style={styles.replyNoteText}>
                  {email
                    ? `We may reply to ${email}.`
                    : "We may reply to the email linked to your account."}
                </UIText>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  disabled: !isMessageValid || feedbackMutation.isPending,
                  busy: feedbackMutation.isPending,
                }}
                disabled={!isMessageValid || feedbackMutation.isPending}
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed &&
                    isMessageValid &&
                    !feedbackMutation.isPending &&
                    styles.submitButtonPressed,
                  (!isMessageValid || feedbackMutation.isPending) &&
                    styles.submitButtonDisabled,
                ]}
              >
                {feedbackMutation.isPending ? (
                  <ActivityIndicator
                    size="small"
                    color={semanticColors.primaryActionContent}
                  />
                ) : null}
                <UIText style={styles.submitButtonText} weight="700">
                  {feedbackMutation.isPending ? "Sending…" : "Send feedback"}
                </UIText>
                {!feedbackMutation.isPending ? (
                  <SendIcon
                    size={19}
                    color={semanticColors.primaryActionContent}
                  />
                ) : null}
              </Pressable>
            </>
          )}
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
      <SystemMessageModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.screen,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: gaps.md,
    paddingBottom: gaps.xl,
  },
  intro: {
    marginBottom: gaps.xl,
  },
  title: {
    color: semanticColors.textPrimary,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  description: {
    marginTop: gaps.xs,
    color: semanticColors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  fieldGroup: {
    marginBottom: gaps.lg,
  },
  fieldLabel: {
    color: semanticColors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  categoryList: {
    flexDirection: "row",
    gap: gaps.xs,
    marginTop: gaps.xs,
  },
  categoryButton: {
    minHeight: 42,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: gaps.sm,
    borderWidth: 1,
    borderColor: semanticColors.neutralDivider,
    borderRadius: borderRadiuses.full,
    backgroundColor: semanticColors.surface,
  },
  categoryButtonSelected: {
    borderColor: getColor(colors.waffle, 0.7),
    backgroundColor: getColor(colors.waffle, 0.16),
  },
  categoryButtonPressed: {
    opacity: 0.78,
  },
  categoryText: {
    color: semanticColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  categoryTextSelected: {
    color: semanticColors.textPrimary,
  },
  messageLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: gaps.sm,
  },
  characterCount: {
    color: semanticColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  messageInput: {
    minHeight: 180,
    marginTop: gaps.xs,
    paddingHorizontal: gaps.md,
    paddingVertical: gaps.sm,
    borderWidth: 1,
    borderColor: semanticColors.neutralDivider,
    borderRadius: borderRadiuses.md,
    backgroundColor: semanticColors.surface,
    color: semanticColors.textPrimary,
    fontFamily: getFontFamily("400"),
    fontSize: 15,
    lineHeight: 22,
  },
  replyNote: {
    marginTop: -gaps.xs,
    marginBottom: gaps.lg,
  },
  replyNoteText: {
    color: semanticColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  submitButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xs,
    paddingHorizontal: gaps.md,
    borderRadius: borderRadiuses.md,
    backgroundColor: semanticColors.primaryAction,
  },
  submitButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    color: semanticColors.primaryActionContent,
    fontSize: 15,
    lineHeight: 21,
  },
  successCard: {
    flex: 1,
    minHeight: 360,
    alignItems: "center",
    justifyContent: "center",
    padding: gaps.xl,
  },
  successIcon: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: gaps.md,
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.turquoise, 0.14),
  },
  successTitle: {
    color: semanticColors.textPrimary,
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
  },
  successMessage: {
    maxWidth: 300,
    marginTop: gaps.xs,
    color: semanticColors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  secondaryButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: gaps.lg,
    paddingHorizontal: gaps.lg,
    borderWidth: 1,
    borderColor: semanticColors.neutralDivider,
    borderRadius: borderRadiuses.full,
    backgroundColor: semanticColors.surface,
  },
  secondaryButtonPressed: {
    backgroundColor: getColor(colors.waffle, 0.12),
  },
  secondaryButtonText: {
    color: semanticColors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
});
