import { colors, gaps, getColor } from "@/constants/theme";
import { formatDate } from "@/lib/utils";
import { TripDay } from "@/types/trip";
import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { TitleRegular } from "../title/regular";

type TripDaysTabProps = {
  tripDays: TripDay[];
};

export const TripDaysTab = ({ tripDays }: TripDaysTabProps) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {tripDays.map((tripDay, index) => (
        <TouchableOpacity
          key={tripDay.date}
          style={[styles.tabItem, tripDay.isActive && styles.tabItemActive]}
          onPress={() => {
            tripDay.onPress();
          }}
        >
          <TitleRegular
            size="md"
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    gap: gaps.xxs,
  },
  tabItemActive: {
    backgroundColor: getColor(colors.waffle),
  },
  activeText: {
    color: "white",
  },
  activeDate: {
    color: "white",
  },
});
