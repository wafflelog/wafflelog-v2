import { gaps } from "@/constants/theme";
import { useCallback, useEffect, useRef } from "react";
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

const FORCED_SCROLL_DELAY_MS = 250;

type AiPlannerChatLayoutProps = {
  children: React.ReactNode;
  footer?: React.ReactNode;
  inputNativeId?: string;
  forceScrollToEndKey?: string | number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardLiftBehavior?: "always" | "whenAtEnd" | "persistent" | "never";
  keyboardShouldPersistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
};

export function AiPlannerChatLayout({
  children,
  footer,
  inputNativeId,
  forceScrollToEndKey,
  contentContainerStyle,
  keyboardLiftBehavior = "always",
  keyboardShouldPersistTaps = "handled",
}: AiPlannerChatLayoutProps) {
  const insets = useSafeAreaInsets();
  const scrollRef =
    useRef<React.ElementRef<typeof KeyboardChatScrollView>>(null);
  const footerBaselineHeight = useRef<number | null>(null);
  const isEndVisible = useRef(true);
  const lastHandledForceScrollKey = useRef(forceScrollToEndKey);
  const forcedScrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const extraContentPadding = useSharedValue(0);

  useEffect(
    () => () => {
      if (forcedScrollTimeout.current) {
        clearTimeout(forcedScrollTimeout.current);
      }
    },
    [],
  );

  const handleEndVisible = useCallback((visible: boolean) => {
    isEndVisible.current = visible;
  }, []);

  const handleContentSizeChange = useCallback(() => {
    const hasForceScrollRequest =
      forceScrollToEndKey !== undefined &&
      forceScrollToEndKey !== lastHandledForceScrollKey.current;

    if (hasForceScrollRequest) {
      lastHandledForceScrollKey.current = forceScrollToEndKey;

      if (forcedScrollTimeout.current) {
        clearTimeout(forcedScrollTimeout.current);
      }

      forcedScrollTimeout.current = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
        forcedScrollTimeout.current = null;
      }, FORCED_SCROLL_DELAY_MS);

      return;
    }

    if (isEndVisible.current) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [forceScrollToEndKey]);

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
        onContentSizeChange={handleContentSizeChange}
        onEndVisible={handleEndVisible}
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
              withTiming(Math.max(height - footerBaselineHeight.current, 0), {
                duration: 200,
              }),
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
