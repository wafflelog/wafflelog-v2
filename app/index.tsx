import { ButtonFab } from "@/components/button/fab";
import { CardTrip } from "@/components/card/trip";
import { DialogNewTrip } from "@/components/dialog/new-trip";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import { TRIPS } from "@/data";
import { useRouter } from "expo-router";
import {
  Bell as BellIcon,
  Calendar as CalendarIcon,
  MapPin as MapPinIcon,
  Plane as PlaneIcon,
  Plus as PlusIcon,
} from "lucide-react-native";
import { useState } from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function IndexScreen() {
  const router = useRouter();
  const [isDialogNewTripOpen, setIsDialogNewTripOpen] = useState(false);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Get days until next trip
  const daysUntilNextTrip = 17;
  const ongoingTrips = TRIPS.slice(0, 1);
  const upcomingTrips = TRIPS.slice(1, 3);
  const pastTrips = TRIPS.slice(3);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Branding Header */}
      <View style={styles.brandingHeader}>
        <TitleRegular size="xl" style={styles.brandingText}>
          Wafflelog
        </TitleRegular>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Banner with Greeting */}
        <ImageBackground
          source={{
            uri: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80",
          }}
          style={styles.headerBanner}
          imageStyle={styles.headerBannerImage}
        >
          <View style={styles.headerBannerOverlay} />
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.greeting}>{getGreeting()}!</Text>
              <Text style={styles.userName}>Sarah</Text>
              {ongoingTrips.length > 0 && (
                <View style={styles.currentLocationBadge}>
                  <MapPinIcon size={14} color={getColor(colors.waffle)} />
                  <Text style={styles.currentLocationText}>
                    Currently in {ongoingTrips[0].location}
                  </Text>
                </View>
              )}
              {daysUntilNextTrip !== null && daysUntilNextTrip > 0 && (
                <View style={styles.countdownBadge}>
                  <CalendarIcon size={14} color={getColor(colors.turquoise)} />
                  <Text style={styles.countdownText}>
                    {daysUntilNextTrip} {daysUntilNextTrip > 1 ? "days" : "day"}{" "}
                    until next trip
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push("/notification-center")}
            >
              <BellIcon size={24} color="#fff" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Ongoing Trip */}
        {ongoingTrips.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TitleRegular
                size="md"
                weight="600"
                style={[
                  styles.sectionTitle,
                  { borderColor: getColor(colors.waffle) },
                ]}
              >
                Ongoing Trip
              </TitleRegular>
            </View>
            <View style={styles.sectionContent}>
              <CardTrip trip={ongoingTrips[0]} variant="hero" />
            </View>
          </View>
        )}

        {/* Upcoming Trips */}
        {upcomingTrips.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TitleRegular
                size="md"
                weight="600"
                style={[
                  styles.sectionTitle,
                  { borderColor: getColor(colors.turquoise) },
                ]}
              >
                Upcoming Trips
              </TitleRegular>
              {upcomingTrips.length > 2 ? (
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>View All</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.sectionContent}>
              {upcomingTrips.slice(0, 2).map((trip) => (
                <CardTrip
                  key={trip.id}
                  trip={trip}
                  variant="regular"
                  color="turquoise"
                />
              ))}
            </View>
          </View>
        )}

        {/* Past Trips */}
        {pastTrips.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TitleRegular
                size="md"
                weight="600"
                style={[
                  styles.sectionTitle,
                  { borderColor: getColor(colors.purple) },
                ]}
              >
                Past Trips
              </TitleRegular>
              {pastTrips.length > 2 ? (
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>View All</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.sectionContent}>
              {pastTrips.slice(0, 2).map((trip) => (
                <CardTrip
                  key={trip.id}
                  trip={trip}
                  variant="regular"
                  color="purple"
                />
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {ongoingTrips.length === 0 &&
          upcomingTrips.length === 0 &&
          pastTrips.length === 0 && (
            <View style={styles.emptyState}>
              <PlaneIcon size={64} color={getColor(colors.paleGrey)} />
              <Text style={styles.emptyStateTitle}>No trips yet</Text>
              <Text style={styles.emptyStateText}>
                Start planning your next adventure!
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => {
                  // TODO: Navigate to create trip
                }}
              >
                <Text style={styles.emptyStateButtonText}>
                  Create Your First Trip
                </Text>
              </TouchableOpacity>
            </View>
          )}
      </ScrollView>

      <ButtonFab
        onPress={() => {
          // TODO: Navigate to create trip
          setIsDialogNewTripOpen(true);
        }}
        text="New Trip"
        icon={(color) => <PlusIcon size={20} color={color} />}
      />
      <DialogNewTrip
        visible={isDialogNewTripOpen}
        onDismiss={() => setIsDialogNewTripOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  brandingHeader: {
    backgroundColor: "#fff",
    paddingHorizontal: gaps.md,
    paddingVertical: gaps.sm,
    borderBottomWidth: 1,
    borderBottomColor: getColor(colors.whiteGrey),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  brandingText: {
    fontSize: 20,
    fontWeight: "700",
    color: getColor(colors.waffle),
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    // gap: gaps.sm,
    paddingBottom: gaps.xl,
  },
  headerBanner: {
    paddingTop: gaps.md,
    paddingBottom: gaps.xl + gaps.md,
    minHeight: 200,
  },
  headerBannerImage: {
    resizeMode: "cover",
  },
  headerBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  header: {
    position: "relative",
    zIndex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: gaps.md,
    paddingTop: gaps.md,
    paddingBottom: gaps.sm,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 4,
    fontWeight: "500",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  userName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: gaps.sm,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  currentLocationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: gaps.sm,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: gaps.xs,
  },
  currentLocationText: {
    fontSize: 13,
    color: getColor(colors.textDarkGrey),
    fontWeight: "600",
    marginLeft: 6,
  },
  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: gaps.sm,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  countdownText: {
    fontSize: 13,
    color: getColor(colors.textDarkGrey),
    fontWeight: "600",
    marginLeft: 6,
  },
  notificationButton: {
    padding: gaps.xs,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: getColor(colors.red),
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  section: {
    paddingHorizontal: gaps.md,
    marginTop: gaps.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: gaps.md,
  },
  sectionTitle: {
    borderBottomWidth: 1,
    paddingBottom: gaps.xs,
  },
  sectionContent: {
    gap: gaps.md,
  },
  seeAllText: {
    fontSize: 14,
    color: getColor(colors.turquoise),
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: gaps.xl * 2,
    paddingHorizontal: gaps.md,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: getColor(colors.textDarkGrey),
    marginTop: gaps.md,
    marginBottom: gaps.xs,
  },
  emptyStateText: {
    fontSize: 16,
    color: getColor(colors.textLightGrey),
    textAlign: "center",
    marginBottom: gaps.lg,
  },
  emptyStateButton: {
    backgroundColor: getColor(colors.waffle),
    paddingHorizontal: gaps.lg,
    paddingVertical: gaps.md,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
