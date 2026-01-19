import { UIText } from "@/components/ui/text";
import { colors, getColor } from "@/constants/theme";
import { formatDate } from "@/lib/utils";
import { TripDay } from "@/types/trip";
import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";

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
          <UIText
            style={[styles.text, tripDay.isActive && styles.activeText]}
            weight="600"
          >
            Day {index + 1}
          </UIText>
          <UIText
            style={[styles.date, tripDay.isActive && styles.activeDate]}
            weight="500"
          >
            {formatDate(tripDay.date, "short")}
          </UIText>
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
  },
  tabItemActive: {
    // borderWidth: 1,
    // borderColor: getColor(colors.waffle),
    backgroundColor: getColor(colors.waffle),
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    color: getColor(colors.textLightGrey),
  },
  activeText: {
    color: "white",
  },
  date: {
    fontSize: 12,
    color: getColor(colors.textLightGrey),
    marginTop: 2,
  },
  activeDate: {
    color: "white",
  },
});
