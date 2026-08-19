import {
  PlaceSearchResultCard,
  type PlaceSearchResult,
} from "@/components/card/place/search-result";
import { AppHeader } from "@/components/header/app-header";
import { HeaderBackButton } from "@/components/header/icon-button";
import { colors, getColor, semanticColors } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { canEditPinLocation } from "@/lib/helper/permissions";
import { actionGetLocalPin } from "@/lib/sqlite/model/pin";
import { actionUpsertLocalPinLocation } from "@/lib/sqlite/model/pin-location";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Replace with your Google Places API key
// For production, use environment variables or secure storage
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function PlaceSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ pinId?: string }>();
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [savingPlaceId, setSavingPlaceId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pinId = params.pinId ?? "";

  // Google Places API Text Search (New)
  // Documentation: https://developers.google.com/maps/documentation/places/web-service/text-search
  const searchPlaces = async (query: string) => {
    if (!GOOGLE_PLACES_API_KEY) {
      setError("Google Places API key is not set");
      setSearchResults([]);
      return;
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 3) {
      setSearchResults([]);
      setError("Enter at least 3 characters to search");
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setError(null);

    try {
      const response = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.location,places.primaryTypeDisplayName",
          },
          body: JSON.stringify({
            textQuery: trimmedQuery,
            pageSize: 10,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `API Error: ${response.status}`,
        );
      }

      const data = (await response.json()) as {
        places?: PlaceSearchResult[];
      };

      setSearchResults(data.places ?? []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to search places";
      setError(errorMessage);
      setSearchResults([]);
      console.error("Places API Error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);
    setSearchResults([]);
    setHasSearched(false);
    setError(null);
  };

  const handleSelectPlace = async (place: PlaceSearchResult) => {
    if (!session?.user.id) {
      showMessage("You must be signed in to save a location", "error");
      return;
    }

    if (!pinId) {
      showMessage("This place needs to be attached to a pin", "error");
      return;
    }

    try {
      setSavingPlaceId(place.id);
      const localPin = await actionGetLocalPin(pinId, session.user.id);

      if (
        !canEditPinLocation({
          currentUserId: session.user.id,
          entityUserId: localPin?.userId,
        })
      ) {
        showMessage("Only the pin creator can change its location", "error");
        return;
      }

      await actionUpsertLocalPinLocation({
        pinId,
        userId: session.user.id,
        placeId: place.id,
        displayName: place.displayName.text,
        formattedAddress: place.formattedAddress,
        imageUrl: null,
        localImageUri: null,
        rating: null,
        reviewCount: null,
        latitude: place.location.latitude,
        longitude: place.location.longitude,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["local-pin-location", pinId, session.user.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["local-pin", pinId, session.user.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["local-pins"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["local-pin-locations"],
        }),
      ]);
      showMessage("Location saved locally", "info");
      router.back();
    } catch (saveError) {
      console.error("Error saving pin location:", saveError);
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Failed to save this location";
      showMessage(message, "error");
    } finally {
      setSavingPlaceId(null);
    }
  };

  const isSearchDisabled = searchQuery.trim().length < 3 || isSearching;

  return (
    <View style={styles.container}>
      <AppHeader
        title="Search Places"
        leading={
          <HeaderBackButton onPress={() => router.back()} />
        }
      />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search"
              size={20}
              color={semanticColors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Place name or address"
              placeholderTextColor={getColor(colors.paleGrey)}
              value={searchQuery}
              onChangeText={handleSearchQueryChange}
              onSubmitEditing={() => void searchPlaces(searchQuery)}
              autoFocus
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                accessibilityLabel="Clear place search"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => handleSearchQueryChange("")}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={getColor(colors.paleGrey)}
                />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            accessibilityLabel="Search places"
            accessibilityRole="button"
            activeOpacity={0.8}
            disabled={isSearchDisabled}
            onPress={() => void searchPlaces(searchQuery)}
            style={[
              styles.searchButton,
              isSearchDisabled && styles.searchButtonDisabled,
            ]}
          >
            {isSearching ? (
              <ActivityIndicator
                color={semanticColors.primaryActionContent}
                size="small"
              />
            ) : (
              <Ionicons
                name="search"
                size={21}
                color={semanticColors.primaryActionContent}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle"
            size={20}
            color={getColor(colors.red)}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <PlaceSearchResultCard
                place={item}
                isDisabled={savingPlaceId !== null}
                isSaving={savingPlaceId === item.id}
                onConfirm={() => void handleSelectPlace(item)}
              />
            )}
            style={styles.resultsList}
            contentContainerStyle={styles.resultsListContent}
          />
        </View>
      )}

      {/* Empty State */}
      {!isSearching && !hasSearched && searchResults.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="search-outline"
            size={64}
            color={getColor(colors.paleGrey)}
          />
          <Text style={styles.emptyStateText}>Find the right place</Text>
          <Text style={styles.emptyStateSubtext}>
            Search by a place name or address, then choose the best match for
            your pin.
          </Text>
        </View>
      ) : null}

      {!isSearching && hasSearched && searchResults.length === 0 && !error ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="location-outline"
            size={56}
            color={getColor(colors.paleGrey)}
          />
          <Text style={styles.emptyStateText}>No matching places</Text>
          <Text style={styles.emptyStateSubtext}>
            Try a more specific name, town or address.
          </Text>
        </View>
      ) : null}
      <SystemMessageModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.screen,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: semanticColors.screen,
    borderBottomWidth: 1,
    borderBottomColor: semanticColors.neutralDivider,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: semanticColors.surface,
    borderWidth: 1,
    borderColor: semanticColors.neutralDivider,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: semanticColors.textPrimary,
  },
  searchButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: semanticColors.primaryAction,
  },
  searchButtonDisabled: {
    opacity: 0.45,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: semanticColors.screen,
  },
  resultsList: {
    flex: 1,
  },
  resultsListContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: semanticColors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: getColor(colors.paleGrey),
    textAlign: "center",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: getColor(colors.red, 0.12),
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: getColor(colors.red),
  },
});
