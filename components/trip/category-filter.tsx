import { IconPinCategory } from "@/components/icon/pin-category";
import { UIText } from "@/components/ui/text";
import { colors, getColor } from "@/constants/theme";
import { type PinCategory } from "@/types/pin";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { TitleRegular } from "../title/regular";

export const TripCategoryFilter = ({
  categories,
}: {
  categories: PinCategory[];
}) => {
  const [selectedCategories, setSelectedCategories] = useState<PinCategory[]>(
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TitleRegular size="lg">Filter by category</TitleRegular>
        {selectedCategories.length > 0 && (
          <TouchableOpacity onPress={() => setSelectedCategories([])}>
            <UIText style={styles.clear} weight="600">
              Clear
            </UIText>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {categories.map((category) => {
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.item,
                selectedCategories.includes(category) && styles.itemActive,
              ]}
              onPress={() =>
                setSelectedCategories([...selectedCategories, category])
              }
            >
              <IconPinCategory category={category} size={18} />
              <UIText style={styles.itemText} weight="500">
                {category.name}
              </UIText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  content: {
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 17,
    color: getColor(colors.textDarkGrey),
  },
  clear: {
    color: getColor(colors.purple),
    fontSize: 14,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey),
    // backgroundColor: getColor(colors.waffle, 0.2),
  },
  itemActive: {
    backgroundColor: getColor(colors.waffle, 0.2),
    borderColor: getColor(colors.waffle),
  },
  itemText: {
    textTransform: "capitalize",
  },
});
