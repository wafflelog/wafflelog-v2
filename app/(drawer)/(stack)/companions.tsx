import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Companion {
  id: string;
  name: string;
  username: string;
  thumbnail: string;
  invitationSent?: boolean;
}

export default function CompanionsScreen() {
  const router = useRouter();
  const [companions, setCompanions] = useState<Companion[]>([
    {
      id: "1",
      name: "Mike Johnson",
      username: "@mikej",
      thumbnail: "M",
      invitationSent: false,
    },
    {
      id: "2",
      name: "Jessica Chen",
      username: "@jessicac",
      thumbnail: "J",
      invitationSent: false,
    },
    {
      id: "3",
      name: "David Kim",
      username: "@davidk",
      thumbnail: "D",
      invitationSent: true,
    },
    {
      id: "4",
      name: "Sarah Williams",
      username: "@sarahw",
      thumbnail: "S",
      invitationSent: false,
    },
    {
      id: "5",
      name: "Alex Martinez",
      username: "@alexm",
      thumbnail: "A",
      invitationSent: true,
    },
  ]);

  const handleRemove = (companionId: string) => {
    setCompanions(companions.filter((c) => c.id !== companionId));
  };

  const handleInvite = (companionId: string) => {
    setCompanions(
      companions.map((c) =>
        c.id === companionId ? { ...c, invitationSent: true } : c
      )
    );
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
          <Text style={styles.headerTitle}>Travel Companions</Text>
          <Text style={styles.headerSubtitle}>
            {companions.length}{" "}
            {companions.length === 1 ? "companion" : "companions"}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Companions List */}
      <FlatList
        data={companions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.companionCard}>
            <TouchableOpacity
              style={styles.companionInfo}
              onPress={() => router.push(`/user`)}
            >
              {/* Thumbnail */}
              <View style={styles.thumbnail}>
                <Text style={styles.thumbnailText}>{item.thumbnail}</Text>
              </View>

              {/* User Details */}
              <View style={styles.userDetails}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.invitationSent && (
                    <View style={styles.statusBadgePending}>
                      <Ionicons name="mail-outline" size={14} color="#FF9500" />
                      <Text style={styles.statusTextPending}>
                        Invitation Sent
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.username}>{item.username}</Text>
              </View>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemove(item.id)}
              >
                <Ionicons name="close" size={18} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#CCC" />
            <Text style={styles.emptyStateText}>No companions yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add travel companions to your trip
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
  companionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companionInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  thumbnailText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
    flexWrap: "wrap",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  username: {
    fontSize: 13,
    color: "#666",
  },
  statusBadgePending: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF4E6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  statusTextPending: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FF9500",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inviteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  inviteButtonDisabled: {
    backgroundColor: "#F5F7FA",
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFE5E5",
    alignItems: "center",
    justifyContent: "center",
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
