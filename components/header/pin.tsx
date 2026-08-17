import { UIText } from "@/components/ui/text";
import { colors, getColor, semanticColors } from "@/constants/theme";
import { getPinHeaderTimeLabel, getPinTitle } from "@/lib/helper/pin";
import { type Pin } from "@/types/pin";
import {
  HeaderBackButton,
  type HeaderBackButtonProps,
  type HeaderTitleProps,
} from "@react-navigation/elements";
import {
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
} from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type HeaderDefaultProps = {
  pin: Pin;
  onBackPress: () => void;
  onMorePress: () => void;
};

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
} & HeaderBackButtonProps;

export const HeaderPin = ({
  pin,
  onBackPress,
  onMorePress,
}: HeaderDefaultProps) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
        <ChevronLeftIcon size={24} color={getColor(colors.textDarkGrey)} />
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <UIText style={styles.headerTitle} weight="700">
          {getPinTitle(pin)}
        </UIText>
        <UIText style={styles.headerSubtitle}>
          {getPinHeaderTimeLabel(pin)}
        </UIText>
      </View>
      <TouchableOpacity style={styles.moreButton} onPress={onMorePress}>
        <MenuIcon size={24} color={getColor(colors.textDarkGrey)} />
      </TouchableOpacity>
    </View>
  );
};

export const HeaderPinTitle = ({
  allowFontScaling,
  onLayout,
  pin,
  tintColor,
}: HeaderPinTitleProps) => {
  if (!pin) {
    return null;
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
  ...props
}: HeaderPinButtonProps) => {
  return <HeaderBackButton {...props} onPress={onPress} />;
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: semanticColors.screen,
    borderBottomWidth: 1,
    borderBottomColor: semanticColors.brandDivider,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
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
  moreButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
