import { StyleSheet, TouchableOpacity, View } from "react-native";

import { CardUserIcon } from "@/components/card/user/icon";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import { type Companion } from "@/types/trip";

import { RotateCcw as RotateCcwIcon, X as XIcon } from "lucide-react-native";
import { CardCompanionStateRegular } from "./state/regular";

type CardCompanionRegularProps = {
  companion: Companion;
  showStateBadge?: boolean;
  showRemoveButton?: boolean;
  showRestoreButton?: boolean;
  onRemove?: (companionId: string) => void;
  onRestore?: (companionId: string) => void;
};

export function CardCompanionRegular({
  companion,
  showStateBadge = true,
  showRemoveButton = false,
  showRestoreButton = false,
  onRemove,
  onRestore,
}: CardCompanionRegularProps) {
  return (
    <View style={styles.container}>
      <CardUserIcon user={companion} radius="full" />
      <View style={styles.content}>
        <TitleRegular size="sm" weight="500">
          {companion.fullname}
        </TitleRegular>
        {showStateBadge ? <CardCompanionStateRegular state={companion.state} /> : null}
      </View>
      {showRemoveButton && onRemove ? (
        <TouchableOpacity
          style={styles.removeButton}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${companion.fullname}`}
          onPress={() => {
            onRemove(companion.id);
          }}
        >
          <XIcon size={16} color={getColor(colors.red)} />
        </TouchableOpacity>
      ) : null}
      {showRestoreButton && onRestore ? (
        <TouchableOpacity
          style={styles.restoreButton}
          accessibilityRole="button"
          accessibilityLabel={`Restore access for ${companion.fullname}`}
          onPress={() => {
            onRestore(companion.id);
          }}
        >
          <RotateCcwIcon size={15} color={getColor(colors.purple)} />
          <TitleRegular size="xs" weight="600" color={colors.purple}>
            Restore
          </TitleRegular>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
  },
  content: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: gaps.xxs,
    flex: 1,
  },
  removeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: getColor(colors.red, 0.2),
    alignItems: "center",
    justifyContent: "center",
  },
  restoreButton: {
    minHeight: 40,
    paddingHorizontal: gaps.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: getColor(colors.purple, 0.25),
    backgroundColor: getColor(colors.purple, 0.08),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xxs,
  },
});
