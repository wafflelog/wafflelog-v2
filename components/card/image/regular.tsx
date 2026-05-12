import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import { type Image } from "@/types/pin";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { Trash2 as Trash2Icon } from "lucide-react-native";
import { StyleSheet, TouchableOpacity } from "react-native";

type CardImageRegularProps = {
  image: Image;
  showCaption?: boolean;
  onPress: () => void;
  onDeletePress?: () => void;
};

export function CardImageRegular({
  image,
  showCaption = false,
  onPress,
  onDeletePress,
}: CardImageRegularProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <ExpoImage style={styles.image} source={image.url} contentFit="cover" />
      {onDeletePress && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDeletePress}
          hitSlop={8}
        >
          <Trash2Icon size={16} color={getColor(colors.white)} />
        </TouchableOpacity>
      )}
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
  deleteButton: {
    position: "absolute",
    top: gaps.xs,
    right: gaps.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: getColor(colors.black, 0.6),
    justifyContent: "center",
    alignItems: "center",
  },
});
