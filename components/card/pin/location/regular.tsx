import { UIText } from "@/components/ui/text";
import { colors, getCardBasicStyle, getColor } from "@/constants/theme";
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
      <UIText>{pin.location.address}</UIText>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <MapIcon size={16} color={getColor(colors.pineGreen)} />
        <UIText>Open in Maps</UIText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...getCardBasicStyle("md"),
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
