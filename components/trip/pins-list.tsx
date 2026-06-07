import { CardPin } from "@/components/card/pin";
import { type TripDay } from "@/types/trip";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeInLeft,
  FadeInRight,
  FadeOutLeft,
  FadeOutRight,
  runOnJS,
} from "react-native-reanimated";
import { UIText } from "../ui/text";

type TripPinsListProps = {
  tripDays: TripDay[];
  onDayChanged: (index: number) => void;
};

const SWIPE_DISTANCE = 56;
const SWIPE_DOMINANCE = 1.25;
const TRANSITION_DURATION = 180;

export const TripPinsList = ({ tripDays, onDayChanged }: TripPinsListProps) => {
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
            contentContainerStyle={styles.container}
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
              <UIText>No pins found</UIText>
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
    paddingBottom: 112,
    gap: 16,
  },
});
