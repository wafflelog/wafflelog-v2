import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import { type Document } from "@/types/pin";
import {
  ExternalLink as ExternalLinkIcon,
  FileText as FileTextIcon,
} from "lucide-react-native";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

type CardDocumentRegularProps = {
  document: Document;
  onPress: () => void;
  containerStyle?: StyleProp<ViewStyle>;
};

export function CardDocumentRegular({
  document,
  onPress,
  containerStyle,
}: CardDocumentRegularProps) {
  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <FileTextIcon size={20} color={getColor(colors.pineGreen)} />
      </View>

      <View style={styles.content}>
        <TitleRegular size="sm" weight="600">
          {document.fileName}
        </TitleRegular>
        <TitleRegular size="xs">{document.caption}</TitleRegular>
        <TitleRegular size="xxs">
          {document.mimeType.toUpperCase()}
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
