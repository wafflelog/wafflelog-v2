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
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

type DialogProps = {
  visible: boolean;
  onDismiss?: () => void;
  children: React.ReactNode;
  dismissible?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Dialog({
  visible,
  onDismiss,
  children,
  dismissible = true,
  style,
}: DialogProps) {
  const handleBackdropPress = () => {
    if (dismissible && onDismiss) {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={handleBackdropPress} />
        <KeyboardAwareScrollView
          style={styles.dialog}
          contentContainerStyle={styles.dialogContent}
        >
          {onDismiss && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onDismiss}
              activeOpacity={0.7}
            >
              <XIcon size={24} color={getColor(colors.textDarkGrey)} />
            </TouchableOpacity>
          )}
          {children}
        </KeyboardAwareScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: getColor(colors.black, 0.5),
  },
  dialog: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
    backgroundColor: getColor(colors.white),
    borderTopLeftRadius: borderRadiuses.lg,
    borderTopRightRadius: borderRadiuses.lg,
  },
  dialogContent: {
    flexGrow: 1,
  },
  closeButton: {
    position: "absolute",
    top: gaps.md,
    right: gaps.md,
    zIndex: 10,
    padding: gaps.xs,
  },
});
