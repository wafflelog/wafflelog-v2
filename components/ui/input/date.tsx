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

type UIInputDateProps = {
  placeholder?: string;
  value?: string; // ISO 8601 date string
  onChange?: (date: string) => void; // Returns ISO 8601 date string
  autoFocus?: boolean;
};

export const UIInputDate = ({
  placeholder,
  value,
  onChange,
  autoFocus = false,
}: UIInputDateProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const [date, setDate] = useState<Date>(() => {
    if (value) {
      return new Date(value);
    }
    return new Date();
  });

  // Sync date when value prop changes
  useEffect(() => {
    if (value) {
      setDate(new Date(value));
    }
  }, [value]);

  const displayValue = value ? dayjs(value).format("DD/MM/YYYY") : "";

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (selectedDate) {
      setDate(selectedDate);
      onChange?.(selectedDate.toISOString());
    }

    if (Platform.OS === "ios") {
      // On iOS, keep picker open until user confirms
    }
  };

  const handleTodayPress = () => {
    const today = new Date();
    setDate(today);
    onChange?.(today.toISOString());
    if (showPicker) {
      setShowPicker(false);
    }
  };

  const handleInputPress = () => {
    setShowPicker(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={handleInputPress}
          activeOpacity={0.7}
        >
          <View style={styles.input}>
            {displayValue ? (
              <TitleRegular size="md" color={colors.textDarkGrey}>
                {displayValue}
              </TitleRegular>
            ) : (
              <TitleRegular size="md" color={colors.textLightGrey}>
                {placeholder || "DD/MM/YYYY"}
              </TitleRegular>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.todayButton} onPress={handleTodayPress}>
          <TitleRegular size="xs" weight="500" color={colors.turquoise}>
            Today
          </TitleRegular>
        </TouchableOpacity>
      </View>
      {showPicker && (
        <Dialog
          visible={showPicker}
          onDismiss={() => setShowPicker(false)}
          title="Select Date"
          confirmText="Select"
          cancelText="Cancel"
        >
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
            minimumDate={new Date(1900, 0, 1)}
            maximumDate={new Date(2100, 11, 31)}
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
  todayButton: {
    paddingVertical: gaps.xs,
    paddingHorizontal: gaps.sm,
  },
});
