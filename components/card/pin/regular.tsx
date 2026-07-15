import { IconPinCategory } from "@/components/icon/pin-category";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getCardBasicStyle, getColor } from "@/constants/theme";
import { getCreatorDisplayName } from "@/lib/helper/creator";
import { getPinSubtitle, getPinTimeLabelForDate, getPinTitle } from "@/lib/helper/pin";
import { type Pin } from "@/types/pin";

import { ChevronRight as ChevronRightIcon } from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type CardPinRegularProps = {
  pin: Pin;
  selectedDate: string;
  onPress: () => void;
};

export const CardPinRegular = ({
  pin,
  selectedDate,
  onPress,
}: CardPinRegularProps) => {
  const subtitle = getPinSubtitle(pin);
  const timeLabel = getPinTimeLabelForDate(pin, selectedDate);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <IconPinCategory category={pin.category} />
      </View>

      <View style={styles.content}>
        <TitleRegular size="sm" weight="500">
          {getPinTitle(pin)}
        </TitleRegular>

        {timeLabel ? <TitleRegular size="xs">{timeLabel}</TitleRegular> : null}
        {subtitle ? <TitleRegular size="xs">{subtitle}</TitleRegular> : null}
        <TitleRegular size="xs" color={colors.textLightGrey}>
          {getCreatorDisplayName(pin.creator)}
        </TitleRegular>
      </View>

      <View style={styles.chevronContainer}>
        <ChevronRightIcon size={24} color={getColor(colors.waffle)} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    ...getCardBasicStyle("sm"),
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    backgroundColor: getColor(colors.waffle, 0.2),
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flexDirection: "column",
    flex: 1,
    gap: 6,
    paddingRight: 10,
  },
  chevronContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});
