import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  fontSizes,
  gaps,
  getColor,
} from "@/constants/theme";
import {
  StyleProp,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from "react-native";

type UIInputTextProps = {
  placeholder: string;
  containerStyle?: StyleProp<ViewStyle>;
  value?: string;
  onChange?: (text: string) => void;
  autoFocus?: boolean;
};

export const UIInputText = ({
  placeholder,
  containerStyle,
  value,
  onChange,
  autoFocus,
}: UIInputTextProps) => {
  const isEmpty = !value || value.length === 0;

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={[styles.input]}
        value={value}
        onChangeText={onChange}
        autoFocus={autoFocus}
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
  },
  placeholderContainer: {
    position: "absolute",
    left: gaps.sm,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
});
