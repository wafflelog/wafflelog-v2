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

interface ReferenceLink {
  id: string;
  title: string;
  url: string;
  caption?: string;
  pinId: string;
  pinName: string;
}

export default function ReferenceLinksScreen() {
  const router = useRouter();

  // Dummy data - reference links from all pins in the trip
  const links: ReferenceLink[] = [
    {
      id: "1",
      title: "Official Website",
      url: "https://sagradafamilia.org",
      caption: "Book tickets and learn about visiting hours",
      pinId: "1",
      pinName: "Sagrada Família",
    },
    {
      id: "2",
      title: "Wikipedia",
      url: "https://en.wikipedia.org/wiki/Sagrada_Família",
      caption: "Detailed history and architectural information",
      pinId: "1",
      pinName: "Sagrada Família",
    },
    {
      id: "3",
      title: "TripAdvisor Reviews",
      url: "https://tripadvisor.com/sagrada-familia",
      caption: "Read reviews and tips from other travelers",
      pinId: "1",
      pinName: "Sagrada Família",
    },
    {
      id: "4",
      title: "Park Güell Official Site",
      url: "https://parkguell.barcelona",
      caption: "Purchase tickets and view park map",
      pinId: "2",
      pinName: "Park Güell",
    },
    {
      id: "5",
      title: "Market Guide",
      url: "https://boqueria.barcelona",
      caption: "Best stalls and food recommendations",
      pinId: "3",
      pinName: "La Boqueria Market",
    },
    {
      id: "6",
      title: "Picasso Museum",
      url: "https://museupicasso.bcn.cat",
      caption: "Collection highlights and exhibition schedule",
      pinId: "5",
      pinName: "Picasso Museum",
    },
    {
      id: "7",
      title: "Beach Information",
      url: "https://barceloneta.beach",
      caption: "Beach facilities and water quality updates",
      pinId: "6",
      pinName: "Barceloneta Beach",
    },
    {
      id: "8",
      title: "Montjuïc Guide",
      url: "https://montjuic.barcelona",
      caption: "Cable car routes and viewpoints",
      pinId: "7",
      pinName: "Montjuïc Hill",
    },
    {
      id: "9",
      title: "Magic Fountain Schedule",
      url: "https://magicfountain.barcelona",
      caption: "Show times and best viewing spots",
      pinId: "8",
      pinName: "Magic Fountain",
    },
  ];

  const handleLinkPress = (link: ReferenceLink) => {
    router.push({
      pathname: "/web-viewer",
      params: { url: link.url, title: link.title },
    });
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
          <Text style={styles.headerTitle}>Reference Links</Text>
          <Text style={styles.headerSubtitle}>
            {links.length} {links.length === 1 ? "link" : "links"}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Links List */}
      <FlatList
        data={links}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => handleLinkPress(item)}
          >
            <View style={styles.linkIcon}>
              <Ionicons name="globe-outline" size={20} color="#4A90E2" />
            </View>
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle}>{item.title}</Text>
              {item.caption && (
                <Text style={styles.linkCaption}>{item.caption}</Text>
              )}
              <View style={styles.linkMeta}>
                <TouchableOpacity
                  style={styles.pinBadge}
                  onPress={() => handlePinPress(item.pinId)}
                >
                  <Ionicons name="location" size={12} color="#666" />
                  <Text style={styles.pinName}>{item.pinName}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.linkUrl} numberOfLines={1}>
                {item.url}
              </Text>
            </View>
            <Ionicons name="open-outline" size={20} color="#666" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="link-outline" size={64} color="#CCC" />
            <Text style={styles.emptyStateText}>No reference links yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add reference links from pin details
            </Text>
          </View>
        }
      />

      {/* Add Link Button */}
      <View style={styles.addLinkSection}>
        <TouchableOpacity style={styles.addLinkButton}>
          <Ionicons name="add-circle-outline" size={20} color="#4A90E2" />
          <Text style={styles.addLinkText}>Add Link</Text>
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
  listContent: {
    padding: 20,
    gap: 12,
  },
  linkItem: {
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
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  linkInfo: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  linkCaption: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    lineHeight: 18,
  },
  linkMeta: {
    marginBottom: 4,
  },
  pinBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    alignSelf: "flex-start",
  },
  pinName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  linkUrl: {
    fontSize: 12,
    color: "#999",
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
  addLinkSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  addLinkButton: {
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
  addLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A90E2",
  },
});
