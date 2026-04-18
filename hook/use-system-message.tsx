import { UIText } from "@/components/ui/text";
import {
  borderRadiuses,
  colors,
  fontSizes,
  gaps,
  getColor,
  getShadowStyle,
} from "@/constants/theme";
import { AlertCircle, CheckCircle2 } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TOAST_DURATION_MS = 3500;

export type SystemMessageType = "error" | "info";

/**
 * Hook that provides local system message functionality with a toast component.
 * Use this when you want to show messages within a specific screen/component
 * without relying on global state.
 *
 * @example
 * ```tsx
 * function MyScreen() {
 *   const { showMessage, SystemMessageModal } = useSystemMessage();
 *
 *   const handleSave = async () => {
 *     const result = await saveData();
 *     if (result.success) {
 *       showMessage("Saved successfully!", "info");
 *     } else {
 *       showMessage(result.error || "Failed to save", "error");
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <Button onPress={handleSave}>Save</Button>
 *       <SystemMessageModal />
 *     </>
 *   );
 * }
 * ```
 */
export function useSystemMessage() {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<SystemMessageType>("info");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(false);
  }, []);

  const showMessage = useCallback(
    (msg: string, msgType: SystemMessageType = "info") => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setMessage(msg);
      setType(msgType);
      setIsOpen(true);
      timeoutRef.current = setTimeout(close, TOAST_DURATION_MS);
    },
    [close],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const SystemMessageModal = useMemo(() => {
    // eslint-disable-next-line react/display-name
    return () => {
      if (!isOpen) return null;

      const isError = type === "error";
      const Icon = isError ? AlertCircle : CheckCircle2;

      return (
        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          statusBarTranslucent
        >
          <Pressable
            style={[styles.overlay, { paddingTop: insets.top + gaps.sm }]}
            onPress={close}
          >
            <Pressable
              style={[
                styles.toast,
                isError ? styles.toastError : styles.toastInfo,
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <Icon size={22} color={colors.white} style={styles.icon} />
              <UIText weight="500" style={styles.message}>
                {message}
              </UIText>
            </Pressable>
          </Pressable>
        </Modal>
      );
    };
  }, [isOpen, message, type, close, insets.top]);

  return {
    showMessage,
    close,
    SystemMessageModal,
    isOpen,
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingHorizontal: gaps.lg,
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
    paddingVertical: gaps.sm,
    paddingHorizontal: gaps.md,
    borderRadius: borderRadiuses.md,
    minWidth: 200,
    maxWidth: "100%",
    ...getShadowStyle("md"),
  },
  toastInfo: {
    backgroundColor: getColor(colors.blue),
  },
  toastError: {
    backgroundColor: getColor(colors.red),
  },
  icon: {
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: getColor(colors.white),
  },
});
