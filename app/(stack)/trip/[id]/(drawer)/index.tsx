import { ButtonFab } from "@/components/button/fab";
import { DialogNewPin } from "@/components/dialog/new-pin";
import { TitleRegular } from "@/components/title/regular";
import { TripCategoryFilter } from "@/components/trip/category-filter";
import { TripDaysTab } from "@/components/trip/days-tab";
import { TripPinsList } from "@/components/trip/pins-list";
import { colors, gaps, getColor } from "@/constants/theme";
import { CATEGORIES } from "@/constants/pin-categories";
import { useAuthSession } from "@/hook/use-auth-session";
import { actionGetRemoteTripById } from "@/lib/supabase/actions";
import { actionListLocalPinsByTripAndDate } from "@/lib/sqlite/model/pin";
import {
  actionGetLocalTrip,
  actionUpsertLocalTripFromRemote,
} from "@/lib/sqlite/model/trip";
import { type Pin } from "@/types/pin";
import { type Trip } from "@/types/trip";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Map as MapIcon,
  Plus as PlusIcon,
} from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function TripIndexScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const carouselRef = useRef<FlatList>(null);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isDialogNewPinOpen, setIsDialogNewPinOpen] = useState(false);

  const { data: localTrip } = useQuery({
    queryKey: ["local-trip", String(id), session?.user.id],
    queryFn: () => actionGetLocalTrip(String(id), session!.user.id),
    enabled: Boolean(id && session?.user.id),
  });

  useQuery({
    queryKey: ["remote-trip", String(id), session?.user.id],
    queryFn: async () => {
      const remoteTrip = await actionGetRemoteTripById(String(id));
      const shouldApplyRemote =
        !localTrip ||
        (localTrip.syncStatus === "synced" &&
          dayjs(remoteTrip.updatedAt).isAfter(dayjs(localTrip.updatedAt)));

      if (shouldApplyRemote) {
        await actionUpsertLocalTripFromRemote(remoteTrip);
        await queryClient.invalidateQueries({
          queryKey: ["local-trip", String(id), session?.user.id],
        });
      }

      return remoteTrip;
    },
    enabled: Boolean(id && session?.user.id),
    staleTime: 0,
    gcTime: 0,
  });

  const trip: Trip | null = useMemo(() => {
    return localTrip
      ? {
          id: localTrip.id,
          title: localTrip.title,
          startDate: localTrip.startDate,
          endDate: localTrip.endDate,
          location: "Unknown destination",
          companions: [],
          pins: [],
          checklistItems: [],
          referenceLinks: [],
          documents: [],
          images: [],
          expenses: [],
        }
      : null;
  }, [localTrip]);

  const selectedDate = useMemo(() => {
    if (!trip) {
      return null;
    }

    return dayjs(trip.startDate)
      .add(selectedDayIndex, "day")
      .format("YYYY-MM-DD");
  }, [trip, selectedDayIndex]);

  const { data: selectedDayPins = [] } = useQuery({
    queryKey: ["local-pins", String(id), selectedDate, session?.user.id],
    queryFn: () =>
      actionListLocalPinsByTripAndDate(
        String(id),
        session!.user.id,
        selectedDate!,
      ),
    enabled: Boolean(id && selectedDate && session?.user.id),
  });

  const numOfDays =
    dayjs(trip?.endDate).diff(dayjs(trip?.startDate), "day") + 1 || 0;

  const tripDays = useMemo(() => {
    if (!trip) return [];

    const mappedSelectedDayPins: Pin[] = selectedDayPins.map((pin) => ({
      id: pin.id,
      name: pin.name,
      category:
        CATEGORIES.find((category) => category.id === pin.categoryId) ??
        CATEGORIES[0],
      location: {
        id: `location-${pin.id}`,
        name: "Unknown location",
        address: "",
        latitude: 0,
        longitude: 0,
      },
      startDate: pin.startDate,
      startTime: pin.startTime,
      endDate: pin.endDate,
      endTime: pin.endTime,
      allDay: pin.allDay,
      metadata: pin.metadataJson,
      referenceLinks: [],
      documents: [],
      expenses: [],
      images: [],
      notes: [],
    }));
    const filteredSelectedDayPins =
      selectedCategoryIds.length > 0
        ? mappedSelectedDayPins.filter((pin) =>
            selectedCategoryIds.includes(pin.category.id),
          )
        : mappedSelectedDayPins;

    return Array.from({ length: numOfDays }, (_, index) => ({
      date: dayjs(trip.startDate).add(index, "day").toISOString(),
      isActive: selectedDayIndex === index,
      pins: selectedDayIndex === index ? filteredSelectedDayPins : [],
      onPress: () => {
        setSelectedDayIndex(index);
        carouselRef.current?.scrollToIndex({
          index,
          animated: true,
        });
      },
    }));
  }, [
    trip,
    numOfDays,
    selectedDayIndex,
    selectedDayPins,
    selectedCategoryIds,
  ]);

  if (!trip) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.top}>
          <TripCategoryFilter
            categories={CATEGORIES}
            selectedCategoryIds={selectedCategoryIds}
            onSelectedCategoryIdsChange={setSelectedCategoryIds}
          />
        </View>

        <View style={styles.itinerary}>
          <View style={styles.itineraryHeader}>
            <TitleRegular size="md" weight="600">
              Itinerary
            </TitleRegular>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => {
                router.push({
                  pathname: "/trip/[id]/map",
                  params: {
                    id: String(id),
                    date: selectedDate ?? undefined,
                  },
                });
              }}
              activeOpacity={0.8}
            >
              <MapIcon size={16} color={getColor(colors.pineGreen)} />
              <TitleRegular size="xs" weight="600" color={colors.pineGreen}>
                Map
              </TitleRegular>
            </TouchableOpacity>
          </View>
          <TripDaysTab tripDays={tripDays} />
        </View>
        <TripPinsList
          tripDays={tripDays}
          ref={carouselRef}
          onSlideChanged={setSelectedDayIndex}
        />
      </ScrollView>
      <ButtonFab
        onPress={() => {
          setIsDialogNewPinOpen(true);
        }}
        text="New Pin"
        icon={(color) => <PlusIcon size={20} color={color} />}
      />
      <DialogNewPin
        tripId={String(id)}
        tripStartDate={trip.startDate}
        tripEndDate={trip.endDate}
        visible={isDialogNewPinOpen}
        onDismiss={() => setIsDialogNewPinOpen(false)}
      />
    </View>
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
  itineraryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: gaps.sm,
  },
  mapButton: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xxs,
    paddingHorizontal: gaps.sm,
    paddingVertical: gaps.xxs,
    borderRadius: 8,
    backgroundColor: getColor(colors.pineGreen, 0.12),
  },
});
