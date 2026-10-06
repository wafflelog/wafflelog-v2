import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  fontSizes,
  gaps,
  getColor,
} from "@/constants/theme";
import { getFontFamily } from "@/lib/helper/utils";
import {
  StyleSheet,
  TextInput,
  View,
  type InputModeOptions,
  type KeyboardTypeOptions,
} from "react-native";
import { AiPlannerSendButton } from "./send-button";

type AiPlannerTextComposerProps = {
  value: string;
  placeholder: string;
  accessibilityLabel: string;
  nativeID: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error?: boolean;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
  inputMode?: InputModeOptions;
  suffix?: string;
};

export function AiPlannerTextComposer({
  value,
  placeholder,
  accessibilityLabel,
  nativeID,
  onChange,
  onSubmit,
  error = false,
  multiline = false,
  maxLength,
  keyboardType = "default",
  inputMode = "text",
  suffix,
}: AiPlannerTextComposerProps) {
  const isSubmitDisabled = !value.trim();

  return (
    <View style={[styles.composer, error && styles.composerError]}>
      <TextInput
        key={`${nativeID}-${multiline ? "multiline" : "single-line"}`}
        nativeID={nativeID}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={multiline ? undefined : onSubmit}
        placeholder={placeholder}
        placeholderTextColor={getColor(colors.paleGrey)}
        keyboardType={keyboardType}
        inputMode={inputMode}
        multiline={multiline}
        maxLength={maxLength}
        autoFocus
        style={[
          styles.input,
          multiline && styles.multilineInput,
          { fontFamily: getFontFamily("400") },
        ]}
        textAlignVertical="top"
        accessibilityLabel={accessibilityLabel}
      />
      {suffix ? (
        <TitleRegular size="xs" color={colors.textLightGrey}>
          {suffix}
        </TitleRegular>
      ) : null}
      <AiPlannerSendButton
        onPress={onSubmit}
        disabled={isSubmitDisabled}
        accessibilityLabel="Send message"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  composer: {
    minHeight: 50,
    maxHeight: 140,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: gaps.xs,
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey),
    borderRadius: borderRadiuses.lg,
    paddingLeft: gaps.sm,
    paddingRight: 6,
    paddingVertical: 6,
    backgroundColor: getColor(colors.white),
  },
  composerError: { borderColor: getColor(colors.red, 0.7) },
  input: {
    flex: 1,
    minHeight: 38,
    paddingTop: 8,
    paddingBottom: 7,
    fontSize: fontSizes.sm,
    color: getColor(colors.textDarkGrey),
  },
  multilineInput: { maxHeight: 120 },
});
