import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  fontSizes,
  gaps,
  getColor,
} from "@/constants/theme";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { Dialog } from "../dialog";

type UIInputTimeProps = {
  placeholder?: string;
  value?: string; // HH:mm time string
  onChange?: (time: string) => void; // Returns HH:mm time string
  autoFocus?: boolean;
};

const toTimeString = (input: Date) => dayjs(input).format("HH:mm");

const toPickerTime = (input?: string) => {
  if (!input) {
    return new Date();
  }

  const match = input.match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    return new Date();
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return new Date();
  }

  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return now;
};

export const UIInputTime = ({
  placeholder,
  value,
  onChange,
  autoFocus = false,
}: UIInputTimeProps) => {
  const [showPicker, setShowPicker] = useState(autoFocus);
  const [time, setTime] = useState<Date>(() => toPickerTime(value));

  useEffect(() => {
    if (!showPicker) {
      setTime(toPickerTime(value));
    }
  }, [showPicker, value]);

  const displayValue = value || "";

  const handleTimeChange = (_event: unknown, selectedTime?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (selectedTime) {
      setTime(selectedTime);
      if (Platform.OS === "android") {
        onChange?.(toTimeString(selectedTime));
      }
    }
  };

  const handleConfirm = () => {
    onChange?.(toTimeString(time));
    setShowPicker(false);
  };

  const handleNowPress = () => {
    const now = new Date();
    setTime(now);
    onChange?.(toTimeString(now));
    if (showPicker) {
      setShowPicker(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.7}
        >
          <View style={styles.input}>
            {displayValue ? (
              <TitleRegular size="md" color={colors.textDarkGrey}>
                {displayValue}
              </TitleRegular>
            ) : (
              <TitleRegular size="md" color={colors.textLightGrey}>
                {placeholder || "HH:mm"}
              </TitleRegular>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nowButton} onPress={handleNowPress}>
          <TitleRegular size="xs" weight="500" color={colors.turquoise}>
            Now
          </TitleRegular>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <Dialog
          visible={showPicker}
          onDismiss={() => setShowPicker(false)}
          onConfirm={handleConfirm}
          title="Select Time"
          confirmText="Select"
          cancelText="Cancel"
        >
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleTimeChange}
            themeVariant="light"
          />
        </Dialog>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    gap: gaps.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey),
    borderRadius: borderRadiuses.sm,
    padding: gaps.sm,
    minHeight: fontSizes.md + gaps.sm * 2,
    justifyContent: "center",
  },
  nowButton: {
    paddingVertical: gaps.xs,
    paddingHorizontal: gaps.sm,
  },
});
