import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import { type Image } from "@/types/pin";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";

type CardImageRegularProps = {
  image: Image;
  showCaption?: boolean;
  onPress: () => void;
};

export function CardImageRegular({
  image,
  showCaption = false,
  onPress,
}: CardImageRegularProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() =>
        router.push(`/image-viewer?url=${encodeURIComponent(image.url)}`)
      }
    >
      <ExpoImage style={styles.image} source={image.url} contentFit="cover" />
      {showCaption && (
        <TitleRegular size="xs" style={styles.caption}>
          {image.caption}
        </TitleRegular>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  caption: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: getColor(colors.black, 0.5),
    color: getColor(colors.white),
    padding: gaps.xs,
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});
