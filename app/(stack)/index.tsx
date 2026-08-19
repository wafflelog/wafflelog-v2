import { ButtonFab } from "@/components/button/fab";
import { CardTrip } from "@/components/card/trip";
import { DialogNewTrip } from "@/components/dialog/new-trip";
import { AppHeader } from "@/components/header/app-header";
import { HeaderSettingsButton } from "@/components/header/icon-button";
import { TitleRegular } from "@/components/title/regular";
import { UIText } from "@/components/ui/text";
import { colors, gaps, getColor, semanticColors } from "@/constants/theme";
import { useAppNotifications } from "@/hook/use-app-notifications";
import { useAuthSession } from "@/hook/use-auth-session";
import { actionListLocalTrips } from "@/lib/sqlite/model/trip";
import { type Trip } from "@/types/trip";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Image } from "expo-image";
import { Redirect, useRouter } from "expo-router";
import {
  Bell as BellIcon,
  Calendar as CalendarIcon,
  ChevronRight as ChevronRightIcon,
  Plane as PlaneIcon,
  Plus as PlusIcon,
  Sparkles as SparklesIcon,
} from "lucide-react-native";
import { useState } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function IndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, isAuthenticated, isLoading } = useAuthSession();
  const [isDialogNewTripOpen, setIsDialogNewTripOpen] = useState(false);
  const [showAllUpcomingTrips, setShowAllUpcomingTrips] = useState(false);
  const [showAllPastTrips, setShowAllPastTrips] = useState(false);

  const { data: tripData = [] } = useQuery({
    queryKey: ["local-trips", session?.user.id],
    queryFn: () => actionListLocalTrips(session!.user.id),
    enabled: Boolean(session?.user.id),
  });
  const notificationsQuery = useAppNotifications(session?.user.id);
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <TitleRegular size="lg" color={colors.textDarkGrey}>
          Loading...
        </TitleRegular>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/register" />;
  }

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const localTrips: Trip[] = tripData.map((trip) => ({
    id: trip.id,
    title: trip.title,
    startDate: trip.startDate,
    endDate: trip.endDate,
    companions: [],
    pins: [],
    checklistItems: [],
    referenceLinks: [],
    documents: [],
    images: [],
    expenses: [],
  }));
  const mappedTrips = localTrips;

  const today = dayjs().startOf("day");

  const ongoingTrips = mappedTrips
    .filter(
      (trip) =>
        !dayjs(trip.startDate).isAfter(today, "day") &&
        !dayjs(trip.endDate).isBefore(today, "day"),
    )
    .sort((a, b) => dayjs(a.endDate).diff(dayjs(b.endDate)));

  const upcomingTrips = mappedTrips
    .filter((trip) => dayjs(trip.startDate).isAfter(today, "day"))
    .sort((a, b) => dayjs(a.startDate).diff(dayjs(b.startDate)));

  const pastTrips = mappedTrips
    .filter((trip) => dayjs(trip.endDate).isBefore(today, "day"))
    .sort((a, b) => dayjs(b.endDate).diff(dayjs(a.endDate)));

  const nextUpcomingTrip = upcomingTrips[0];
  const daysUntilNextTrip = nextUpcomingTrip
    ? dayjs(nextUpcomingTrip.startDate).startOf("day").diff(today, "day")
    : null;
  const username = session?.user.user_metadata.username || "Traveler";
  const unreadNotificationCount =
    notificationsQuery.data?.filter((notification) => !notification.read_at)
      .length ?? 0;
  const notificationBadgeLabel =
    unreadNotificationCount > 99 ? "99+" : String(unreadNotificationCount);
  const visibleUpcomingTrips = showAllUpcomingTrips
    ? upcomingTrips
    : upcomingTrips.slice(0, 2);
  const visiblePastTrips = showAllPastTrips ? pastTrips : pastTrips.slice(0, 2);

  return (
    <View style={styles.container}>
      <AppHeader
        title="Wafflelog"
        titleAlign="left"
        leading={
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.brandLogo}
            contentFit="cover"
            accessibilityLabel="Wafflelog logo"
          />
        }
        trailing={
          <HeaderSettingsButton
            onPress={() => router.push("/settings")}
          />
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollViewContent,
          { paddingBottom: insets.bottom + 96 },
        ]}
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
              <UIText style={styles.greeting} weight="500">
                {getGreeting()}!
              </UIText>
              <UIText style={styles.userName} weight="700">
                {username}
              </UIText>
              {daysUntilNextTrip !== null && daysUntilNextTrip > 0 && (
                <View style={styles.countdownBadge}>
                  <CalendarIcon size={14} color={getColor(colors.turquoise)} />
                  <UIText style={styles.countdownText} weight="600">
                    {daysUntilNextTrip} {daysUntilNextTrip > 1 ? "days" : "day"}{" "}
                    until next trip
                  </UIText>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push("/notification-center")}
              accessibilityRole="button"
              accessibilityLabel={
                unreadNotificationCount > 0
                  ? `Notifications, ${unreadNotificationCount} unread`
                  : "Notifications"
              }
            >
              <BellIcon size={24} color="#fff" />
              {unreadNotificationCount > 0 ? (
                <View style={styles.notificationBadge}>
                  <UIText style={styles.notificationBadgeText} weight="700">
                    {notificationBadgeLabel}
                  </UIText>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </ImageBackground>

        <Pressable
          style={({ pressed }) => [
            styles.plannerCard,
            pressed && styles.plannerCardPressed,
          ]}
          onPress={() => router.push("/ai-trip-planner")}
          accessibilityRole="button"
          accessibilityLabel="Draft a trip with the trip planner"
        >
          <View style={styles.plannerIcon}>
            <SparklesIcon size={22} color={getColor(colors.purple)} />
          </View>
          <View style={styles.plannerContent}>
            <TitleRegular size="sm" weight="700">
              Draft a trip
            </TitleRegular>
            <TitleRegular size="xs" color={colors.textLightGrey}>
              Need inspiration? Share an idea and get a researched plan.
            </TitleRegular>
          </View>
          <View style={styles.plannerAction}>
            <ChevronRightIcon size={18} color={getColor(colors.purple)} />
          </View>
        </Pressable>

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
                <TouchableOpacity
                  style={styles.sectionHeaderAction}
                  onPress={() => setShowAllUpcomingTrips((current) => !current)}
                  accessibilityRole="button"
                >
                  <TitleRegular
                    size="sm"
                    weight="600"
                    color={colors.turquoise}
                  >
                    {showAllUpcomingTrips ? "Show less" : "View all"}
                  </TitleRegular>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.sectionContent}>
              {visibleUpcomingTrips.map((trip) => (
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
                <TouchableOpacity
                  style={styles.sectionHeaderAction}
                  onPress={() => setShowAllPastTrips((current) => !current)}
                  accessibilityRole="button"
                >
                  <TitleRegular
                    size="sm"
                    weight="600"
                    color={colors.purple}
                  >
                    {showAllPastTrips ? "Show less" : "View all"}
                  </TitleRegular>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.sectionContent}>
              {visiblePastTrips.map((trip) => (
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
              <TitleRegular size="xxl" weight="700" style={styles.emptyStateTitle}>
                No trips yet
              </TitleRegular>
              <TitleRegular
                size="md"
                color={colors.textLightGrey}
                style={styles.emptyStateText}
              >
                Create your first trip and keep every detail together.
              </TitleRegular>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => setIsDialogNewTripOpen(true)}
                accessibilityRole="button"
              >
                <TitleRegular
                  size="md"
                  weight="600"
                  style={styles.emptyStateButtonText}
                >
                  Create Your First Trip
                </TitleRegular>
              </TouchableOpacity>
            </View>
          )}
      </ScrollView>

      {mappedTrips.length > 0 ? (
        <ButtonFab
          onPress={() => {
            setIsDialogNewTripOpen(true);
          }}
          text="New Trip"
          icon={(color) => <PlusIcon size={20} color={color} />}
        />
      ) : null}
      <DialogNewTrip
        visible={isDialogNewTripOpen}
        onDismiss={() => setIsDialogNewTripOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.screen,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: semanticColors.screen,
  },
  brandLogo: {
    width: 38,
    height: 38,
    borderRadius: 11,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    // gap: gaps.sm,
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
    textTransform: "capitalize",
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
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: getColor(colors.red),
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
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
  sectionHeaderAction: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: gaps.xs,
  },
  sectionTitle: {
    borderBottomWidth: 1,
    paddingBottom: gaps.xs,
  },
  sectionContent: {
    gap: gaps.md,
  },
  plannerCard: {
    marginHorizontal: gaps.md,
    marginTop: -gaps.lg,
    padding: gaps.md,
    minHeight: 88,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: getColor(colors.purple, 0.2),
    backgroundColor: semanticColors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
    shadowColor: getColor(colors.black),
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    zIndex: 2,
  },
  plannerCardPressed: {
    borderColor: getColor(colors.purple, 0.42),
    shadowOpacity: 0.04,
    elevation: 1,
    transform: [{ translateY: 1 }, { scale: 0.995 }],
  },
  plannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.purple, 0.1),
  },
  plannerContent: {
    flex: 1,
    gap: gaps.xxs,
  },
  plannerAction: {
    width: 32,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: gaps.xl * 2,
    paddingHorizontal: gaps.md,
  },
  emptyStateTitle: {
    marginTop: gaps.md,
    marginBottom: gaps.xs,
  },
  emptyStateText: {
    textAlign: "center",
    marginBottom: gaps.lg,
  },
  emptyStateButton: {
    backgroundColor: semanticColors.primaryAction,
    paddingHorizontal: gaps.lg,
    paddingVertical: gaps.md,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: semanticColors.primaryActionContent,
  },
});
