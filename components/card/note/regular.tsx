import { CardUserIcon } from "@/components/card/user/icon";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import { formatCreatedAt } from "@/lib/utils";
import { type Note } from "@/types/pin";
import { Trash2 as Trash2Icon } from "lucide-react-native";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

type CardNoteRegularProps = {
  note: Note;
  containerStyle?: StyleProp<ViewStyle>;
  onDeletePress?: () => void;
  variant?: "user" | "self";
};

export function CardNoteRegular({
  note,
  containerStyle,
  onDeletePress,
  variant = "user",
}: CardNoteRegularProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.userContainer}>
        <CardUserIcon user={note.createdBy} size="sm" radius="full" />
      </View>

      <View style={styles.content}>
        <View style={styles.metadata}>
          <TitleRegular
            size="xs"
            color={variant === "self" ? colors.orange : colors.pineGreen}
            weight="600"
          >
            {variant === "user" ? note.createdBy.fullname : "You"}
          </TitleRegular>
          <TitleRegular size="xxs">
            {formatCreatedAt(note.createdAt)}
          </TitleRegular>
          {onDeletePress && (
            <TouchableOpacity onPress={onDeletePress} hitSlop={8}>
              <Trash2Icon size={16} color={getColor(colors.red)} />
            </TouchableOpacity>
          )}
        </View>
        <TitleRegular size="sm">{note.text}</TitleRegular>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: gaps.xs,
  },
  userContainer: {
    flexShrink: 0,
  },
  content: {
    flexDirection: "column",
    gap: gaps.xxs,
    flex: 1,
  },
  metadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xxs,
  },
});
