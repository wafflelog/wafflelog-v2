import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  fontSizes,
  gaps,
  getColor,
} from "@/constants/theme";
import { getFontFamily } from "@/lib/helper/utils";
import { Eye, EyeOff, type LucideIcon } from "lucide-react-native";
import { forwardRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

type AuthFieldProps = Pick<
  TextInputProps,
  | "autoCapitalize"
  | "autoComplete"
  | "autoCorrect"
  | "autoFocus"
  | "keyboardType"
  | "onSubmitEditing"
  | "returnKeyType"
  | "textContentType"
> & {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  icon: LucideIcon;
  secureTextEntry?: boolean;
  helperText?: string;
  disabled?: boolean;
};

export const AuthField = forwardRef<TextInput, AuthFieldProps>(
  function AuthField(
    {
      label,
      placeholder,
      value,
      onChangeText,
      icon: Icon,
      secureTextEntry = false,
      helperText,
      disabled = false,
      autoCapitalize = "none",
      autoCorrect = false,
      ...inputProps
    },
    ref,
  ) {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const shouldHideText = secureTextEntry && !isPasswordVisible;

    return (
      <View style={styles.field}>
        <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
          {label}
        </TitleRegular>
        <View
          style={[
            styles.inputContainer,
            isFocused && styles.inputContainerFocused,
            disabled && styles.inputContainerDisabled,
          ]}
        >
          <Icon
            size={20}
            color={getColor(
              isFocused ? colors.textDarkGrey : colors.textLightGrey,
            )}
          />
          <TextInput
            {...inputProps}
            ref={ref}
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={getColor(colors.paleGrey)}
            secureTextEntry={shouldHideText}
            editable={!disabled}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            selectionColor={getColor(colors.waffle)}
            accessibilityLabel={label}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {secureTextEntry ? (
            <Pressable
              style={styles.visibilityButton}
              onPress={() => setIsPasswordVisible((visible) => !visible)}
              accessibilityRole="button"
              accessibilityLabel={
                isPasswordVisible ? "Hide password" : "Show password"
              }
              hitSlop={8}
            >
              {isPasswordVisible ? (
                <EyeOff size={20} color={getColor(colors.textLightGrey)} />
              ) : (
                <Eye size={20} color={getColor(colors.textLightGrey)} />
              )}
            </Pressable>
          ) : null}
        </View>
        {helperText ? (
          <TitleRegular
            size="xs"
            color={colors.textLightGrey}
            style={styles.helperText}
          >
            {helperText}
          </TitleRegular>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  field: {
    gap: gaps.xs,
  },
  inputContainer: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
    paddingHorizontal: gaps.md,
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey),
    borderRadius: borderRadiuses.md,
    backgroundColor: "#FCFCFA",
  },
  inputContainerFocused: {
    borderColor: getColor(colors.waffle),
    backgroundColor: getColor(colors.waffle, 0.06),
  },
  inputContainerDisabled: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    alignSelf: "stretch",
    paddingVertical: 0,
    color: getColor(colors.textDarkGrey),
    fontFamily: getFontFamily("400"),
    fontSize: fontSizes.md,
  },
  visibilityButton: {
    width: 32,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  helperText: {
    lineHeight: 17,
    paddingHorizontal: gaps.xxs,
  },
});
