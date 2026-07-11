import { StyleSheet, TouchableOpacity, View } from "react-native";

import { CardUserIcon } from "@/components/card/user/icon";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import { type Companion } from "@/types/trip";

import { X as XIcon } from "lucide-react-native";
import { CardCompanionStateRegular } from "./state/regular";

type CardCompanionRegularProps = {
  companion: Companion;
  showStateBadge?: boolean;
  showRemoveButton?: boolean;
  onRemove?: (companionId: string) => void;
};

export function CardCompanionRegular({
  companion,
  showStateBadge = true,
  showRemoveButton = false,
  onRemove,
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
          onPress={() => {
            onRemove(companion.id);
          }}
        >
          <XIcon size={16} color={getColor(colors.red)} />
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: getColor(colors.red, 0.2),
    alignItems: "center",
    justifyContent: "center",
  },
});
