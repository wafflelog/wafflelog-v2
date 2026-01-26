import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PADDING = 20;
const GAP = 12;
const ITEM_WIDTH = (SCREEN_WIDTH - PADDING * 2 - GAP) / 2;

interface TripImage {
  id: string;
  url: string;
  thumbnail?: string;
  caption?: string;
  pinId: string;
  pinName: string;
  uploadedDate?: string;
}

export default function ImagesScreen() {
  const router = useRouter();

  // Dummy data - images from all pins in the trip
  const images: TripImage[] = [
    {
      id: "1",
      url: "placeholder",
      thumbnail: "placeholder",
      caption: "Exterior view of the basilica",
      pinId: "1",
      pinName: "Sagrada Família",
      uploadedDate: "Mar 10, 2024",
    },
    {
      id: "2",
      url: "placeholder",
      thumbnail: "placeholder",
      caption: "Interior details",
      pinId: "1",
      pinName: "Sagrada Família",
      uploadedDate: "Mar 10, 2024",
    },
    {
      id: "3",
      url: "placeholder",
      thumbnail: "placeholder",
      pinId: "1",
      pinName: "Sagrada Família",
      uploadedDate: "Mar 10, 2024",
    },
    {
      id: "4",
      url: "placeholder",
      thumbnail: "placeholder",
      caption: "Park entrance",
      pinId: "2",
      pinName: "Park Güell",
      uploadedDate: "Mar 10, 2024",
    },
    {
      id: "5",
      url: "placeholder",
      thumbnail: "placeholder",
      caption: "Colorful mosaic benches",
      pinId: "2",
      pinName: "Park Güell",
      uploadedDate: "Mar 10, 2024",
    },
    {
      id: "6",
      url: "placeholder",
      thumbnail: "placeholder",
      caption: "Fresh produce at the market",
      pinId: "3",
      pinName: "La Boqueria Market",
      uploadedDate: "Mar 10, 2024",
    },
    {
      id: "7",
      url: "placeholder",
      thumbnail: "placeholder",
      pinId: "5",
      pinName: "Picasso Museum",
      uploadedDate: "Mar 11, 2024",
    },
    {
      id: "8",
      url: "placeholder",
      thumbnail: "placeholder",
      caption: "Beach view",
      pinId: "6",
      pinName: "Barceloneta Beach",
      uploadedDate: "Mar 11, 2024",
    },
    {
      id: "9",
      url: "placeholder",
      thumbnail: "placeholder",
      caption: "City view from the hill",
      pinId: "7",
      pinName: "Montjuïc Hill",
      uploadedDate: "Mar 12, 2024",
    },
    {
      id: "10",
      url: "placeholder",
      thumbnail: "placeholder",
      caption: "Fountain show at night",
      pinId: "8",
      pinName: "Magic Fountain",
      uploadedDate: "Mar 12, 2024",
    },
  ];

  const handleImagePress = (image: TripImage) => {
    router.push(`/pin?id=${image.pinId}`);
  };

  const handlePinPress = (pinId: string) => {
    router.push(`/pin?id=${pinId}`);
  };

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
          <Text style={styles.headerTitle}>Images</Text>
          <Text style={styles.headerSubtitle}>
            {images.length} {images.length === 1 ? "photo" : "photos"}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Images Grid */}
      <FlatList
        data={images}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.imageItem}
            onPress={() => handleImagePress(item)}
          >
            <View style={styles.imageContainer}>
              {item.thumbnail ? (
                <View style={styles.imageThumbnail}>
                  <Ionicons name="image-outline" size={40} color="#999" />
                </View>
              ) : (
                <View style={styles.imageThumbnail}>
                  <Ionicons name="image-outline" size={40} color="#999" />
                </View>
              )}
              <View style={styles.imageOverlay}>
                <TouchableOpacity
                  style={styles.pinBadge}
                  onPress={(e) => {
                    e.stopPropagation();
                    handlePinPress(item.pinId);
                  }}
                >
                  <Ionicons name="location" size={10} color="#fff" />
                  <Text style={styles.pinName} numberOfLines={1}>
                    {item.pinName}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {item.caption && (
              <Text style={styles.imageCaption} numberOfLines={2}>
                {item.caption}
              </Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color="#CCC" />
            <Text style={styles.emptyStateText}>No images yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add images from pin details
            </Text>
          </View>
        }
      />

      {/* Add Image Button */}
      <View style={styles.addImageSection}>
        <TouchableOpacity style={styles.addImageButton}>
          <Ionicons name="add-circle-outline" size={20} color="#4A90E2" />
          <Text style={styles.addImageText}>Add Photo</Text>
        </TouchableOpacity>
      </View>
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
  headerSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  addButton: {
    padding: 4,
  },
  gridContent: {
    padding: PADDING,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: GAP,
  },
  imageItem: {
    width: ITEM_WIDTH,
  },
  imageContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
    marginBottom: 8,
    position: "relative",
  },
  imageThumbnail: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F0F0",
  },
  imageOverlay: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
  },
  pinBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    alignSelf: "flex-start",
  },
  pinName: {
    fontSize: 11,
    fontWeight: "500",
    color: "#fff",
  },
  imageCaption: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 100,
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
  addImageSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    gap: 8,
  },
  addImageText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A90E2",
  },
});
