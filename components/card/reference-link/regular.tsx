import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import { type ReferenceLink } from "@/types/pin";
import { useRouter } from "expo-router";
import {
  ExternalLink as ExternalLinkIcon,
  Globe as GlobeIcon,
} from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type CardPinReferenceLinkRegularProps = {
  referenceLink: ReferenceLink;
  onPress?: () => void;
};

export function CardPinReferenceLinkRegular({
  referenceLink,
  onPress,
}: CardPinReferenceLinkRegularProps) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => {
        router.push({
          pathname: "/web-viewer",
          params: { url: referenceLink.url, title: referenceLink.title },
        });
        onPress?.();
      }}
    >
      <View style={styles.iconContainer}>
        <GlobeIcon size={20} color={getColor(colors.pineGreen)} />
      </View>

      <View style={styles.content}>
        <TitleRegular size="md" weight="600">
          {referenceLink.title}
        </TitleRegular>
        <TitleRegular size="xs">{referenceLink.caption}</TitleRegular>
        <TitleRegular size="xs" color={colors.purple}>
          {referenceLink.url}
        </TitleRegular>
      </View>

      <View style={styles.button}>
        <ExternalLinkIcon size={16} color={getColor(colors.pineGreen)} />
      </View>
    </TouchableOpacity>
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
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
