import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { router } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { DrawerItemRegular } from "@/components/drawer/item/regular";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import { PINS } from "@/data/pins";
import { TRIPS } from "@/data/trips";
import { formatDate } from "@/lib/utils";
import { MapPinIcon } from "lucide-react-native";
import { useState } from "react";

interface DrawerPinProps extends DrawerContentComponentProps {
  id?: string;
}

export function DrawerPin({ id, navigation }: DrawerPinProps) {
  const [activeLink, setActiveLink] = useState<string>(PINS[0].id);
  if (!id) {
    return null;
  }

  // This will show all the pins within the same day
  const pins = PINS;
  const trip = TRIPS[0];

  return (
    <DrawerContentScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <TitleRegular size="lg" weight="600" color={colors.blue}>
            {trip.title}
          </TitleRegular>
        </TouchableOpacity>
        <TitleRegular size="md" weight="600" color={colors.blue}>
          Day 1 - {formatDate(trip.startDate, "long")}
        </TitleRegular>
      </View>
      <View style={styles.divider} />
      <View style={styles.links}>
        {pins.map((pin) => (
          <DrawerItemRegular
            key={pin.id}
            item={{
              label: pin.name,
              isActive: activeLink === pin.id,
              onPress: () => {
                setActiveLink(pin.id);
                router.replace(`/pin/${pin.id}`);
              },
              icon: (color) => (
                <MapPinIcon
                  size={20}
                  color={activeLink === pin.id ? color : getColor(colors.blue)}
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
