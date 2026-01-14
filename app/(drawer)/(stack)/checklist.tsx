import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdBy?: string;
}

const CURRENT_USER = "Sarah";

export default function ChecklistScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"my" | "public">("my");
  const [newItemText, setNewItemText] = useState("");

  // User's own checklist
  const [myChecklist, setMyChecklist] = useState<ChecklistItem[]>([
    {
      id: "1",
      text: "Book hotel rooms",
      completed: true,
    },
    {
      id: "2",
      text: "Buy flight tickets",
      completed: true,
    },
    {
      id: "3",
      text: "Pack travel essentials",
      completed: false,
    },
    {
      id: "4",
      text: "Exchange currency",
      completed: false,
    },
    {
      id: "5",
      text: "Download offline maps",
      completed: false,
    },
  ]);

  // Public checklist (shared with companions)
  const [publicChecklist, setPublicChecklist] = useState<ChecklistItem[]>([
    {
      id: "p1",
      text: "Book restaurant reservations",
      completed: false,
      createdBy: "Mike",
    },
    {
      id: "p2",
      text: "Rent a car",
      completed: true,
      createdBy: "Jessica",
    },
    {
      id: "p3",
      text: "Get travel insurance",
      completed: false,
      createdBy: "David",
    },
    {
      id: "p4",
      text: "Create shared photo album",
      completed: false,
      createdBy: CURRENT_USER,
    },
  ]);

  const currentChecklist = activeTab === "my" ? myChecklist : publicChecklist;
  const setCurrentChecklist =
    activeTab === "my" ? setMyChecklist : setPublicChecklist;

  const toggleItem = (itemId: string) => {
    setCurrentChecklist(
      currentChecklist.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const addItem = () => {
    if (!newItemText.trim()) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      completed: false,
      ...(activeTab === "public" && { createdBy: CURRENT_USER }),
    };

    setCurrentChecklist([...currentChecklist, newItem]);
    setNewItemText("");
  };

  const removeItem = (itemId: string) => {
    setCurrentChecklist(currentChecklist.filter((item) => item.id !== itemId));
  };

  const completedCount = currentChecklist.filter(
    (item) => item.completed
  ).length;
  const totalCount = currentChecklist.length;

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
          <Text style={styles.headerTitle}>Checklist</Text>
          <Text style={styles.headerSubtitle}>
            {completedCount}/{totalCount} completed
          </Text>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "my" && styles.tabActive]}
          onPress={() => setActiveTab("my")}
        >
          <Ionicons
            name="person-outline"
            size={18}
            color={activeTab === "my" ? "#4A90E2" : "#666"}
          />
          <Text
            style={[styles.tabText, activeTab === "my" && styles.tabTextActive]}
          >
            My Checklist
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "public" && styles.tabActive]}
          onPress={() => setActiveTab("public")}
        >
          <Ionicons
            name="people-outline"
            size={18}
            color={activeTab === "public" ? "#4A90E2" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "public" && styles.tabTextActive,
            ]}
          >
            Public Checklist
          </Text>
        </TouchableOpacity>
      </View>

      {/* Checklist List */}
      <FlatList
        data={currentChecklist}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.checklistItem}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => toggleItem(item.id)}
            >
              <View
                style={[
                  styles.checkbox,
                  item.completed && styles.checkboxChecked,
                ]}
              >
                {item.completed && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
            <View style={styles.itemContent}>
              <Text
                style={[
                  styles.itemText,
                  item.completed && styles.itemTextCompleted,
                ]}
              >
                {item.text}
              </Text>
              {activeTab === "public" && item.createdBy && (
                <Text style={styles.itemCreatedBy}>
                  Added by {item.createdBy}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeItem(item.id)}
            >
              <Ionicons name="close-circle" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#CCC" />
            <Text style={styles.emptyStateText}>
              {activeTab === "my"
                ? "No items in your checklist"
                : "No items in public checklist"}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Add items to get started
            </Text>
          </View>
        }
      />

      {/* Add Item Input */}
      <View style={styles.addItemSection}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={
              activeTab === "my"
                ? "Add to my checklist..."
                : "Add to public checklist..."
            }
            placeholderTextColor="#999"
            value={newItemText}
            onChangeText={setNewItemText}
            onSubmitEditing={addItem}
          />
          <TouchableOpacity
            style={[
              styles.addButton,
              !newItemText.trim() && styles.addButtonDisabled,
            ]}
            onPress={addItem}
            disabled={!newItemText.trim()}
          >
            <Ionicons
              name="add-circle"
              size={24}
              color={newItemText.trim() ? "#4A90E2" : "#999"}
            />
          </TouchableOpacity>
        </View>
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
  headerSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F5F7FA",
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#E8F2FF",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  tabTextActive: {
    color: "#4A90E2",
    fontWeight: "600",
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#4A90E2",
    borderColor: "#4A90E2",
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  itemTextCompleted: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  itemCreatedBy: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
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
  addItemSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  addButton: {
    padding: 4,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
});
