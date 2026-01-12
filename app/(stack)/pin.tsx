import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PinScreen() {
  const router = useRouter();

  // Dummy data
  const pinData = {
    name: "Sagrada Família",
    category: "Attraction",
    time: "09:00 AM",
    date: "Mar 10, 2024",
    address: "Carrer de Mallorca, 401, 08013 Barcelona, Spain",
    description:
      "A stunning basilica designed by Antoni Gaudí, one of Barcelona's most iconic landmarks.",
    attendees: [
      { id: 1, name: "Sarah", initial: "S" },
      { id: 2, name: "Mike", initial: "M" },
      { id: 3, name: "Jessica", initial: "J" },
      { id: 4, name: "David", initial: "D" },
    ],
    expenses: [
      {
        id: 1,
        description: "Entrance Ticket",
        amount: 26,
        currency: "EUR",
        paidBy: "Sarah",
      },
      {
        id: 2,
        description: "Audio Guide",
        amount: 7,
        currency: "EUR",
        paidBy: "Mike",
      },
      {
        id: 3,
        description: "Taxi to location",
        amount: 12,
        currency: "EUR",
        paidBy: "Jessica",
      },
    ],
    images: [
      { id: 1, url: "placeholder" },
      { id: 2, url: "placeholder" },
      { id: 3, url: "placeholder" },
    ],
    documents: [
      { id: 1, name: "Tickets.pdf", type: "pdf" },
      { id: 2, name: "Map.pdf", type: "pdf" },
    ],
    links: [
      { id: 1, title: "Official Website", url: "https://sagradafamilia.org" },
      {
        id: 2,
        title: "Wikipedia",
        url: "https://en.wikipedia.org/wiki/Sagrada_Família",
      },
      {
        id: 3,
        title: "TripAdvisor Reviews",
        url: "https://tripadvisor.com/sagrada-familia",
      },
    ],
    notes:
      "Make sure to book tickets in advance online to avoid long queues. The audio guide is highly recommended for understanding the architecture. Best time to visit is early morning for better lighting and fewer crowds.",
  };

  const totalExpenses = pinData.expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

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
          <Text style={styles.headerTitle}>Pin Details</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Mini Map View */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={60} color="#999" />
            <Text style={styles.mapPlaceholderText}>Map View</Text>
          </View>
          {/* Map Pin */}
          <View style={styles.mapPin}>
            <View style={styles.mapPinIcon}>
              <Ionicons name="location" size={28} color="#4A90E2" />
            </View>
            <View style={styles.mapPinLabel}>
              <Text style={styles.mapPinLabelText}>{pinData.name}</Text>
            </View>
          </View>
        </View>

        {/* Pin Basic Info */}
        <View style={styles.section}>
          <View style={styles.pinHeader}>
            <View style={styles.pinTitleContainer}>
              <Text style={styles.pinName}>{pinData.name}</Text>
              <View style={styles.categoryBadge}>
                <Ionicons name="pricetag-outline" size={14} color="#4A90E2" />
                <Text style={styles.categoryText}>{pinData.category}</Text>
              </View>
            </View>
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.timeText}>{pinData.time}</Text>
            </View>
          </View>
          <Text style={styles.description}>{pinData.description}</Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color="#4A90E2" />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          <View style={styles.locationCard}>
            <Text style={styles.address}>{pinData.address}</Text>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => router.push(`/place-search`)}
            >
              <Ionicons name="map-outline" size={18} color="#4A90E2" />
              <Text style={styles.mapButtonText}>Open in Maps</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Who's Going */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={20} color="#4A90E2" />
            <Text style={styles.sectionTitle}>Who&apos;s Going</Text>
            <Text style={styles.attendeeCount}>
              {pinData.attendees.length} people
            </Text>
          </View>
          <View style={styles.attendeesContainer}>
            {pinData.attendees.map((attendee) => (
              <TouchableOpacity
                key={attendee.id}
                onPress={() => router.push(`/user`)}
              >
                <View key={attendee.id} style={styles.attendeeCard}>
                  <View style={styles.attendeeAvatar}>
                    <Text style={styles.attendeeAvatarText}>
                      {attendee.initial}
                    </Text>
                  </View>
                  <Text style={styles.attendeeName}>{attendee.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Expenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash-outline" size={20} color="#4A90E2" />
            <Text style={styles.sectionTitle}>Expenses</Text>
            <Text style={styles.totalExpenses}>
              Total: {totalExpenses} {pinData.expenses[0]?.currency}
            </Text>
          </View>
          <View style={styles.expensesList}>
            {pinData.expenses.map((expense) => (
              <View key={expense.id} style={styles.expenseItem}>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDescription}>
                    {expense.description}
                  </Text>
                  <Text style={styles.expensePaidBy}>
                    Paid by {expense.paidBy}
                  </Text>
                </View>
                <Text style={styles.expenseAmount}>
                  {expense.amount} {expense.currency}
                </Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.addExpenseButton}>
            <Ionicons name="add-circle-outline" size={20} color="#4A90E2" />
            <Text style={styles.addExpenseText}>Add Expense</Text>
          </TouchableOpacity>
        </View>

        {/* Images */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="images-outline" size={20} color="#4A90E2" />
            <Text style={styles.sectionTitle}>Images</Text>
            <Text style={styles.imageCount}>
              {pinData.images.length} photos
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imagesScroll}
            contentContainerStyle={styles.imagesContainer}
          >
            {pinData.images.map((image) => (
              <TouchableOpacity key={image.id} style={styles.imageCard}>
                <View style={styles.imageThumbnail}>
                  <Ionicons name="image-outline" size={40} color="#999" />
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addImageButton}>
              <Ionicons name="add-circle" size={40} color="#4A90E2" />
              <Text style={styles.addImageText}>Add Photo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color="#4A90E2" />
            <Text style={styles.sectionTitle}>Documents</Text>
            <Text style={styles.documentCount}>
              {pinData.documents.length} files
            </Text>
          </View>
          <View style={styles.documentsList}>
            {pinData.documents.map((doc) => (
              <TouchableOpacity key={doc.id} style={styles.documentItem}>
                <View style={styles.documentIcon}>
                  <Ionicons name="document" size={24} color="#4A90E2" />
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>{doc.name}</Text>
                  <Text style={styles.documentType}>
                    {doc.type.toUpperCase()} Document
                  </Text>
                </View>
                <Ionicons name="download-outline" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.addDocumentButton}>
            <Ionicons name="add-circle-outline" size={20} color="#4A90E2" />
            <Text style={styles.addDocumentText}>Add Document</Text>
          </TouchableOpacity>
        </View>

        {/* Reference Links */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="link-outline" size={20} color="#4A90E2" />
            <Text style={styles.sectionTitle}>Reference Links</Text>
          </View>
          <View style={styles.linksList}>
            {pinData.links.map((link) => (
              <TouchableOpacity key={link.id} style={styles.linkItem}>
                <View style={styles.linkIcon}>
                  <Ionicons name="globe-outline" size={20} color="#4A90E2" />
                </View>
                <View style={styles.linkInfo}>
                  <Text style={styles.linkTitle}>{link.title}</Text>
                  <Text style={styles.linkUrl} numberOfLines={1}>
                    {link.url}
                  </Text>
                </View>
                <Ionicons name="open-outline" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.addLinkButton}>
            <Ionicons name="add-circle-outline" size={20} color="#4A90E2" />
            <Text style={styles.addLinkText}>Add Link</Text>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="create-outline" size={20} color="#4A90E2" />
            <Text style={styles.sectionTitle}>Notes</Text>
          </View>
          <View style={styles.notesCard}>
            <Text style={styles.notesText}>{pinData.notes}</Text>
          </View>
          <TouchableOpacity
            style={styles.editNotesButton}
            onPress={() => router.push(`/comments`)}
          >
            <Ionicons name="pencil-outline" size={18} color="#4A90E2" />
            <Text style={styles.editNotesText}>Edit Notes</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  moreButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  mapContainer: {
    width: "100%",
    height: 250,
    backgroundColor: "#E8F5E9",
    position: "relative",
  },
  mapPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  mapPin: {
    position: "absolute",
    top: 100,
    left: "50%",
    marginLeft: -24,
    alignItems: "center",
  },
  mapPinIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  mapPinLabel: {
    marginTop: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  mapPinLabelText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  pinHeader: {
    marginBottom: 12,
  },
  pinTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  pinName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A90E2",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  description: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  locationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  address: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  mapButtonText: {
    fontSize: 14,
    color: "#4A90E2",
    fontWeight: "600",
  },
  attendeeCount: {
    fontSize: 14,
    color: "#666",
  },
  attendeesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  attendeeCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    minWidth: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  attendeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  attendeeAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  attendeeName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
  totalExpenses: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A90E2",
  },
  expensesList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  expensePaidBy: {
    fontSize: 12,
    color: "#999",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  addExpenseButton: {
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
  addExpenseText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A90E2",
  },
  imageCount: {
    fontSize: 14,
    color: "#666",
  },
  imagesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  imagesContainer: {
    gap: 12,
  },
  imageCard: {
    marginRight: 12,
  },
  imageThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  addImageText: {
    fontSize: 12,
    color: "#4A90E2",
    marginTop: 4,
    fontWeight: "500",
  },
  documentCount: {
    fontSize: 14,
    color: "#666",
  },
  documentsList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  documentType: {
    fontSize: 12,
    color: "#999",
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
  linksList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  linkInfo: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  linkUrl: {
    fontSize: 12,
    color: "#999",
  },
  addLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
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
  notesCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesText: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },
  editNotesButton: {
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
  editNotesText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A90E2",
  },
  bottomSpacing: {
    height: 24,
  },
});
