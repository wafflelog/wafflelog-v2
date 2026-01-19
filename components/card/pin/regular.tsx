import { IconPinCategory } from "@/components/icon/pin-category";
import { UIText } from "@/components/ui/text";
import { colors, getCardBasicStyle, getColor } from "@/constants/theme";
import { formatTime } from "@/lib/utils";
import { type Pin } from "@/types/pin";

import { ChevronRight as ChevronRightIcon } from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type CardPinRegularProps = {
  pin: Pin;
  onPress: () => void;
};

export const CardPinRegular = ({ pin, onPress }: CardPinRegularProps) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
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
    ...getCardBasicStyle("sm"),
    flexDirection: "row",
    alignItems: "center",
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
