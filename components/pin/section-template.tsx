import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { ButtonAdd } from "@/components/button/add";
import { TitleRegular } from "@/components/title/regular";
import { colors, getCardBasicStyle, getColor } from "@/constants/theme";

type PinSectionTemplateProps = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  hasContent?: boolean;
  onAdd: () => void;
  addText: string;
  addButtonStyle?: StyleProp<ViewStyle>;
};

export const PinSectionTemplate = ({
  title,
  icon,
  children,
  hasContent = true,
  onAdd,
  addText,
  addButtonStyle,
}: PinSectionTemplateProps) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon}
        <TitleRegular size="md" weight="600">
          {title}
        </TitleRegular>
      </View>

      {hasContent ? (
        <View style={styles.sectionCard}>{children}</View>
      ) : null}

      <ButtonAdd
        text={addText}
        onPress={onAdd}
        style={addButtonStyle}
      />
    </View>
  );
};

export const pinSectionStyles = StyleSheet.create({
  divider: {
    height: 1,
    marginTop: 12,
    backgroundColor: getColor(colors.textLightGrey, 0.2),
  },
});

const styles = StyleSheet.create({
  section: {
    gap: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionCard: {
    gap: 12,
    ...getCardBasicStyle("sm"),
  },
});
