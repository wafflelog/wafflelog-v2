import { CardPin } from "@/components/card/pin";
import { type TripDay } from "@/types/trip";
import { useCallback, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { UIText } from "../ui/text";

type TripPinsListProps = {
  tripDays: TripDay[];
  onDayChanged: (index: number) => void;
};

const SWIPE_DISTANCE = 56;
const SWIPE_DOMINANCE = 1.25;

export const TripPinsList = ({ tripDays, onDayChanged }: TripPinsListProps) => {
  const { height: screenHeight } = useWindowDimensions();
  const activeDayIndex = tripDays.findIndex((tripDay) => tripDay.isActive);
  const activeDay = activeDayIndex >= 0 ? tripDays[activeDayIndex] : null;
  const gestureAreaMinHeight = Math.max(screenHeight * 0.45, 320);

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

  if (!activeDay) {
    return null;
  }

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={[styles.gestureArea, { minHeight: gestureAreaMinHeight }]}>
        <View style={styles.container}>
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
        </View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  gestureArea: {
    flexGrow: 1,
  },
  container: {
    paddingHorizontal: 20,
    gap: 16,
  },
});
