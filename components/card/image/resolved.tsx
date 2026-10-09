import { ImageDeleteButton } from "@/components/card/image/delete-button";
import { CardImageRegular } from "@/components/card/image/regular";
import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
  semanticColors,
} from "@/constants/theme";
import { useLocalImageFile } from "@/hook/use-local-image-file";
import { getCreatorDisplayName } from "@/lib/helper/creator";
import { type LocalImage } from "@/lib/sqlite/model/image";
import { ImageOff as ImageOffIcon } from "lucide-react-native";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type CardImageResolvedProps = {
  image: LocalImage;
  showCaption?: boolean;
  onPress: (localUri: string) => void;
  onDeletePress?: () => void;
};

export function CardImageResolved({
  image,
  showCaption = false,
  onPress,
  onDeletePress,
}: CardImageResolvedProps) {
  const imageFileQuery = useLocalImageFile(image);
  const localUri =
    imageFileQuery.data ?? (imageFileQuery.isPending ? image.localUri : null);

  if (localUri) {
    return (
      <CardImageRegular
        image={{
          id: image.id,
          url: localUri,
          width: image.width,
          height: image.height,
          caption: image.caption ?? undefined,
          creator: image.creator,
        }}
        showCaption={showCaption}
        onPress={() => onPress(localUri)}
        onDeletePress={onDeletePress}
      />
    );
  }

  const isLoading = imageFileQuery.isPending || imageFileQuery.isFetching;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => {
        if (!isLoading) {
          void imageFileQuery.refetch();
        }
      }}
      disabled={isLoading}
    >
      <View style={styles.state}>
        {isLoading ? (
          <ActivityIndicator size="small" color={getColor(colors.purple)} />
        ) : (
          <ImageOffIcon size={24} color={getColor(colors.textLightGrey)} />
        )}
        <TitleRegular
          size="xs"
          weight="600"
          color={colors.textLightGrey}
        >
          {isLoading ? "Loading image" : "Image unavailable"}
        </TitleRegular>
        {!isLoading && (
          <TitleRegular size="xxs" color={colors.textLightGrey}>
            Tap to retry
          </TitleRegular>
        )}
      </View>

      <TitleRegular size="xs" style={styles.creator}>
        {getCreatorDisplayName(image.creator)}
      </TitleRegular>
      {onDeletePress && <ImageDeleteButton onPress={onDeletePress} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    borderRadius: borderRadiuses.sm,
    backgroundColor: getColor(colors.whiteGrey, 0.35),
    borderWidth: 1,
    borderColor: semanticColors.neutralDivider,
  },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xxs,
    padding: gaps.sm,
  },
  creator: {
    position: "absolute",
    top: gaps.xs,
    left: gaps.xs,
    backgroundColor: getColor(colors.black, 0.5),
    color: getColor(colors.white),
    paddingHorizontal: gaps.xs,
    paddingVertical: 2,
  },
});
