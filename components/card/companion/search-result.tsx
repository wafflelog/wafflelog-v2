import { CardUserIcon } from "@/components/card/user/icon";
import { TitleRegular } from "@/components/title/regular";
import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import { type User } from "@/types/user";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type CardCompanionSearchResultState = "invite" | "invited" | "in_trip";

type CardCompanionSearchResultProps = {
  user: User;
  state: CardCompanionSearchResultState;
  onPress?: (user: User) => void;
};

const stateText = {
  invite: "Invite",
  invited: "Invited",
  in_trip: "In trip",
};

export function CardCompanionSearchResult({
  user,
  state,
  onPress,
}: CardCompanionSearchResultProps) {
  const isPressable = state === "invite" && onPress;

  return (
    <View style={styles.container}>
      <CardUserIcon user={user} radius="full" />
      <View style={styles.content}>
        <TitleRegular size="sm" weight="500">
          {user.fullname}
        </TitleRegular>
      </View>
      <TouchableOpacity
        style={[
          styles.cta,
          state === "invite" ? styles.ctaInvite : styles.ctaDisabled,
        ]}
        disabled={!isPressable}
        onPress={() => {
          onPress?.(user);
        }}
      >
        <TitleRegular
          size="xs"
          weight="600"
          color={state === "invite" ? colors.white : colors.textLightGrey}
        >
          {stateText[state]}
        </TitleRegular>
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
    flex: 1,
  },
  cta: {
    minWidth: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadiuses.full,
    paddingHorizontal: gaps.md,
    paddingVertical: gaps.xs,
  },
  ctaInvite: {
    backgroundColor: getColor(colors.waffle),
  },
  ctaDisabled: {
    backgroundColor: getColor(colors.whiteGrey),
  },
});
