import { HeaderIconButton } from "@/components/header/icon-button";
import { UIText } from "@/components/ui/text";
import { semanticColors } from "@/constants/theme";
import { getPinHeaderTimeLabel, getPinTitle } from "@/lib/helper/pin";
import { type Pin } from "@/types/pin";
import { type HeaderTitleProps } from "@react-navigation/elements";
import {
  ChevronLeft as ChevronLeftIcon,
  List as ListIcon,
} from "lucide-react-native";
import { StyleSheet, View } from "react-native";

type HeaderPinTitleProps = {
  pin?:
    | (Pick<Pin, "name" | "startDate" | "endDate" | "time" | "endTime"> & {
        categoryId?: string;
        metadataJson?: {
          departure?: string;
          destination?: string;
        };
      })
    | null;
} & Partial<HeaderTitleProps>;

type HeaderPinButtonProps = {
  onPress: () => void;
};

export const HeaderPinTitle = ({
  allowFontScaling,
  onLayout,
  pin,
  tintColor,
}: HeaderPinTitleProps) => {
  if (!pin) {
    return (
      <View style={styles.nativeTitle}>
        <UIText
          style={[styles.headerTitle, tintColor ? { color: tintColor } : null]}
          numberOfLines={1}
          allowFontScaling={allowFontScaling}
          onLayout={onLayout}
          weight="700"
        >
          Pin
        </UIText>
      </View>
    );
  }

  return (
    <View style={styles.nativeTitle}>
      <UIText
        style={[styles.headerTitle, tintColor ? { color: tintColor } : null]}
        numberOfLines={1}
        allowFontScaling={allowFontScaling}
        onLayout={onLayout}
        weight="700"
      >
        {getPinTitle(pin)}
      </UIText>
      <UIText
        style={styles.headerSubtitle}
        numberOfLines={1}
        allowFontScaling={allowFontScaling}
      >
        {getPinHeaderTimeLabel(pin)}
      </UIText>
    </View>
  );
};

export const HeaderPinBackButton = ({
  onPress,
}: HeaderPinButtonProps) => (
  <HeaderIconButton
    accessibilityLabel="Go back"
    icon={ChevronLeftIcon}
    onPress={onPress}
  />
);

export const HeaderPinMenuButton = ({ onPress }: HeaderPinButtonProps) => (
  <HeaderIconButton
    accessibilityLabel="View pins for this day"
    icon={ListIcon}
    onPress={onPress}
  />
);

const styles = StyleSheet.create({
  nativeTitle: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: semanticColors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: semanticColors.textSecondary,
    marginTop: 2,
  },
});
