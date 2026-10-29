import { colors, getColor } from "@/constants/theme";
import { Check } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

type DraftSelectionCheckboxProps = {
  isSelected: boolean;
  variant?: "itinerary" | "checklist";
};

const checkboxVariants = {
  itinerary: {
    size: 22,
    checkSize: 15,
    color: colors.purple,
    marginTop: 2,
  },
  checklist: {
    size: 18,
    checkSize: 12,
    color: colors.turquoise,
    marginTop: 0,
  },
} as const;

export function DraftSelectionCheckbox({
  isSelected,
  variant = "itinerary",
}: DraftSelectionCheckboxProps) {
  const checkboxVariant = checkboxVariants[variant];

  return (
    <View
      style={[
        styles.checkbox,
        {
          width: checkboxVariant.size,
          height: checkboxVariant.size,
          marginTop: checkboxVariant.marginTop,
        },
        isSelected && {
          borderColor: getColor(checkboxVariant.color),
          backgroundColor: getColor(checkboxVariant.color),
        },
      ]}
    >
      {isSelected ? (
        <Check
          size={checkboxVariant.checkSize}
          strokeWidth={3}
          color={getColor(colors.white)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: getColor(colors.paleGrey),
    backgroundColor: getColor(colors.white),
  },
});
