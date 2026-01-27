import { StyleSheet, TouchableOpacity, View } from "react-native";
import { match } from "ts-pattern";

import { CardUserIcon } from "@/components/card/user/icon";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import { type Companion } from "@/types/trip";

import { X as XIcon } from "lucide-react-native";
import { CardCompanionStateRegular } from "./state/regular";

type CardCompanionRegularProps = {
  companion: Companion;
};

export function CardCompanionRegular({ companion }: CardCompanionRegularProps) {
  const renderStateBadge = () => {
    return match(companion.state)
      .with("INVITED", () => <CardCompanionStateRegular state="INVITED" />)
      .otherwise(() => null);
  };

  return (
    <View style={styles.container}>
      <CardUserIcon user={companion} radius="full" />
      <View style={styles.content}>
        <TitleRegular size="sm" weight="500">
          {companion.fullname}
        </TitleRegular>
        {renderStateBadge()}
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => {
          console.log("remove companion");
        }}
      >
        <XIcon size={16} color={getColor(colors.red)} />
      </TouchableOpacity>
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
