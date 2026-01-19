import { HeaderTrip } from "@/components/header/trip";
import { TripCategoryFilter } from "@/components/trip/category-filter";
import { TripDaysTab } from "@/components/trip/days-tab";
import { TripPinsList } from "@/components/trip/pins-list";
import { UIText } from "@/components/ui/text";
import { colors, getColor } from "@/constants/theme";
import { TRIPS } from "@/data";
import { PinCategory } from "@/types/pin";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TripScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const carouselRef = useRef<FlatList>(null);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const trip = TRIPS.find((trip) => trip.id === id);

  const numOfDays =
    dayjs(trip?.endDate).diff(dayjs(trip?.startDate), "day") + 1 || 0;

  const tripDays = useMemo(() => {
    if (!trip) return [];
    return Array.from({ length: numOfDays }, (_, index) => ({
      date: dayjs(trip.startDate).add(index, "day").toISOString(),
      isActive: selectedDayIndex === index,
      pins: trip.pins.filter((pin) =>
        dayjs(pin.time).isSame(dayjs(trip.startDate).add(index, "day"), "day")
      ),
      onPress: () => {
        setSelectedDayIndex(index);
        carouselRef.current?.scrollToIndex({
          index,
          animated: true,
        });
      },
    }));
  }, [trip, numOfDays, selectedDayIndex]);

  const allCategories = useMemo(() => {
    if (!trip) return [];

    return trip.pins.reduce((acc, pin) => {
      if (!acc.some((category) => category.id === pin.category.id)) {
        acc.push(pin.category);
      }
      return acc;
    }, [] as PinCategory[]);
  }, [trip]);

  if (!trip) {
    return <UIText>Trip not found</UIText>;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <HeaderTrip
        trip={trip}
        onBackPress={() => router.back()}
        onMorePress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.top}>
          <TouchableOpacity onPress={() => router.push("/trip")}>
            <UIText>Design</UIText>
          </TouchableOpacity>

          <TripCategoryFilter categories={allCategories} />
        </View>

        <View style={styles.itinerary}>
          <UIText style={styles.sectionTitle} weight="600">
            Itinerary
          </UIText>
          <TripDaysTab tripDays={tripDays} />
        </View>
        <TripPinsList
          tripDays={tripDays}
          ref={carouselRef}
          onSlideChanged={setSelectedDayIndex}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    flexDirection: "column",
    gap: 16,
  },
  top: {
    gap: 16,
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 17,
    color: getColor(colors.textDarkGrey),
  },
  itinerary: {
    gap: 16,
    paddingHorizontal: 20,
  },
});
