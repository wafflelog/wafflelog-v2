import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { DrawerItemRegular } from "@/components/drawer/item/regular";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import {
  actionGetLocalPin,
  actionListLocalPinsByTripAndDate,
} from "@/lib/sqlite/model/pin";
import { actionGetLocalTrip } from "@/lib/sqlite/model/trip";
import { formatDate } from "@/lib/utils";
import { MapPinIcon } from "lucide-react-native";

interface DrawerPinProps extends DrawerContentComponentProps {
  id?: string;
}

export function DrawerPin({ id }: DrawerPinProps) {
  const { session } = useAuthSession();
  const router = useRouter();

  const { data: currentPin } = useQuery({
    queryKey: ["local-pin", String(id), session?.user.id],
    queryFn: () => actionGetLocalPin(String(id), session!.user.id),
    enabled: Boolean(id && session?.user.id),
  });

  const { data: trip } = useQuery({
    queryKey: ["local-trip", currentPin?.tripId, session?.user.id],
    queryFn: () => actionGetLocalTrip(currentPin!.tripId, session!.user.id),
    enabled: Boolean(currentPin?.tripId && session?.user.id),
  });

  const { data: pins = [] } = useQuery({
    queryKey: [
      "local-pins",
      currentPin?.tripId,
      currentPin?.date,
      session?.user.id,
    ],
    queryFn: () =>
      actionListLocalPinsByTripAndDate(
        currentPin!.tripId,
        session!.user.id,
        currentPin!.date,
      ),
    enabled: Boolean(
      currentPin?.tripId && currentPin?.date && session?.user.id,
    ),
  });

  if (!id) {
    return null;
  }

  const dayNumber =
    trip && currentPin
      ? dayjs(currentPin.date).diff(dayjs(trip.startDate), "day") + 1
      : null;

  return (
    <DrawerContentScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        {trip && (
          <TouchableOpacity onPress={() => router.back()}>
            <TitleRegular size="lg" weight="600" color={colors.blue}>
              {trip.title}
            </TitleRegular>
          </TouchableOpacity>
        )}
        {currentPin && dayNumber !== null && (
          <TitleRegular size="md" weight="600" color={colors.blue}>
            Day {dayNumber} - {formatDate(currentPin.date, "long")}
          </TitleRegular>
        )}
      </View>
      <View style={styles.divider} />
      <View style={styles.links}>
        {pins.map((pin) => (
          <DrawerItemRegular
            key={pin.id}
            item={{
              label: pin.name,
              isActive: id === pin.id,
              onPress: () => {
                router.replace(`/pin/${pin.id}`);
              },
              icon: (color) => (
                <MapPinIcon
                  size={20}
                  color={id === pin.id ? color : getColor(colors.blue)}
                />
              ),
            }}
          />
        ))}
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: gaps.sm,
    paddingVertical: gaps.sm,
  },
  content: {
    gap: gaps.lg,
  },
  links: {
    gap: 2,
  },
  header: {
    gap: gaps.sm,
  },
  divider: {
    height: 1,
    backgroundColor: getColor(colors.paleGrey, 0.5),
  },
});
