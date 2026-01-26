import { CardPin } from "@/components/card/pin";
import { PINS } from "@/data/pins";
import { Ionicons } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function TripScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const carouselRef = useRef<FlatList>(null);

  // Dummy data - places grouped by day
  const tripDaysData = [
    {
      day: 1,
      date: "Mar 10, 2024",
      places: [
        {
          id: 1,
          name: "Sagrada Família",
          category: "Attraction",
          time: "09:00 AM",
          address: "Carrer de Mallorca, 401",
        },
        {
          id: 2,
          name: "Park Güell",
          category: "Park",
          time: "02:00 PM",
          address: "08024 Barcelona",
        },
        {
          id: 3,
          name: "La Boqueria Market",
          category: "Market",
          time: "06:00 PM",
          address: "La Rambla, 91",
        },
      ],
    },
    {
      day: 2,
      date: "Mar 11, 2024",
      places: [
        {
          id: 4,
          name: "Gothic Quarter",
          category: "Historic Area",
          time: "10:00 AM",
          address: "Barri Gòtic",
        },
        {
          id: 5,
          name: "Picasso Museum",
          category: "Museum",
          time: "01:00 PM",
          address: "Carrer de Montcada, 15-23",
        },
        {
          id: 6,
          name: "Barceloneta Beach",
          category: "Beach",
          time: "04:00 PM",
          address: "Barceloneta",
        },
      ],
    },
    {
      day: 3,
      date: "Mar 12, 2024",
      places: [
        {
          id: 7,
          name: "Montjuïc Hill",
          category: "Viewpoint",
          time: "09:30 AM",
          address: "Montjuïc",
        },
        {
          id: 8,
          name: "Magic Fountain",
          category: "Attraction",
          time: "08:00 PM",
          address: "Pl. de Carles Buïgas",
        },
      ],
    },
  ];

  // Extract all unique categories
  const allCategories = Array.from(
    new Set(
      tripDaysData.flatMap((day) => day.places.map((place) => place.category))
    )
  ).sort();

  // Filter trip days based on selected categories
  const tripDays =
    selectedCategories.length > 0
      ? tripDaysData
          .map((day) => ({
            ...day,
            places: day.places.filter((place) =>
              selectedCategories.includes(place.category)
            ),
          }))
          .filter((day) => day.places.length > 0) // Remove days with no places after filtering
      : tripDaysData;

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Barcelona Getaway</Text>
          <Text style={styles.headerSubtitle}>Mar 10 - Mar 17, 2024</Text>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggleContainer}>
        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            viewMode === "list" && styles.viewToggleButtonActive,
          ]}
          onPress={() => setViewMode("list")}
        >
          <Ionicons
            name="list"
            size={20}
            color={viewMode === "list" ? "#4A90E2" : "#666"}
          />
          <Text
            style={[
              styles.viewToggleText,
              viewMode === "list" && styles.viewToggleTextActive,
            ]}
          >
            List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            viewMode === "map" && styles.viewToggleButtonActive,
          ]}
          onPress={() => setViewMode("map")}
        >
          <Ionicons
            name="map"
            size={20}
            color={viewMode === "map" ? "#4A90E2" : "#666"}
          />
          <Text
            style={[
              styles.viewToggleText,
              viewMode === "map" && styles.viewToggleTextActive,
            ]}
          >
            Map
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === "list" ? (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Category Filter */}
          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filter by Category</Text>
              {selectedCategories.length > 0 && (
                <TouchableOpacity onPress={clearFilters}>
                  <Text style={styles.clearFilterText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsContainer}
            >
              {allCategories.map((category) => {
                const isSelected = selectedCategories.includes(category);
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterChip,
                      isSelected && styles.filterChipActive,
                    ]}
                    onPress={() => toggleCategory(category)}
                  >
                    <Ionicons
                      name="pricetag"
                      size={14}
                      color={isSelected ? "#4A90E2" : "#666"}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Trip Overview */}
          <View style={styles.overviewSection}>
            <View style={styles.overviewInfo}>
              <View style={styles.overviewBadge}>
                <Ionicons name="radio-button-on" size={12} color="#4A90E2" />
                <Text style={styles.overviewBadgeText}>In Progress</Text>
              </View>
              <View style={styles.friendsContainer}>
                <View style={styles.friendAvatars}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>S</Text>
                  </View>
                  <View
                    style={[styles.friendAvatar, styles.friendAvatarOverlap]}
                  >
                    <Text style={styles.friendAvatarText}>M</Text>
                  </View>
                  <View
                    style={[styles.friendAvatar, styles.friendAvatarOverlap]}
                  >
                    <Text style={styles.friendAvatarText}>J</Text>
                  </View>
                </View>
                <Text style={styles.friendsText}>Traveling with 4 others</Text>
              </View>
            </View>
          </View>

          {/* Places by Day */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Itinerary</Text>

            {/* Day Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dayTabsContainer}
              contentContainerStyle={styles.dayTabsContent}
            >
              {tripDays.map((dayData, index) => (
                <TouchableOpacity
                  key={dayData.day}
                  style={[
                    styles.dayTab,
                    selectedDayIndex === index && styles.dayTabActive,
                  ]}
                  onPress={() => {
                    setSelectedDayIndex(index);
                    carouselRef.current?.scrollToIndex({
                      index,
                      animated: true,
                    });
                  }}
                >
                  <Text
                    style={[
                      styles.dayTabText,
                      selectedDayIndex === index && styles.dayTabTextActive,
                    ]}
                  >
                    Day {dayData.day}
                  </Text>
                  <Text
                    style={[
                      styles.dayTabDate,
                      selectedDayIndex === index && styles.dayTabDateActive,
                    ]}
                  >
                    {dayData.date.split(", ")[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Horizontal Carousel */}
            <FlatList
              ref={carouselRef}
              data={tripDays}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `day-${item.day}`}
              getItemLayout={(data, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x / SCREEN_WIDTH
                );
                if (index >= 0 && index < tripDays.length) {
                  setSelectedDayIndex(index);
                }
              }}
              onScrollToIndexFailed={(info) => {
                // Handle scroll to index failure
                const wait = new Promise((resolve) => setTimeout(resolve, 500));
                wait.then(() => {
                  carouselRef.current?.scrollToIndex({
                    index: info.index,
                    animated: true,
                  });
                });
              }}
              renderItem={({ item: dayData }) => (
                <View style={styles.dayCarouselItem}>
                  <View style={styles.dayScrollView}>
                    {/* Day Header */}
                    <View style={styles.dayHeader}>
                      <View style={styles.dayNumber}>
                        <Text style={styles.dayNumberText}>
                          Day {dayData.day}
                        </Text>
                      </View>
                      <Text style={styles.dayDate}>{dayData.date}</Text>
                    </View>

                    {/* Places List */}
                    <View style={styles.placesList}>
                      {PINS.map((pin) => (
                        <CardPin key={pin.id} pin={pin} variant="regular" />
                      ))}
                    </View>
                  </View>
                </View>
              )}
            />
          </View>

          {/* Add Place Button */}
          <View style={styles.addPlaceSection}>
            <TouchableOpacity style={styles.addPlaceButton}>
              <Ionicons name="add-circle" size={24} color="#4A90E2" />
              <Text style={styles.addPlaceText}>Add a place</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={80} color="#999" />
            <Text style={styles.mapPlaceholderText}>Map View</Text>
            <Text style={styles.mapPlaceholderSubtext}>
              All trip places will be displayed on the map
            </Text>
          </View>
          {/* Map pins/places overlay */}
          <View style={styles.mapPinsContainer}>
            {tripDays.flatMap((dayData, dayIndex) =>
              dayData.places.map((place, placeIndex) => {
                // Calculate positions for pins (spread them in a circle)
                const totalPlaces = tripDays.reduce(
                  (sum, day) => sum + day.places.length,
                  0
                );
                const placeNumber =
                  tripDays
                    .slice(0, dayIndex)
                    .reduce((sum, day) => sum + day.places.length, 0) +
                  placeIndex;
                const angle = (placeNumber / totalPlaces) * Math.PI * 2;
                const radius = 100;
                const centerX = 180; // approximate center
                const centerY = 300; // approximate center
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);

                return (
                  <TouchableOpacity
                    key={place.id}
                    style={[
                      styles.mapPin,
                      {
                        top: y,
                        left: x,
                      },
                    ]}
                  >
                    <View style={styles.mapPinIcon}>
                      <Ionicons name="location" size={24} color="#4A90E2" />
                    </View>
                    <View style={styles.mapPinLabel}>
                      <Text style={styles.mapPinLabelText}>{place.name}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  viewToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    gap: 8,
  },
  viewToggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F5F7FA",
    gap: 6,
  },
  viewToggleButtonActive: {
    backgroundColor: "#E8F2FF",
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  viewToggleTextActive: {
    color: "#4A90E2",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#E8F5E9",
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
  },
  mapPlaceholderText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  mapPinsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapPin: {
    position: "absolute",
    alignItems: "center",
  },
  mapPinIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  mapPinLabel: {
    marginTop: 4,
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  mapPinLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#333",
  },
  overviewSection: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 8,
  },
  overviewImagePlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  overviewInfo: {
    gap: 12,
  },
  overviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  overviewBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A90E2",
    marginLeft: 4,
  },
  friendsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  friendAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  friendAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  friendAvatarOverlap: {
    marginLeft: -8,
  },
  friendAvatarText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  friendsText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 12,
  },
  filterSection: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  clearFilterText: {
    fontSize: 14,
    color: "#4A90E2",
    fontWeight: "500",
  },
  filterChipsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F7FA",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 6,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#E8F2FF",
    borderColor: "#4A90E2",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  filterChipTextActive: {
    color: "#4A90E2",
    fontWeight: "600",
  },
  section: {
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  dayTabsContainer: {
    marginBottom: 16,
  },
  dayTabsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F5F7FA",
    marginRight: 8,
    alignItems: "center",
    minWidth: 80,
  },
  dayTabActive: {
    backgroundColor: "#E8F2FF",
  },
  dayTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  dayTabTextActive: {
    color: "#4A90E2",
  },
  dayTabDate: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  dayTabDateActive: {
    color: "#4A90E2",
  },
  dayCarouselItem: {
    width: SCREEN_WIDTH,
  },
  dayScrollView: {
    paddingHorizontal: 20,
  },
  dayContainer: {
    marginBottom: 32,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dayNumber: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  dayNumberText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  dayDate: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  placesList: {
    position: "relative",
    gap: 10,
  },
  placeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  placeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 6,
  },
  placeCategory: {
    flexDirection: "row",
    alignItems: "center",
  },
  placeCategoryText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  placeTime: {
    flexDirection: "row",
    alignItems: "center",
  },
  placeTimeText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  placeAddress: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  placeAddressText: {
    fontSize: 12,
    color: "#999",
    marginLeft: 4,
    flex: 1,
  },
  timelineConnector: {
    position: "absolute",
    left: 30,
    top: 56,
    width: 2,
    height: 20,
    backgroundColor: "#E0E0E0",
    zIndex: 0,
  },
  addPlaceSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  addPlaceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  addPlaceText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4A90E2",
    marginLeft: 8,
  },
});
