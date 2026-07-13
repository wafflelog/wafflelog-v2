import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import { getCreatorDisplayName } from "@/lib/creator";
import { type ReferenceLink } from "@/types/pin";
import { useRouter } from "expo-router";
import {
  ExternalLink as ExternalLinkIcon,
  Globe as GlobeIcon,
  Trash2 as Trash2Icon,
} from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type CardPinReferenceLinkRegularProps = {
  referenceLink: ReferenceLink;
  onPress?: () => void;
  onDeletePress?: () => void;
};

export function CardPinReferenceLinkRegular({
  referenceLink,
  onPress,
  onDeletePress,
}: CardPinReferenceLinkRegularProps) {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <GlobeIcon size={20} color={getColor(colors.pineGreen)} />
      </View>

      <TouchableOpacity
        style={styles.content}
        onPress={() => {
          router.push({
            pathname: "/web-viewer",
            params: { url: referenceLink.url, title: referenceLink.title },
          });
          onPress?.();
        }}
      >
        <>
          <TitleRegular size="sm" weight="600">
            {referenceLink.title}
          </TitleRegular>
          <TitleRegular size="xs">{referenceLink.caption}</TitleRegular>
          <TitleRegular size="xs" color={colors.purple}>
            {referenceLink.url}
          </TitleRegular>
          <TitleRegular size="xs" color={colors.textLightGrey}>
            {getCreatorDisplayName(referenceLink.creator)}
          </TitleRegular>
        </>
      </TouchableOpacity>

      <View style={styles.actions}>
        {onDeletePress && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onDeletePress}
            hitSlop={8}
          >
            <Trash2Icon size={16} color={getColor(colors.red)} />
          </TouchableOpacity>
        )}
        <View style={styles.iconButton}>
          <ExternalLinkIcon size={16} color={getColor(colors.pineGreen)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    backgroundColor: getColor(colors.pineGreen, 0.2),
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flexDirection: "column",
    flex: 1,
    gap: gaps.xxs,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xs,
  },
  iconButton: {
    padding: gaps.xxs,
  },
});
