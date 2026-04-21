import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Replace with your Google Places API key
// For production, use environment variables or secure storage
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

interface Review {
  authorAttribution: {
    displayName: string;
  };
  text: {
    text: string;
  };
  rating: number;
  publishTime: string;
}

interface Photo {
  name: string;
  widthPx?: number;
  heightPx?: number;
  authorAttributions?: {
    displayName: string;
    uri: string;
  }[];
}

interface PlaceResult {
  id: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  userRatingCount?: number;
  reviews?: Review[];
  photos?: Photo[];
}

export default function PlaceSearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Google Places API Text Search (New)
  // Documentation: https://developers.google.com/maps/documentation/places/web-service/text-search
  const searchPlaces = async (query: string) => {
    if (!GOOGLE_PLACES_API_KEY) {
      setError("Google Places API key is not set");
      setSearchResults([]);
      return;
    }

    if (!query.trim()) {
      setSearchResults([]);
      setError(null);
      return;
    }

    setIsSearching(true);
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
              "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.reviews,places.photos",
          },
          body: JSON.stringify({
            textQuery: query,
            pageSize: 3,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `API Error: ${response.status}`
        );
      }

      const data = await response.json();

      console.log("data.places", JSON.stringify(data.places, null, 2));
      setSearchResults(data.places || []);
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

  const handleSearch = (text: string) => {
    setSearchQuery(text);

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 1000); // 1000ms debounce delay
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Search Places</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a place..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  {/* Thumbnail */}
                  {item.photos && item.photos.length > 0 ? (
                    <View style={styles.thumbnailContainer}>
                      <Image
                        source={{
                          uri: `https://places.googleapis.com/v1/${item.photos[0].name}/media?maxHeightPx=200&maxWidthPx=200&key=${GOOGLE_PLACES_API_KEY}`,
                        }}
                        style={styles.thumbnail}
                      />
                    </View>
                  ) : (
                    <View style={styles.thumbnailPlaceholder}>
                      <Ionicons name="image-outline" size={24} color="#999" />
                    </View>
                  )}
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>
                      {item.displayName.text}
                    </Text>
                    <Text style={styles.resultAddress}>
                      {item.formattedAddress}
                    </Text>
                    {item.rating && (
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={16} color="#FFB800" />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                        {item.userRatingCount && (
                          <Text style={styles.reviewCount}>
                            ({item.userRatingCount} reviews)
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>

                {/* Reviews */}
                {item.reviews && item.reviews.length > 0 && (
                  <View style={styles.reviewsContainer}>
                    <Text style={styles.reviewsTitle}>Latest Reviews</Text>
                    {item.reviews.slice(0, 3).map((review, index) => (
                      <View key={index} style={styles.reviewItem}>
                        <View style={styles.reviewHeader}>
                          <Text style={styles.reviewAuthor}>
                            {review.authorAttribution.displayName}
                          </Text>
                          {review.rating && (
                            <View style={styles.reviewRating}>
                              <Ionicons name="star" size={12} color="#FFB800" />
                              <Text style={styles.reviewRatingText}>
                                {review.rating}
                              </Text>
                            </View>
                          )}
                        </View>
                        {review.text?.text && (
                          <Text style={styles.reviewText} numberOfLines={3}>
                            {review.text.text}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.coordinatesContainer}>
                  <View style={styles.coordinateItem}>
                    <Ionicons name="location" size={14} color="#666" />
                    <Text style={styles.coordinateLabel}>Latitude:</Text>
                    <Text style={styles.coordinateValue}>
                      {item.location.latitude}
                    </Text>
                  </View>
                  <View style={styles.coordinateItem}>
                    <Ionicons name="location" size={14} color="#666" />
                    <Text style={styles.coordinateLabel}>Longitude:</Text>
                    <Text style={styles.coordinateValue}>
                      {item.location.longitude}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            style={styles.resultsList}
            contentContainerStyle={styles.resultsListContent}
          />
        </View>
      )}

      {/* Empty State */}
      {searchQuery.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color="#CCC" />
          <Text style={styles.emptyStateText}>Search for places</Text>
          <Text style={styles.emptyStateSubtext}>
            Enter a place name or address to find locations
          </Text>
        </View>
      )}

      {/* Loading State */}
      {isSearching && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    padding: 4,
    width: 32,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  searchContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  resultsList: {
    flex: 1,
  },
  resultsListContent: {
    padding: 20,
    gap: 12,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0F0F0",
  },
  thumbnailPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  resultAddress: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  reviewCount: {
    fontSize: 12,
    color: "#999",
  },
  reviewsContainer: {
    marginTop: 12,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  reviewsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  reviewItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  reviewRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  reviewRatingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  reviewText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  coordinatesContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 8,
  },
  coordinateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coordinateLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    minWidth: 70,
  },
  coordinateValue: {
    fontSize: 13,
    color: "#333",
    fontFamily: "monospace",
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
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5E5",
    padding: 16,
    margin: 20,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#FF6B6B",
  },
});
