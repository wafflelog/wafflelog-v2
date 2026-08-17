import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
  semanticColors,
} from "@/constants/theme";
import { X as XIcon } from "lucide-react-native";
import React from "react";
import {
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

type DialogProps = {
  visible: boolean;
  title: string;
  onDismiss?: () => void;
  children: React.ReactNode;
  dismissible?: boolean;
  style?: StyleProp<ViewStyle>;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  confirmVariant?: "primary" | "danger";
  overlay?: React.ReactNode;
};

const maxHeights = {
  xs: "45%",
  sm: "55%",
  md: "70%",
  lg: "80%",
  xl: "92%",
} as const;

export function Dialog({
  title,
  visible,
  onDismiss,
  children,
  dismissible = true,
  style,
  onConfirm,
  confirmText = "Create",
  cancelText = "Cancel",
  size = "md",
  confirmVariant = "primary",
  overlay,
}: DialogProps) {
  const handleBackdropPress = () => {
    if (dismissible && onDismiss) {
      onDismiss();
    }
  };

  return (
    <>
      {visible && <View style={styles.background} />}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={onDismiss}
      >
        <SafeAreaView style={styles.container} edges={["bottom"]}>
          {overlay}
          <Pressable style={[styles.backdrop]} onPress={handleBackdropPress} />
          <View style={[styles.dialog, { maxHeight: maxHeights[size] }, style]}>
            <KeyboardAwareScrollView
              contentContainerStyle={styles.keyboardContainer}
            >
              {onDismiss && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onDismiss}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Close dialog"
                >
                  <XIcon size={24} color={getColor(colors.textDarkGrey)} />
                </TouchableOpacity>
              )}

              {title && (
                <>
                  <View style={styles.header}>
                    <TitleRegular
                      size="lg"
                      weight="600"
                      color={colors.textDarkGrey}
                    >
                      {title}
                    </TitleRegular>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              <View style={styles.content}>{children}</View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onDismiss}
                  accessibilityRole="button"
                >
                  <TitleRegular
                    size="sm"
                    weight="600"
                    color={colors.textDarkGrey}
                  >
                    {cancelText}
                  </TitleRegular>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    confirmVariant === "danger"
                      ? styles.dangerButton
                      : styles.createButton,
                  ]}
                  onPress={onConfirm}
                  accessibilityRole="button"
                >
                  <TitleRegular
                    size="sm"
                    weight="600"
                    color={
                      confirmVariant === "danger"
                        ? colors.white
                        : colors.textDarkGrey
                    }
                  >
                    {confirmText}
                  </TitleRegular>
                </TouchableOpacity>
              </View>
            </KeyboardAwareScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: getColor(colors.black, 0.5),
  },
  container: {
    flex: 1,
  },
  keyboardContainer: {
    // flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dialog: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: semanticColors.surface,
    borderTopLeftRadius: borderRadiuses.lg,
    borderTopRightRadius: borderRadiuses.lg,
    flexDirection: "column",
  },
  closeButton: {
    position: "absolute",
    top: gaps.md,
    right: gaps.md,
    zIndex: 5,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    padding: gaps.lg,
    paddingBottom: gaps.md,
  },
  divider: {
    height: 1,
    backgroundColor: semanticColors.neutralDivider,
    marginHorizontal: gaps.lg,
  },
  content: {
    flex: 1,
    padding: gaps.lg,
  },
  actions: {
    flexDirection: "row",
    gap: gaps.sm,
    justifyContent: "flex-end",
    padding: gaps.lg,
  },
  button: {
    paddingVertical: gaps.sm,
    paddingHorizontal: gaps.lg,
    borderRadius: borderRadiuses.sm,
    minWidth: 80,
    minHeight: 44,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: getColor(colors.whiteGrey, 0.5),
  },
  createButton: {
    backgroundColor: semanticColors.primaryAction,
  },
  dangerButton: {
    backgroundColor: getColor(colors.red),
  },
});
