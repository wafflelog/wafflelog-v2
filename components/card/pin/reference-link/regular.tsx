import { UIText } from "@/components/ui/text";
import { colors, getColor } from "@/constants/theme";
import { type ReferenceLink } from "@/types/pin";
import {
  ExternalLink as ExternalLinkIcon,
  Globe as GlobeIcon,
} from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type CardPinReferenceLinkRegularProps = {
  referenceLink: ReferenceLink;
  onPress: () => void;
};

export function CardPinReferenceLinkRegular({
  referenceLink,
  onPress,
}: CardPinReferenceLinkRegularProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <GlobeIcon size={20} color={getColor(colors.pineGreen)} />
      </View>

      <View style={styles.content}>
        <UIText style={styles.title} weight="600">
          {referenceLink.title}
        </UIText>
        <UIText style={styles.caption}>{referenceLink.caption}</UIText>
        <UIText style={styles.url}>{referenceLink.url}</UIText>
      </View>

      <TouchableOpacity style={styles.button} onPress={onPress}>
        <ExternalLinkIcon size={16} color={getColor(colors.pineGreen)} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  },
  title: {
    fontSize: 14,
  },
  caption: {
    fontSize: 12,
  },
  url: {
    fontSize: 12,
    color: getColor(colors.purple),
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
