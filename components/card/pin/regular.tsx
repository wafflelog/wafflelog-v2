import { IconPinCategory } from "@/components/icon/pin-category";
import { UIText } from "@/components/ui/text";
import { colors, getColor } from "@/constants/theme";
import { formatTime } from "@/lib/utils";
import { type Pin } from "@/types/pin";

import { useRouter } from "expo-router";
import { ChevronRight as ChevronRightIcon } from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type CardPinRegularProps = {
  pin: Pin;
};

export const CardPinRegular = ({ pin }: CardPinRegularProps) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push("/pin")}
    >
      <View style={styles.iconContainer}>
        <IconPinCategory category={pin.category} />
      </View>

      <View style={styles.content}>
        <UIText style={styles.title} weight="600">
          {pin.name}
        </UIText>

        <UIText style={styles.date}>{formatTime(pin.time)}</UIText>

        {/* <View style={styles.locationContainer}>
          <MapPinIcon size={16} color={getColor(colors.pineGreen)} />
          <UIText style={styles.locationText}>{pin.address}</UIText>
        </View> */}
        {/* <ListUsersHorizontalIcons users={trip.companions} max={3} /> */}
      </View>

      <View style={styles.chevronContainer}>
        <ChevronRightIcon size={24} color={getColor(colors.waffle)} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    backgroundColor: getColor(colors.waffle, 0.2),
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flexDirection: "column",
    flex: 1,
    gap: 6,
    paddingRight: 10,
  },
  title: {
    fontSize: 14,
    color: getColor(colors.textDarkGrey),
  },
  date: {
    fontSize: 12,
    color: getColor(colors.textLightGrey),
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: getColor(colors.textLightGrey),
  },
  chevronContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});
