import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import { type Document } from "@/types/pin";
import {
  ExternalLink as ExternalLinkIcon,
  FileText as FileTextIcon,
  Trash2 as Trash2Icon,
} from "lucide-react-native";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

type CardDocumentSquareProps = {
  document: Document;
  onPress: () => void;
  onDeletePress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
};

export function CardDocumentSquare({
  document,
  onPress,
  onDeletePress,
  containerStyle,
}: CardDocumentSquareProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.iconContainer}>
        <FileTextIcon size={32} color={getColor(colors.pineGreen)} />
      </View>

      <View style={styles.content}>
        <TitleRegular size="md" weight="600">
          {document.fileName}
        </TitleRegular>
        <TitleRegular size="xs" style={styles.caption}>
          {document.caption}
        </TitleRegular>
        <TitleRegular size="xxs">
          {document.mimeType.toUpperCase()}
        </TitleRegular>
      </View>

      <View style={styles.actions}>
        {onDeletePress && (
          <TouchableOpacity
            style={styles.button}
            onPress={(event) => {
              event.stopPropagation();
              onDeletePress();
            }}
            hitSlop={8}
          >
            <Trash2Icon size={16} color={getColor(colors.red)} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.button} onPress={onPress}>
          <ExternalLinkIcon size={16} color={getColor(colors.pineGreen)} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    gap: gaps.sm,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    backgroundColor: getColor(colors.pineGreen, 0.2),
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flexDirection: "column",
    flex: 1,
    gap: gaps.xxs,
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  button: {
    padding: gaps.xxs,
  },
  caption: {
    textAlign: "center",
  },
});
