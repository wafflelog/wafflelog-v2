import { CardCompanionSearchResult } from "@/components/card/companion/search-result";
import { UIText } from "@/components/ui/text";
import { colors, gaps, getCardBasicStyle, getColor } from "@/constants/theme";
import { useSystemMessage } from "@/hook/use-system-message";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MAX_COMPANIONS = 10;

const prototypeUsers = [
  {
    id: "proto-maya",
    username: "maya.miles",
  },
  {
    id: "proto-eli",
    username: "eli_eats",
  },
  {
    id: "proto-jules",
    username: "jules.windowseat",
  },
  {
    id: "proto-rina",
    username: "rina_routes",
  },
  {
    id: "proto-omar",
    username: "omar.on.the.go",
  },
  {
    id: "proto-claire",
    username: "claire_carryon",
  },
];

export default function UserSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    tripId?: string;
    invitedUserIds?: string;
    inTripUserIds?: string;
    tripTitle?: string;
  }>();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const [searchQuery, setSearchQuery] = useState("");
  const [locallyInvitedUserIds, setLocallyInvitedUserIds] = useState<string[]>([]);

  const invitedUserIds = useMemo(() => {
    const fromParams = params.invitedUserIds?.split(",").filter(Boolean) ?? [];
    return Array.from(new Set([...fromParams, ...locallyInvitedUserIds]));
  }, [locallyInvitedUserIds, params.invitedUserIds]);

  const inTripUserIds = useMemo(() => {
    return params.inTripUserIds?.split(",").filter(Boolean) ?? [];
  }, [params.inTripUserIds]);

  const availableUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return prototypeUsers;
    }

    return prototypeUsers.filter((user) =>
      user.username.toLowerCase().includes(normalizedQuery),
    );
  }, [searchQuery]);

  const handleInviteUser = (user: { id: string; username: string }) => {
    if (invitedUserIds.length + inTripUserIds.length >= MAX_COMPANIONS) {
      showMessage(`You can invite up to ${MAX_COMPANIONS} companions`, "error");
      return;
    }

    setLocallyInvitedUserIds((currentUserIds) =>
      currentUserIds.includes(user.id) ? currentUserIds : [...currentUserIds, user.id],
    );

    showMessage(`Prototype invite sent to ${user.username}`, "info");

    router.replace({
      pathname: "/(stack)/trip/[id]/(drawer)/companions",
      params: {
        id: params.tripId ?? "prototype-trip",
        invitedUserId: user.id,
        invitedUserName: user.username,
      },
    });
  };

  const getUserState = (userId: string) => {
    if (inTripUserIds.includes(userId)) {
      return "in_trip";
    }

    if (invitedUserIds.includes(userId)) {
      return "invited";
    }

    return "invite";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={getColor(colors.textDarkGrey)} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Invite Companion</Text>
          {params.tripTitle ? (
            <Text style={styles.headerSubtitle}>{params.tripTitle}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color={getColor(colors.textDarkGrey)} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={getColor(colors.textLightGrey)}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username"
            placeholderTextColor={getColor(colors.paleGrey)}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
              }}
            >
              <Ionicons name="close-circle" size={20} color={getColor(colors.paleGrey)} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        contentContainerStyle={styles.results}
        data={availableUsers}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <UIText>No matching usernames</UIText>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.resultCard}>
            <CardCompanionSearchResult
              user={{
                id: item.id,
                fullname: item.username,
              }}
              state={getUserState(item.id)}
              onPress={() => {
                handleInviteUser(item);
              }}
            />
          </View>
        )}
      />

      <SystemMessageModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: gaps.md,
    paddingVertical: gaps.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    gap: gaps.xxs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: getColor(colors.textDarkGrey),
  },
  headerSubtitle: {
    fontSize: 13,
    color: getColor(colors.textLightGrey),
  },
  searchContainer: {
    paddingHorizontal: gaps.md,
    paddingBottom: gaps.sm,
    gap: gaps.xs,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey),
    borderRadius: 12,
    paddingHorizontal: gaps.sm,
    paddingVertical: gaps.xs,
    backgroundColor: "white",
  },
  searchIcon: {
    marginRight: gaps.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: getColor(colors.textDarkGrey),
  },
  results: {
    gap: gaps.md,
    padding: gaps.md,
    paddingBottom: 96,
  },
  resultCard: {
    ...getCardBasicStyle("sm"),
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: gaps.xl,
  },
});
