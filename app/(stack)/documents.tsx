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

interface Document {
  id: string;
  name: string;
  type: string;
  pinId: string;
  pinName: string;
  uploadedDate?: string;
}

export default function DocumentsScreen() {
  const router = useRouter();

  // Dummy data - documents from all pins in the trip
  const documents: Document[] = [
    {
      id: "1",
      name: "Tickets.pdf",
      type: "pdf",
      pinId: "1",
      pinName: "Sagrada Família",
      uploadedDate: "Mar 9, 2024",
    },
    {
      id: "2",
      name: "Map.pdf",
      type: "pdf",
      pinId: "1",
      pinName: "Sagrada Família",
      uploadedDate: "Mar 9, 2024",
    },
    {
      id: "3",
      name: "Park Guide.pdf",
      type: "pdf",
      pinId: "2",
      pinName: "Park Güell",
      uploadedDate: "Mar 10, 2024",
    },
    {
      id: "4",
      name: "Restaurant Menu.pdf",
      type: "pdf",
      pinId: "3",
      pinName: "La Boqueria Market",
      uploadedDate: "Mar 10, 2024",
    },
    {
      id: "5",
      name: "Museum Tickets.pdf",
      type: "pdf",
      pinId: "5",
      pinName: "Picasso Museum",
      uploadedDate: "Mar 11, 2024",
    },
    {
      id: "6",
      name: "Beach Rules.pdf",
      type: "pdf",
      pinId: "6",
      pinName: "Barceloneta Beach",
      uploadedDate: "Mar 11, 2024",
    },
    {
      id: "7",
      name: "Transportation Schedule.xlsx",
      type: "xlsx",
      pinId: "7",
      pinName: "Montjuïc Hill",
      uploadedDate: "Mar 12, 2024",
    },
    {
      id: "8",
      name: "Fountain Show Times.pdf",
      type: "pdf",
      pinId: "8",
      pinName: "Magic Fountain",
      uploadedDate: "Mar 12, 2024",
    },
  ];

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return "document-text";
      case "xlsx":
      case "xls":
        return "document";
      case "doc":
      case "docx":
        return "document-text";
      case "jpg":
      case "jpeg":
      case "png":
        return "image";
      default:
        return "document";
    }
  };

  const handleDocumentPress = (document: Document) => {
    // Navigate to pin detail or open document
    router.push(`/pin?id=${document.pinId}`);
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
          <Text style={styles.headerTitle}>Documents</Text>
          <Text style={styles.headerSubtitle}>
            {documents.length} {documents.length === 1 ? "file" : "files"}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Documents Grid */}
      <FlatList
        data={documents}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.documentItem}
            onPress={() => handleDocumentPress(item)}
          >
            <View style={styles.documentIcon}>
              <Ionicons
                name={getFileIcon(item.type)}
                size={32}
                color="#4A90E2"
              />
            </View>
            <View style={styles.documentInfo}>
              <Text style={styles.documentName} numberOfLines={2}>
                {item.name}
              </Text>
              <View style={styles.pinBadge}>
                <Ionicons name="location" size={10} color="#666" />
                <Text style={styles.pinName} numberOfLines={1}>
                  {item.pinName}
                </Text>
              </View>
              <Text style={styles.documentType} numberOfLines={1}>
                {item.type.toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color="#CCC" />
            <Text style={styles.emptyStateText}>No documents yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Upload documents from pin details
            </Text>
          </View>
        }
      />

      {/* Add Document Button */}
      <View style={styles.addDocumentSection}>
        <TouchableOpacity style={styles.addDocumentButton}>
          <Ionicons name="add-circle-outline" size={20} color="#4A90E2" />
          <Text style={styles.addDocumentText}>Add Document</Text>
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
  documentItem: {
    width: ITEM_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentIcon: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  documentInfo: {
    width: "100%",
    alignItems: "center",
  },
  documentName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
    textAlign: "center",
    minHeight: 32,
  },
  pinBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
    marginBottom: 4,
    width: "100%",
    justifyContent: "center",
  },
  pinName: {
    fontSize: 10,
    fontWeight: "500",
    color: "#666",
    flex: 1,
  },
  documentType: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
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
  addDocumentSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  addDocumentButton: {
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
  addDocumentText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A90E2",
  },
});
