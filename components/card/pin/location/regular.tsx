import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getCardBasicStyle, getColor } from "@/constants/theme";
import { type Pin } from "@/types/pin";
import { Map as MapIcon } from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type CardPinLocationRegularProps = {
  pin: Pin;
  onPress: () => void;
};

export function CardPinLocationRegular({
  pin,
  onPress,
}: CardPinLocationRegularProps) {
  return (
    <View style={styles.container}>
      <TitleRegular size="sm">{pin.location.address}</TitleRegular>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <MapIcon size={16} color={getColor(colors.pineGreen)} />
        <TitleRegular size="xs" weight="600">
          Open in Maps
        </TitleRegular>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...getCardBasicStyle("md"),
    gap: gaps.sm,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
