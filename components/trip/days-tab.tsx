import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import { formatDate } from "@/lib/helper/utils";
import { TripDay } from "@/types/trip";
import { useCallback, useEffect, useRef } from "react";
import {
  type LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { TitleRegular } from "../title/regular";

type TripDaysTabProps = {
  tripDays: TripDay[];
};

export const TripDaysTab = ({ tripDays }: TripDaysTabProps) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const viewportWidthRef = useRef(0);
  const tabLayoutsRef = useRef(new Map<number, { width: number; x: number }>());
  const activeDayIndex = tripDays.findIndex((tripDay) => tripDay.isActive);

  const scrollToActiveDay = useCallback((animated: boolean) => {
    const activeTabLayout = tabLayoutsRef.current.get(activeDayIndex);

    if (!activeTabLayout) {
      return;
    }

    const centeredOffset =
      activeTabLayout.x -
      Math.max(0, (viewportWidthRef.current - activeTabLayout.width) / 2);

    scrollViewRef.current?.scrollTo({
      x: Math.max(0, centeredOffset),
      animated,
    });
  }, [activeDayIndex]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => scrollToActiveDay(true));
    return () => cancelAnimationFrame(frame);
  }, [scrollToActiveDay]);

  const handleViewportLayout = (event: LayoutChangeEvent) => {
    viewportWidthRef.current = event.nativeEvent.layout.width;
    scrollToActiveDay(false);
  };

  const handleTabLayout = (index: number, event: LayoutChangeEvent) => {
    const { width, x } = event.nativeEvent.layout;
    tabLayoutsRef.current.set(index, { width, x });

    if (index === activeDayIndex) {
      scrollToActiveDay(false);
    }
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
      onLayout={handleViewportLayout}
    >
      {tripDays.map((tripDay, index) => (
        <TouchableOpacity
          key={tripDay.date}
          style={[styles.tabItem, tripDay.isActive && styles.tabItemActive]}
          onPress={() => {
            tripDay.onPress();
          }}
          onLayout={(event) => handleTabLayout(index, event)}
          accessibilityRole="tab"
          accessibilityState={{ selected: tripDay.isActive }}
        >
          <TitleRegular
            size="sm"
            style={tripDay.isActive && styles.activeText}
            weight="600"
          >
            Day {index + 1}
          </TitleRegular>
          <TitleRegular
            size="xs"
            style={[tripDay.isActive && styles.activeDate]}
            weight="500"
          >
            {formatDate(tripDay.date, "short")}
          </TitleRegular>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {},
  content: {
    gap: 8,
  },
  tabItem: {
    paddingHorizontal: gaps.sm,
    paddingVertical: gaps.xs,
    borderRadius: borderRadiuses.sm,
    alignItems: "center",
    gap: gaps.xxs,
    minHeight: 52,
  },
  tabItemActive: {
    backgroundColor: getColor(colors.waffle),
  },
  activeText: {
    color: getColor(colors.textDarkGrey),
  },
  activeDate: {
    color: getColor(colors.textDarkGrey),
  },
});
