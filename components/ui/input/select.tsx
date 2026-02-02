import { TitleRegular } from "@/components/title/regular";
import { Dialog } from "@/components/ui/dialog";
import {
  borderRadiuses,
  colors,
  fontSizes,
  gaps,
  getColor,
} from "@/constants/theme";
import { useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity } from "react-native";

type SelectOption = {
  label: string;
  value: string;
};

type UIInputSelectProps = {
  selectedValue?: string;
  options: string[] | SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
};

export const UIInputSelect = ({
  selectedValue,
  options,
  onValueChange,
  placeholder = "Select...",
}: UIInputSelectProps) => {
  const [showDialog, setShowDialog] = useState(false);

  // Normalize options to always have label and value
  const normalizedOptions: SelectOption[] = options.map((option) =>
    typeof option === "string" ? { label: option, value: option } : option
  );

  // Find the selected option's label
  const selectedOption = normalizedOptions.find(
    (opt) => opt.value === selectedValue
  );
  const displayValue = selectedOption?.label || "";

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setShowDialog(false);
  };

  const handleInputPress = () => {
    setShowDialog(true);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.input}
        onPress={handleInputPress}
        activeOpacity={0.7}
      >
        {displayValue ? (
          <TitleRegular size="md" color={colors.textDarkGrey}>
            {displayValue}
          </TitleRegular>
        ) : (
          <TitleRegular size="md" color={colors.textLightGrey}>
            {placeholder}
          </TitleRegular>
        )}
      </TouchableOpacity>

      <Dialog
        visible={showDialog}
        onDismiss={() => setShowDialog(false)}
        title={placeholder}
        size="md"
      >
        <FlatList
          data={normalizedOptions}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.option,
                selectedValue === item.value && styles.optionSelected,
              ]}
              onPress={() => handleSelect(item.value)}
              activeOpacity={0.7}
            >
              <TitleRegular
                size="md"
                color={
                  selectedValue === item.value
                    ? colors.blue
                    : colors.textDarkGrey
                }
                weight={selectedValue === item.value ? "600" : "400"}
              >
                {item.label}
              </TitleRegular>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.optionsList}
        />
      </Dialog>
    </>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey),
    borderRadius: borderRadiuses.sm,
    padding: gaps.sm,
    minHeight: fontSizes.md + gaps.sm * 2,
    justifyContent: "center",
  },
  optionsList: {
    padding: gaps.sm,
  },
  option: {
    padding: gaps.md,
    borderRadius: borderRadiuses.sm,
    marginBottom: gaps.xs,
  },
  optionSelected: {
    backgroundColor: getColor(colors.blue, 0.1),
  },
});
