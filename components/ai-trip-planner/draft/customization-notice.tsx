import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import { CheckCircle2 } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { DraftSelectionToggle } from "./draft-selection-toggle";

type CustomizationNoticeProps = {
  isAllItinerarySelected: boolean;
  onToggleAllItinerary: () => void;
};

export function CustomizationNotice({
  isAllItinerarySelected,
  onToggleAllItinerary,
}: CustomizationNoticeProps) {
  return (
    <View style={styles.customizationNotice}>
      <View style={styles.noticeHeader}>
        <View style={styles.customizationIcon}>
          <CheckCircle2 size={20} color={getColor(colors.pineGreen)} />
        </View>
        <View style={styles.customizationCopy}>
          <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
            Choose what to add
          </TitleRegular>
          <TitleRegular size="xs" color={colors.textLightGrey}>
            Nothing is saved until you confirm the complete trip.
          </TitleRegular>
        </View>
      </View>

      <View style={styles.itinerarySelection}>
        <TitleRegular size="xs" weight="600" color={colors.textDarkGrey}>
          Itinerary items
        </TitleRegular>
        <DraftSelectionToggle
          isAllSelected={isAllItinerarySelected}
          color="pineGreen"
          onPress={onToggleAllItinerary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  customizationNotice: {
    gap: gaps.sm,
    padding: gaps.sm,
    borderRadius: borderRadiuses.md,
    borderWidth: 1,
    borderColor: getColor(colors.pineGreen, 0.2),
    backgroundColor: getColor(colors.pineGreen, 0.06),
  },
  noticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
  },
  customizationIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.pineGreen, 0.1),
  },
  customizationCopy: { flex: 1, gap: 3 },
  itinerarySelection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: getColor(colors.pineGreen, 0.14),
    paddingTop: gaps.sm,
  },
});
