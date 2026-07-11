import { TitleRegular } from "@/components/title/regular";
import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import { Companion } from "@/types/trip";
import {
  Check as CheckIcon,
  LogOut as LogOutIcon,
  Mail as MailIcon,
  MinusCircle as MinusCircleIcon,
  X as XIcon,
} from "lucide-react-native";
import { StyleSheet, View } from "react-native";

type CardCompanionStateRegularProps = {
  state: Companion["state"];
};

const stateColors = {
  INVITED: colors.purple,
  ACCEPTED: colors.turquoise,
  REJECTED: colors.red,
  WITHDRAWN: colors.paleGrey,
  REMOVED: colors.orange,
  LEFT: colors.textLightGrey,
};

const stateTexts = {
  INVITED: "Invitation sent",
  ACCEPTED: "Accepted",
  REJECTED: "Declined",
  WITHDRAWN: "Withdrawn",
  REMOVED: "Removed",
  LEFT: "Left trip",
};

const stateIcons = {
  INVITED: <MailIcon size={14} color={getColor(colors.white)} />,
  ACCEPTED: <CheckIcon size={14} color={getColor(colors.white)} />,
  REJECTED: <XIcon size={14} color={getColor(colors.white)} />,
  WITHDRAWN: <MinusCircleIcon size={14} color={getColor(colors.white)} />,
  REMOVED: <XIcon size={14} color={getColor(colors.white)} />,
  LEFT: <LogOutIcon size={14} color={getColor(colors.white)} />,
};

export function CardCompanionStateRegular({
  state,
}: CardCompanionStateRegularProps) {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: getColor(stateColors[state]) },
      ]}
    >
      {stateIcons[state]}
      <TitleRegular size="xs" weight="400" color={colors.white}>
        {stateTexts[state]}
      </TitleRegular>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: borderRadiuses.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xxs,
  },
});
