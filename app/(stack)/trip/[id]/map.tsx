import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getCardBasicStyle, getColor } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import {
  actionListLocalPinLocationsByTripAndDate,
  type LocalPinWithLocation,
} from "@/lib/sqlite/model/pin-location";
import { actionGetLocalTrip } from "@/lib/sqlite/model/trip";
import { formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft as ChevronLeftIcon,
  LocateFixed as LocateFixedIcon,
  MapPin as MapPinIcon,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import MapView, { Marker, type LatLng, type Region } from "react-native-maps";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const DEFAULT_REGION = {
  latitude: 51.5074,
  longitude: -0.1278,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};
const PIN_CAROUSEL_GAP = gaps.xs;

export default function TripMapScreen() {
  const { id, date, pinId } = useLocalSearchParams<{
    id: string;
    date?: string;
    pinId?: string;
  }>();
  const router = useRouter();
  const { session } = useAuthSession();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const mapRef = useRef<MapView>(null);
  const pinCarouselRef = useRef<FlatList<LocalPinWithLocation>>(null);
  const tripId = String(id);

  const { data: localTrip } = useQuery({
    queryKey: ["local-trip", tripId, session?.user.id],
    queryFn: () => actionGetLocalTrip(tripId, session!.user.id),
    enabled: Boolean(tripId && session?.user.id),
  });

  const tripDays = useMemo(() => {
    if (!localTrip) {
      return [];
    }

    const dayCount =
      dayjs(localTrip.endDate).diff(dayjs(localTrip.startDate), "day") + 1;

    return Array.from({ length: Math.max(dayCount, 0) }, (_, index) => {
      const value = dayjs(localTrip.startDate)
        .add(index, "day")
        .format("YYYY-MM-DD");

      return {
        index,
        value,
        label: `Day ${index + 1}`,
      };
    });
  }, [localTrip]);

  const initialDate = useMemo(() => {
    if (date) {
      return String(date);
    }

    if (!localTrip) {
      return "";
    }

    const today = dayjs().format("YYYY-MM-DD");
    const isTodayWithinTrip =
      !dayjs(today).isBefore(dayjs(localTrip.startDate), "day") &&
      !dayjs(today).isAfter(dayjs(localTrip.endDate), "day");

    return isTodayWithinTrip ? today : localTrip.startDate;
  }, [date, localTrip]);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(
    pinId ? String(pinId) : null,
  );

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    if (pinId) {
      setSelectedPinId(String(pinId));
    }
  }, [pinId]);

  const { data: pins = [] } = useQuery({
    queryKey: ["local-pin-locations", tripId, selectedDate, session?.user.id],
    queryFn: () =>
      actionListLocalPinLocationsByTripAndDate(
        tripId,
        session!.user.id,
        selectedDate,
      ),
    enabled: Boolean(tripId && selectedDate && session?.user.id),
  });

  console.log("Pins for selected date:", pins);

  const selectedPin = useMemo(() => {
    if (selectedPinId) {
      return pins.find((pin) => pin.id === selectedPinId) ?? pins[0] ?? null;
    }

    return pins[0] ?? null;
  }, [pins, selectedPinId]);

  const selectedPinIndex = useMemo(() => {
    if (!selectedPin) {
      return -1;
    }

    return pins.findIndex((pin) => pin.id === selectedPin.id);
  }, [pins, selectedPin]);

  const carouselItemWidth = windowWidth - gaps.md * 3;
  const carouselSnapInterval = carouselItemWidth + PIN_CAROUSEL_GAP;

  const visibleCoordinates = useMemo<LatLng[]>(
    () =>
      pins.map((pin) => ({
        latitude: pin.latitude,
        longitude: pin.longitude,
      })),
    [pins],
  );

  const initialRegion = useMemo<Region>(() => {
    if (selectedPin) {
      return {
        latitude: selectedPin.latitude,
        longitude: selectedPin.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }

    return DEFAULT_REGION;
  }, [selectedPin]);

  const focusPin = useCallback((pin: LocalPinWithLocation) => {
    mapRef.current?.animateToRegion(
      {
        latitude: pin.latitude,
        longitude: pin.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      300,
    );
  }, []);

  const selectPinAtIndex = (index: number) => {
    const pin = pins[index];

    if (!pin) {
      return;
    }

    setSelectedPinId(pin.id);
    focusPin(pin);
    pinCarouselRef.current?.scrollToIndex({
      index,
      animated: true,
    });
  };

  const handlePinCarouselScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (carouselItemWidth === 0) {
      return;
    }

    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / carouselSnapInterval,
    );
    const pin = pins[nextIndex];

    if (!pin) {
      return;
    }

    setSelectedPinId(pin.id);
    focusPin(pin);
  };

  const fitVisiblePins = () => {
    if (visibleCoordinates.length === 0) {
      return;
    }

    if (visibleCoordinates.length === 1) {
      const pin = pins[0];
      focusPin(pin);
      return;
    }

    mapRef.current?.fitToCoordinates(visibleCoordinates, {
      edgePadding: {
        top: 120,
        right: 80,
        bottom: 260,
        left: 80,
      },
      animated: true,
    });
  };

  useEffect(() => {
    if (!selectedPin) {
      return;
    }

    const timeout = setTimeout(() => {
      focusPin(selectedPin);
    }, 250);

    return () => clearTimeout(timeout);
  }, [focusPin, selectedPin]);

  useEffect(() => {
    if (selectedPinIndex < 0) {
      return;
    }

    pinCarouselRef.current?.scrollToIndex({
      index: selectedPinIndex,
      animated: true,
    });
  }, [selectedPinIndex]);

  useEffect(() => {
    if (selectedPinId && pins.some((pin) => pin.id === selectedPinId)) {
      return;
    }

    setSelectedPinId(pins[0]?.id ?? null);
  }, [pins, selectedPinId]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {pins.map((pin, index) => {
          return (
            <Marker
              key={pin.id}
              coordinate={{
                latitude: pin.latitude,
                longitude: pin.longitude,
              }}
              title={pin.name}
              description={pin.displayName}
              onPress={() => {
                selectPinAtIndex(index);
              }}
            ></Marker>
          );
        })}
      </MapView>

      <SafeAreaView
        pointerEvents="box-none"
        style={StyleSheet.absoluteFill}
        edges={["top", "bottom"]}
      >
        <View style={[styles.topControls, { top: insets.top }]}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              router.back();
            }}
            activeOpacity={0.8}
          >
            <ChevronLeftIcon size={24} color={getColor(colors.textDarkGrey)} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={fitVisiblePins}
            activeOpacity={0.8}
          >
            <LocateFixedIcon size={22} color={getColor(colors.textDarkGrey)} />
          </TouchableOpacity>
        </View>

        {pins.length === 0 ? (
          <View style={styles.emptyState}>
            <MapPinIcon size={28} color={getColor(colors.textLightGrey)} />
            <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
              No mapped pins for this day
            </TitleRegular>
            <TitleRegular size="xs" color={colors.textLightGrey}>
              Add places to pins to see them here
            </TitleRegular>
          </View>
        ) : null}

        <View
          style={[styles.bottomPanel, { paddingBottom: insets.bottom + 12 }]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayList}
          >
            {tripDays.map((tripDay) => {
              const isSelected = tripDay.value === selectedDate;

              return (
                <TouchableOpacity
                  key={tripDay.value}
                  style={[styles.dayChip, isSelected && styles.dayChipActive]}
                  onPress={() => {
                    setSelectedDate(tripDay.value);
                    setSelectedPinId(null);
                  }}
                  activeOpacity={0.8}
                >
                  <TitleRegular
                    size="xs"
                    weight="600"
                    color={isSelected ? colors.white : colors.textDarkGrey}
                  >
                    {tripDay.label}
                  </TitleRegular>
                  <TitleRegular
                    size="xxs"
                    color={isSelected ? colors.white : colors.textLightGrey}
                  >
                    {formatDate(tripDay.value, "short")}
                  </TitleRegular>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {pins.length > 0 ? (
            <View style={styles.carouselContainer}>
              <FlatList
                ref={pinCarouselRef}
                data={pins}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={carouselSnapInterval}
                snapToAlignment="start"
                decelerationRate="fast"
                contentContainerStyle={styles.carouselList}
                keyExtractor={(pin) => pin.id}
                getItemLayout={(_, index) => ({
                  length: carouselSnapInterval,
                  offset: carouselSnapInterval * index,
                  index,
                })}
                onMomentumScrollEnd={handlePinCarouselScrollEnd}
                onScrollToIndexFailed={({ index }) => {
                  requestAnimationFrame(() => {
                    pinCarouselRef.current?.scrollToIndex({
                      index,
                      animated: false,
                    });
                  });
                }}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.carouselItem,
                      { width: carouselItemWidth },
                    ]}
                  >
                    <View style={styles.pinCard}>
                      <View style={styles.pinCardHeader}>
                        <TitleRegular
                          size="md"
                          weight="600"
                          color={colors.textDarkGrey}
                        >
                          {item.name}
                        </TitleRegular>
                        <TitleRegular
                          size="xs"
                          weight="600"
                          color={colors.purple}
                        >
                          {item.time}
                        </TitleRegular>
                      </View>
                      <TitleRegular size="sm" color={colors.textDarkGrey}>
                        {item.displayName}
                      </TitleRegular>
                      <TitleRegular size="xs" color={colors.textLightGrey}>
                        {item.formattedAddress}
                      </TitleRegular>
                    </View>
                  </View>
                )}
              />
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: getColor(colors.white),
  },
  map: {
    flex: 1,
    position: "relative",
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: gaps.md,
    paddingTop: gaps.xs,
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 2,
  },
  iconButton: {
    ...getCardBasicStyle("sm"),
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.white),
    padding: 0,
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.pineGreen),
    borderWidth: 2,
    borderColor: getColor(colors.white),
    position: "relative",
  },
  markerSelected: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: getColor(colors.purple),
  },
  emptyState: {
    position: "absolute",
    left: gaps.xl,
    right: gaps.xl,
    top: "38%",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xxs,
    ...getCardBasicStyle("md"),
  },
  bottomPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    gap: gaps.sm,
    paddingTop: gaps.sm,
  },
  dayList: {
    gap: gaps.xs,
    paddingHorizontal: gaps.md,
  },
  dayChip: {
    ...getCardBasicStyle("sm"),
    minWidth: 76,
    alignItems: "center",
    gap: 2,
    paddingHorizontal: gaps.sm,
    paddingVertical: gaps.xs,
    borderRadius: 8,
    backgroundColor: getColor(colors.white),
  },
  dayChipActive: {
    backgroundColor: getColor(colors.waffle),
  },
  carouselContainer: {
    position: "relative",
  },
  carouselList: {
    gap: PIN_CAROUSEL_GAP,
    paddingHorizontal: gaps.md,
  },
  carouselItem: {
    flexShrink: 0,
  },
  pinCard: {
    ...getCardBasicStyle("md"),
    gap: gaps.xxs,
    borderRadius: 8,
  },
  pinCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: gaps.sm,
  },
});
