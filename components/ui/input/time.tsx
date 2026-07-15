import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  fontSizes,
  gaps,
  getColor,
} from "@/constants/theme";
import { getFontFamily } from "@/lib/helper/utils";
import { StyleSheet, TextInput, View } from "react-native";

type UIInputTimeProps = {
  placeholder?: string;
  value?: string;
  onChange?: (time: string) => void;
  autoFocus?: boolean;
};

const DIGIT_LIMIT = 4;

function formatTimeDigits(digits: string) {
  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function getDigitsFromTime(input?: string) {
  return (input ?? "").replace(/\D/g, "").slice(0, DIGIT_LIMIT);
}

function isValidPartialTimeDigits(digits: string) {
  if (!digits) {
    return true;
  }

  if (digits.length >= 2) {
    const hours = Number(digits.slice(0, 2));

    if (Number.isNaN(hours) || hours > 23) {
      return false;
    }
  }

  if (digits.length === 4) {
    const minutes = Number(digits.slice(2, 4));

    if (Number.isNaN(minutes) || minutes > 59) {
      return false;
    }
  }

  return true;
}

export const UIInputTime = ({
  placeholder = "e.g. 14:30",
  value,
  onChange,
  autoFocus = false,
}: UIInputTimeProps) => {
  const digits = getDigitsFromTime(value);
  const displayValue = formatTimeDigits(digits);
  const isEmpty = !displayValue;
  const isInvalid = !isValidPartialTimeDigits(digits);

  const handleChangeText = (text: string) => {
    const nextDigits = getDigitsFromTime(text);
    onChange?.(formatTimeDigits(nextDigits));
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          isInvalid && styles.inputInvalid,
          { fontFamily: getFontFamily("400") },
        ]}
        value={displayValue}
        onChangeText={handleChangeText}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={5}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder=""
      />
      {isEmpty && (
        <View style={styles.placeholderContainer} pointerEvents="none">
          <TitleRegular size="md" weight="400" color={colors.textLightGrey}>
            {placeholder}
          </TitleRegular>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  input: {
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey),
    borderRadius: borderRadiuses.sm,
    padding: gaps.sm,
    fontSize: fontSizes.md,
    color: getColor(colors.textDarkGrey),
    zIndex: 1,
  },
  inputInvalid: {
    borderColor: getColor(colors.red),
    backgroundColor: getColor(colors.red, 0.08),
    color: getColor(colors.red),
  },
  placeholderContainer: {
    position: "absolute",
    left: gaps.sm,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
});
