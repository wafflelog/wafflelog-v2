import { CardPin } from "@/components/card/pin";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor, semanticColors } from "@/constants/theme";
import { type TripDay } from "@/types/trip";
import dayjs from "dayjs";
import {
  CalendarPlus as CalendarPlusIcon,
  ListFilter as ListFilterIcon,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInLeft,
  FadeInRight,
  FadeOutLeft,
  FadeOutRight,
  runOnJS,
} from "react-native-reanimated";
type TripPinsListProps = {
  tripDays: TripDay[];
  onDayChanged: (index: number) => void;
  onAddPin: () => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
};

const SWIPE_DISTANCE = 56;
const SWIPE_DOMINANCE = 1.25;
const TRANSITION_DURATION = 180;

export const TripPinsList = ({
  tripDays,
  onDayChanged,
  onAddPin,
  hasActiveFilters = false,
  onClearFilters,
}: TripPinsListProps) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [transitionDirection, setTransitionDirection] = useState<
    "next" | "previous"
  >("next");
  const activeDayIndex = tripDays.findIndex((tripDay) => tripDay.isActive);
  const activeDay = activeDayIndex >= 0 ? tripDays[activeDayIndex] : null;

  const handleSwipeEnd = useCallback(
    (translationX: number, translationY: number) => {
      const isHorizontalSwipe =
        Math.abs(translationX) >= SWIPE_DISTANCE &&
        Math.abs(translationX) > Math.abs(translationY) * SWIPE_DOMINANCE;

      if (!isHorizontalSwipe) {
        return;
      }

      const nextDayIndex =
        translationX < 0 ? activeDayIndex + 1 : activeDayIndex - 1;

      if (nextDayIndex >= 0 && nextDayIndex < tripDays.length) {
        setTransitionDirection(nextDayIndex > activeDayIndex ? "next" : "previous");
        onDayChanged(nextDayIndex);
      }
    },
    [activeDayIndex, onDayChanged, tripDays.length],
  );

  const swipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-24, 24])
        .failOffsetY([-16, 16])
        .onEnd((event) => {
          runOnJS(handleSwipeEnd)(event.translationX, event.translationY);
        }),
    [handleSwipeEnd],
  );

  const enteringAnimation =
    transitionDirection === "next" ? FadeInRight : FadeInLeft;
  const exitingAnimation =
    transitionDirection === "next" ? FadeOutLeft : FadeOutRight;

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [activeDay?.date]);

  if (!activeDay) {
    return null;
  }

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={styles.gestureArea}>
        <Animated.View
          key={activeDay.date}
          style={styles.animatedDay}
          entering={enteringAnimation.duration(TRANSITION_DURATION)}
          exiting={exitingAnimation.duration(TRANSITION_DURATION)}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scroller}
            contentContainerStyle={[
              styles.container,
              { paddingBottom: insets.bottom + 88 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {activeDay.pins.length > 0 ? (
              activeDay.pins.map((pin) => (
                <CardPin
                  key={pin.id}
                  pin={pin}
                  variant="regular"
                  selectedDate={activeDay.date}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  {hasActiveFilters ? (
                    <ListFilterIcon
                      size={24}
                      color={getColor(colors.purple)}
                    />
                  ) : (
                    <CalendarPlusIcon
                      size={24}
                      color={getColor(colors.purple)}
                    />
                  )}
                </View>
                <TitleRegular size="md" weight="600">
                  {hasActiveFilters
                    ? "No pins match these filters"
                    : `Nothing planned for ${dayjs(activeDay.date).format("dddd")} yet`}
                </TitleRegular>
                <TitleRegular
                  size="sm"
                  color={colors.textLightGrey}
                  style={styles.emptyMessage}
                >
                  {hasActiveFilters
                    ? "Clear the filters to see everything planned for this day."
                    : "Add a place, activity or journey to start building the day."}
                </TitleRegular>
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => {
                    if (hasActiveFilters) {
                      onClearFilters?.();
                      return;
                    }

                    onAddPin();
                  }}
                  accessibilityRole="button"
                >
                  <TitleRegular size="sm" weight="600">
                    {hasActiveFilters ? "Clear filters" : "Add first pin"}
                  </TitleRegular>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  gestureArea: {
    flex: 1,
    overflow: "hidden",
  },
  animatedDay: {
    flex: 1,
  },
  scroller: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  emptyState: {
    flex: 1,
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: gaps.lg,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.purple, 0.1),
    marginBottom: gaps.sm,
  },
  emptyMessage: {
    textAlign: "center",
    marginTop: gaps.xs,
  },
  emptyAction: {
    minHeight: 44,
    marginTop: gaps.md,
    paddingHorizontal: gaps.lg,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: semanticColors.primaryAction,
  },
});
