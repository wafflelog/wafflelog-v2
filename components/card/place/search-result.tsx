import { UIText } from "@/components/ui/text";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
  semanticColors,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

export type PlaceSearchResult = {
  id: string;
  displayName: {
    text: string;
    languageCode?: string;
  };
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  primaryTypeDisplayName?: {
    text: string;
    languageCode?: string;
  };
};

type PlaceSearchResultCardProps = {
  isDisabled: boolean;
  isSaving: boolean;
  onConfirm: () => void;
  place: PlaceSearchResult;
};

export const PlaceSearchResultCard = ({
  isDisabled,
  isSaving,
  onConfirm,
  place,
}: PlaceSearchResultCardProps) => {
  return (
    <Pressable
      accessibilityLabel={`Use ${place.displayName.text}`}
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onConfirm}
      style={styles.card}
    >
      <View style={styles.summary}>
        <View style={styles.placeIcon}>
          <Ionicons
            name="location-outline"
            size={21}
            color={getColor(colors.purple)}
          />
        </View>
        <View style={styles.placeDetails}>
          <UIText style={styles.placeName} weight="700">
            {place.displayName.text}
          </UIText>
          {place.primaryTypeDisplayName?.text ? (
            <UIText numberOfLines={1} style={styles.placeType} weight="600">
              {place.primaryTypeDisplayName.text}
            </UIText>
          ) : null}
          <UIText numberOfLines={2} style={styles.placeAddress}>
            {place.formattedAddress}
          </UIText>
        </View>
        {isSaving ? (
          <View style={styles.savingIndicator}>
            <ActivityIndicator
              color={getColor(colors.purple)}
              size="small"
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey, 0.7),
    borderRadius: borderRadiuses.md,
    padding: gaps.sm,
    backgroundColor: semanticColors.surface,
  },
  summary: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: gaps.xs,
  },
  placeIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadiuses.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.purple, 0.1),
    marginTop: 1,
  },
  placeDetails: {
    flex: 1,
    minWidth: 0,
  },
  placeName: {
    color: semanticColors.textPrimary,
    fontSize: 16,
    lineHeight: 21,
  },
  placeType: {
    marginTop: 2,
    color: getColor(colors.purple),
    fontSize: 12,
    lineHeight: 17,
  },
  placeAddress: {
    marginTop: 2,
    color: semanticColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  savingIndicator: {
    width: 28,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
