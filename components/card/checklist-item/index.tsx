import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getCardBasicStyle, getColor } from "@/constants/theme";
import { type ChecklistItem } from "@/types/trip";
import { Check as CheckIcon, Trash2 as Trash2Icon } from "lucide-react-native";

import { StyleSheet, TouchableOpacity, View } from "react-native";

type CardTripChecklistItemProps = {
  checklistItem: ChecklistItem;
  onPress: () => void;
  color?: keyof typeof colors;
};

export const CardTripChecklistItem = ({
  checklistItem,
  onPress,
  color = "waffle",
}: CardTripChecklistItemProps) => {
  return (
    <TouchableOpacity style={[styles.container]} onPress={onPress}>
      <View
        style={[
          styles.checkbox,
          checklistItem.completed && styles.checkboxCompleted,
        ]}
      >
        {checklistItem.completed && (
          <CheckIcon size={20} color={getColor(colors.white)} />
        )}
      </View>
      <View style={styles.content}>
        <TitleRegular
          size="md"
          weight="500"
          color={
            checklistItem.completed ? colors.paleGrey : colors.textLightGrey
          }
          style={checklistItem.completed && styles.titleCompleted}
        >
          {checklistItem.title}
        </TitleRegular>
      </View>
      <View style={styles.trash}>
        <Trash2Icon size={24} color={getColor(colors.textLightGrey)} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    ...getCardBasicStyle("sm"),
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.md,
  },
  content: {
    flexDirection: "column",
    flex: 1,
    gap: gaps.sm,
    paddingRight: 10,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: getColor(colors.whiteGrey),
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCompleted: {
    backgroundColor: getColor(colors.waffle),
    borderColor: getColor(colors.waffle),
  },
  titleCompleted: {
    textDecorationLine: "line-through",
  },
  trash: {},
});
