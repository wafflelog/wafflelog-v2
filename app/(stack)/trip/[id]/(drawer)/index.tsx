import { ButtonFab } from "@/components/button/fab";
import { ConfirmActionDialog } from "@/components/dialog/confirm-action";
import { DialogNewPin } from "@/components/dialog/new-pin";
import { TitleRegular } from "@/components/title/regular";
import { TripCategoryFilter } from "@/components/trip/category-filter";
import { TripDaysTab } from "@/components/trip/days-tab";
import { TripPinsList } from "@/components/trip/pins-list";
import { colors, gaps, getCardBasicStyle, getColor } from "@/constants/theme";
import { CATEGORIES } from "@/constants/pin-categories";
import { useAuthSession } from "@/hook/use-auth-session";
import { actionGetRemoteTripById } from "@/lib/supabase/actions";
import { actionListLocalPinsByTripAndDate } from "@/lib/sqlite/model/pin";
import {
  actionGetLocalTrip,
  actionSoftDeleteLocalTrip,
  actionUpsertLocalTripFromRemote,
} from "@/lib/sqlite/model/trip";
import { type Pin } from "@/types/pin";
import { type Trip } from "@/types/trip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus as PlusIcon, Trash2 as Trash2Icon } from "lucide-react-native";
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

  const softDeleteTripMutation = useMutation({
    mutationFn: () => actionSoftDeleteLocalTrip(String(id), session!.user.id),
    onSuccess: async () => {
      setIsDeleteDialogOpen(false);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["local-trip", String(id), session?.user.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["local-trips", session?.user.id],
        }),
      ]);

      router.replace("/");
    },
  });

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
      time: dayjs(`${pin.date} ${pin.time}`).toISOString(),
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
          <TitleRegular size="md" weight="600">
            Itinerary
          </TitleRegular>
          <TripDaysTab tripDays={tripDays} />
        </View>
        <TripPinsList
          tripDays={tripDays}
          ref={carouselRef}
          onSlideChanged={setSelectedDayIndex}
        />
      </ScrollView>
      <TouchableOpacity
        style={styles.deleteTripFab}
        onPress={() => setIsDeleteDialogOpen(true)}
        activeOpacity={0.8}
      >
        <Trash2Icon size={20} color={getColor(colors.white)} />
        <TitleRegular size="sm" weight="600" color={colors.white}>
          Delete Trip
        </TitleRegular>
      </TouchableOpacity>
      <ButtonFab
        onPress={() => {
          setIsDialogNewPinOpen(true);
        }}
        text="New Pin"
        icon={(color) => <PlusIcon size={20} color={color} />}
      />
      <DialogNewPin
        tripId={String(id)}
        visible={isDialogNewPinOpen}
        onDismiss={() => setIsDialogNewPinOpen(false)}
      />
      <ConfirmActionDialog
        visible={isDeleteDialogOpen}
        title="Delete Trip"
        message="Are you sure you want to delete this trip?"
        confirmText="Delete"
        onDismiss={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => {
          if (!trip || !session?.user.id) {
            return;
          }

          softDeleteTripMutation.mutate();
        }}
        isPending={softDeleteTripMutation.isPending}
        confirmVariant="danger"
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
  deleteTripFab: {
    position: "absolute",
    bottom: 84,
    right: gaps.xl,
    flexDirection: "row",
    alignItems: "center",
    ...getCardBasicStyle("sm"),
    backgroundColor: getColor(colors.red),
    borderRadius: 9999,
    gap: gaps.xs,
  },
});
