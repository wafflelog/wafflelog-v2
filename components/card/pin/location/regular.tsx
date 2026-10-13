import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getCardBasicStyle, getColor } from "@/constants/theme";
import { type Pin } from "@/types/pin";
import {
  Navigation as NavigationIcon,
  Pencil as PencilIcon,
} from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type CardPinLocationRegularProps = {
  pin: Pin;
  onChangePlace?: () => void;
  onOpenMap?: () => void;
};

export function CardPinLocationRegular({
  pin,
  onChangePlace,
  onOpenMap,
}: CardPinLocationRegularProps) {
  return (
    <View style={styles.container}>
      <TitleRegular size="sm" weight="600">
        {pin.location.name || "Choose a place"}
      </TitleRegular>
      <TitleRegular size="xs">
        {pin.location.address || "Save a location for this pin"}
      </TitleRegular>
      {onOpenMap || onChangePlace ? (
        <View style={styles.actions}>
          {onOpenMap ? (
            <TouchableOpacity
              style={styles.button}
              onPress={onOpenMap}
              accessibilityRole="button"
              accessibilityLabel="Open location in Maps"
            >
              <NavigationIcon size={16} color={getColor(colors.purple)} />
              <TitleRegular size="xs" weight="600" color={colors.purple}>
                Open in Maps
              </TitleRegular>
            </TouchableOpacity>
          ) : null}
          {onChangePlace ? (
            <TouchableOpacity
              style={styles.button}
              onPress={onChangePlace}
              accessibilityRole="button"
              accessibilityLabel="Change place"
            >
              <PencilIcon size={16} color={getColor(colors.textDarkGrey)} />
              <TitleRegular
                size="xs"
                weight="600"
                color={colors.textDarkGrey}
              >
                Change Place
              </TitleRegular>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...getCardBasicStyle("md"),
    gap: gaps.sm,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: gaps.md,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    gap: 4,
  },
});
