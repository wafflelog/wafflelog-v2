import { type Image as ImageType } from "@/types/pin";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

type CardPinImageRegularProps = {
  image: ImageType;
  onPress: () => void;
};

export function CardPinImageRegular({
  image,
  onPress,
}: CardPinImageRegularProps) {
  console.log(image.url);
  return (
    <View style={styles.container}>
      <Image
        // style={styles.image}
        style={{ height: "100%", width: "100%" }}
        source={image.url}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});
