import { gaps } from "@/constants/theme";
import { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  KeyboardChatScrollView,
  KeyboardGestureArea,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AiPlannerChatLayoutProps = {
  children: React.ReactNode;
  footer?: React.ReactNode;
  inputNativeId?: string;
  scrollToEndKey?: string | number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardLiftBehavior?: "always" | "whenAtEnd" | "persistent" | "never";
  keyboardShouldPersistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
};

export function AiPlannerChatLayout({
  children,
  footer,
  inputNativeId,
  scrollToEndKey,
  contentContainerStyle,
  keyboardLiftBehavior = "whenAtEnd",
  keyboardShouldPersistTaps = "handled",
}: AiPlannerChatLayoutProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<React.ElementRef<typeof KeyboardChatScrollView>>(
    null,
  );
  const footerBaselineHeight = useRef<number | null>(null);
  const extraContentPadding = useSharedValue(0);

  useEffect(() => {
    if (scrollToEndKey === undefined) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });

    return () => cancelAnimationFrame(frame);
  }, [scrollToEndKey]);

  return (
    <KeyboardGestureArea
      interpolator="ios"
      style={styles.container}
      textInputNativeID={inputNativeId}
    >
      <KeyboardChatScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={contentContainerStyle}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="interactive"
        keyboardLiftBehavior={keyboardLiftBehavior}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        offset={insets.bottom}
        extraContentPadding={extraContentPadding}
        applyWorkaroundForContentInsetHitTestBug
        showsVerticalScrollIndicator={false}
      >
        {children}
      </KeyboardChatScrollView>

      {footer ? (
        <KeyboardStickyView
          offset={{ opened: insets.bottom }}
          onLayout={(event) => {
            const height = event.nativeEvent.layout.height;

            if (footerBaselineHeight.current === null) {
              footerBaselineHeight.current = height;
              return;
            }

            extraContentPadding.set(
              withTiming(
                Math.max(height - footerBaselineHeight.current, 0),
                { duration: 200 },
              ),
            );
          }}
        >
          <View style={styles.footer}>{footer}</View>
        </KeyboardStickyView>
      ) : null}
    </KeyboardGestureArea>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messages: { flex: 1 },
  footer: { paddingBottom: gaps.xxs },
});
