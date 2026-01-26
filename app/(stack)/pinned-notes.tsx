import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface PinnedNote {
  id: string;
  text: string;
  pinId: string;
  pinName: string;
  createdDate?: string;
}

export default function PinnedNotesScreen() {
  const router = useRouter();

  // Dummy data - pinned notes from all pins in the trip
  const notes: PinnedNote[] = [
    {
      id: "1",
      text: "Make sure to book tickets in advance online to avoid long queues. The audio guide is highly recommended for understanding the architecture. Best time to visit is early morning for better lighting and fewer crowds.",
      pinId: "1",
      pinName: "Sagrada Família",
      createdDate: "Mar 9, 2024",
    },
    {
      id: "2",
      text: "Park opens at 8 AM. The mosaic benches offer great photo opportunities. Wear comfortable shoes for walking.",
      pinId: "2",
      pinName: "Park Güell",
      createdDate: "Mar 10, 2024",
    },
    {
      id: "3",
      text: "Best time to visit is early morning when it's less crowded. Try the fresh fruit juices and local specialties.",
      pinId: "3",
      pinName: "La Boqueria Market",
      createdDate: "Mar 10, 2024",
    },
    {
      id: "4",
      text: "Free entry on first Sunday of the month. Audio guide available in multiple languages. Photography allowed in most areas.",
      pinId: "5",
      pinName: "Picasso Museum",
      createdDate: "Mar 11, 2024",
    },
    {
      id: "5",
      text: "Bring sunscreen and beach towels. Water sports equipment available for rent nearby.",
      pinId: "6",
      pinName: "Barceloneta Beach",
      createdDate: "Mar 11, 2024",
    },
    {
      id: "6",
      text: "Cable car operates until 9 PM. Sunset views are spectacular from the top. Check weather before going.",
      pinId: "7",
      pinName: "Montjuïc Hill",
      createdDate: "Mar 12, 2024",
    },
  ];

  const handleNotePress = (note: PinnedNote) => {
    router.push(`/pin?id=${note.pinId}`);
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
          <Text style={styles.headerTitle}>Pinned Notes</Text>
          <Text style={styles.headerSubtitle}>
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Notes List */}
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.noteCard}
            onPress={() => handleNotePress(item)}
          >
            <View style={styles.noteHeader}>
              <View style={styles.pinBadge}>
                <Ionicons name="pin" size={14} color="#4A90E2" />
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handlePinPress(item.pinId);
                  }}
                >
                  <Text style={styles.pinName}>{item.pinName}</Text>
                </TouchableOpacity>
              </View>
              {item.createdDate && (
                <Text style={styles.noteDate}>{item.createdDate}</Text>
              )}
            </View>
            <Text style={styles.noteText}>{item.text}</Text>
            <View style={styles.noteFooter}>
              <TouchableOpacity
                style={styles.viewPinButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handlePinPress(item.pinId);
                }}
              >
                <Ionicons name="location" size={14} color="#4A90E2" />
                <Text style={styles.viewPinText}>View Pin</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="create-outline" size={64} color="#CCC" />
            <Text style={styles.emptyStateText}>No pinned notes yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Pin notes from pin details to see them here
            </Text>
          </View>
        }
      />
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
  listContent: {
    padding: 20,
    gap: 12,
  },
  noteCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: "#4A90E2",
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pinBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F7FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  pinName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A90E2",
  },
  noteDate: {
    fontSize: 11,
    color: "#999",
  },
  noteText: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  viewPinButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewPinText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4A90E2",
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
});
