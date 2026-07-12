import { CardCompanionSearchResult } from "@/components/card/companion/search-result";
import { UIText } from "@/components/ui/text";
import { colors, gaps, getCardBasicStyle, getColor } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { actionGetLocalTrip } from "@/lib/sqlite/model/trip";
import {
  actionCreateTripInvitation,
  actionListPublicUsers,
} from "@/lib/supabase/actions";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export default function UserSearchScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuthSession();
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

  const usersQuery = useQuery({
    queryKey: ["public-users", session?.user.id, searchQuery.trim().toLowerCase()],
    queryFn: () => actionListPublicUsers(searchQuery),
    enabled: Boolean(session?.user.id),
  });

  const inviteMutation = useMutation({
    mutationFn: actionCreateTripInvitation,
    onSuccess: (_, variables) => {
      const invitedUser = availableUsers.find(
        (user) => user.id === variables.inviteeUserId,
      );

      setLocallyInvitedUserIds((currentUserIds) =>
        currentUserIds.includes(variables.inviteeUserId)
          ? currentUserIds
          : [...currentUserIds, variables.inviteeUserId],
      );

      void queryClient.invalidateQueries({
        queryKey: ["trip-invitations", params.tripId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["trip-companions", params.tripId],
      });

      showMessage(
        `Invite sent to ${invitedUser?.username ?? "companion"}`,
        "info",
      );

      router.replace({
        pathname: "/(stack)/trip/[id]/(drawer)/companions",
        params: {
          id: params.tripId ?? "",
          invitedUserId: variables.inviteeUserId,
          invitedUserName: invitedUser?.username ?? "",
        },
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to invite companion";
      showMessage(message, "error");
    },
  });

  const availableUsers = useMemo(() => {
    const publicUsers = usersQuery.data ?? [];

    return publicUsers.filter((user) => user.id !== session?.user.id);
  }, [session?.user.id, usersQuery.data]);

  const handleInviteUser = async (user: { id: string; username: string }) => {
    if (invitedUserIds.length + inTripUserIds.length >= MAX_COMPANIONS) {
      showMessage(`You can invite up to ${MAX_COMPANIONS} companions`, "error");
      return;
    }

    if (!params.tripId || !session?.user.id) {
      showMessage("Unable to invite companion right now", "error");
      return;
    }

    const localTrip = await actionGetLocalTrip(params.tripId, session.user.id);

    if (!localTrip || localTrip.syncStatus !== "synced") {
      showMessage("Trip is still syncing. Please try again in a moment.", "error");
      return;
    }

    inviteMutation.mutate({
      tripId: localTrip.id,
      inviteeUserId: user.id,
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
            <UIText>
              {usersQuery.isPending ? "Loading users..." : "No matching usernames"}
            </UIText>
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
                void handleInviteUser(item);
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
