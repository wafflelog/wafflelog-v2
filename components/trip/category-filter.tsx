import { IconPinCategory } from "@/components/icon/pin-category";
import { UIText } from "@/components/ui/text";
import { colors, getColor } from "@/constants/theme";
import { type PinCategory } from "@/types/pin";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { TitleRegular } from "../title/regular";

export const TripCategoryFilter = ({
  categories,
  selectedCategoryIds,
  onSelectedCategoryIdsChange,
}: {
  categories: PinCategory[];
  selectedCategoryIds: string[];
  onSelectedCategoryIdsChange: (categoryIds: string[]) => void;
}) => {
  const handleToggleCategory = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      onSelectedCategoryIdsChange(
        selectedCategoryIds.filter((selectedId) => selectedId !== categoryId),
      );
      return;
    }

    onSelectedCategoryIdsChange([...selectedCategoryIds, categoryId]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TitleRegular size="md" weight="600">
          Filter by category
        </TitleRegular>
        {selectedCategoryIds.length > 0 && (
          <TouchableOpacity onPress={() => onSelectedCategoryIdsChange([])}>
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
          const isSelected = selectedCategoryIds.includes(category.id);

          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.item,
                isSelected && styles.itemActive,
              ]}
              onPress={() => handleToggleCategory(category.id)}
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
