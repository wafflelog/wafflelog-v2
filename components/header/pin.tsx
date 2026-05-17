import type {
  HeaderBackButtonProps,
  HeaderTitleProps,
} from "@react-navigation/elements";
import { colors, getColor } from "@/constants/theme";
import { formatTime } from "@/lib/utils";
import { type Pin } from "@/types/pin";
import {
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
} from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type HeaderDefaultProps = {
  pin: Pin;
  onBackPress: () => void;
  onMorePress: () => void;
};

type HeaderPinTitleProps = {
  pin?: Pick<Pin, "name" | "time"> | null;
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
        <Text style={styles.headerTitle}>{pin.name}</Text>
        <Text style={styles.headerSubtitle}>{formatTime(pin.time)}</Text>
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
      <Text
        style={[
          styles.headerTitle,
          tintColor ? { color: tintColor } : null,
        ]}
        numberOfLines={1}
        allowFontScaling={allowFontScaling}
        onLayout={onLayout}
      >
        {pin.name}
      </Text>
      <Text
        style={styles.headerSubtitle}
        numberOfLines={1}
        allowFontScaling={allowFontScaling}
      >
        {formatTime(pin.time)}
      </Text>
    </View>
  );
};

export const HeaderPinBackButton = ({
  accessibilityLabel,
  disabled,
  onPress,
  pressOpacity,
  style,
  testID,
  tintColor,
}: HeaderPinButtonProps) => {
  return (
    <TouchableOpacity
      style={[styles.nativeButton, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={pressOpacity}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      testID={testID}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <ChevronLeftIcon
        size={24}
        color={tintColor ?? getColor(colors.textDarkGrey)}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    padding: 4,
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
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  nativeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
