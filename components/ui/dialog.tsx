import { TitleRegular } from "@/components/title/regular";
import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
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
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
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
};

const sizes = {
  xs: "30%",
  sm: "50%",
  md: "70%",
  lg: "80%",
  xl: "100%",
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
          <Pressable style={[styles.backdrop]} onPress={handleBackdropPress} />
          <View style={[styles.dialog, { height: sizes[size] }]}>
            {onDismiss && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onDismiss}
                activeOpacity={0.7}
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

            <KeyboardAvoidingView style={styles.content}>
              {children}
            </KeyboardAvoidingView>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onDismiss}
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
                style={[styles.button, styles.createButton]}
                onPress={onConfirm}
              >
                <TitleRegular size="sm" weight="600" color={colors.white}>
                  {confirmText}
                </TitleRegular>
              </TouchableOpacity>
            </View>
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dialog: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: getColor(colors.white),
    borderTopLeftRadius: borderRadiuses.lg,
    borderTopRightRadius: borderRadiuses.lg,
    flexDirection: "column",
  },
  closeButton: {
    position: "absolute",
    top: gaps.md,
    right: gaps.md,
    zIndex: 5,
    padding: gaps.xs,
  },
  header: {
    padding: gaps.lg,
    paddingBottom: gaps.md,
  },
  divider: {
    height: 1,
    backgroundColor: getColor(colors.whiteGrey),
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
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: getColor(colors.whiteGrey, 0.5),
  },
  createButton: {
    backgroundColor: getColor(colors.blue),
  },
});
