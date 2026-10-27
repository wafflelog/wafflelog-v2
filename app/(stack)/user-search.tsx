import { CardCompanionSearchResult } from "@/components/card/companion/search-result";
import { AppHeader } from "@/components/header/app-header";
import { HeaderCloseButton } from "@/components/header/icon-button";
import { UIText } from "@/components/ui/text";
import {
  colors,
  gaps,
  getCardBasicStyle,
  getColor,
  semanticColors,
} from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { actionGetLocalTrip } from "@/lib/sqlite/model/trip";
import {
  actionCreateTripInvitation,
  actionListPublicUsers,
} from "@/lib/supabase/actions";
import { sendTrackingEvent } from "@/lib/tracking";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const hasSearchQuery = normalizedSearchQuery.length > 0;

  const invitedUserIds = useMemo(() => {
    const fromParams = params.invitedUserIds?.split(",").filter(Boolean) ?? [];
    return Array.from(new Set([...fromParams, ...locallyInvitedUserIds]));
  }, [locallyInvitedUserIds, params.invitedUserIds]);

  const inTripUserIds = useMemo(() => {
    return params.inTripUserIds?.split(",").filter(Boolean) ?? [];
  }, [params.inTripUserIds]);

  const usersQuery = useQuery({
    queryKey: ["public-users", session?.user.id, normalizedSearchQuery],
    queryFn: () => actionListPublicUsers(normalizedSearchQuery),
    enabled: Boolean(session?.user.id && hasSearchQuery),
  });

  const inviteMutation = useMutation({
    mutationFn: (input: Parameters<typeof actionCreateTripInvitation>[0]) =>
      actionCreateTripInvitation(input),
    onSuccess: (_, variables) => {
      const invitedUser = availableUsers.find(
        (user) => user.id === variables.inviteeUserId,
      );

      void sendTrackingEvent("trip_invite_sent", {
        channel: "in_app",
      });

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

      router.back();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to invite companion";
      showMessage(message, "error");
    },
  });

  const availableUsers = hasSearchQuery
    ? (usersQuery.data ?? []).filter((user) => user.id !== session?.user.id)
    : [];

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
    <View style={styles.container}>
      <AppHeader
        title="Invite Companion"
        subtitle={params.tripTitle}
        trailing={
          <HeaderCloseButton
            accessibilityLabel="Close companion search"
            onPress={() => router.back()}
          />
        }
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior="padding"
        automaticOffset
      >
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
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={getColor(colors.paleGrey)}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          contentContainerStyle={styles.results}
          data={availableUsers}
          keyExtractor={(item) => item.id}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyState}>
              {!hasSearchQuery ? (
                <>
                  <Ionicons
                    name="person-add-outline"
                    size={56}
                    color={getColor(colors.paleGrey)}
                  />
                  <UIText style={styles.emptyStateTitle} weight="600">
                    Find your companion
                  </UIText>
                  <UIText style={styles.emptyStateDescription}>
                    Search by username to invite someone to this trip.
                  </UIText>
                </>
              ) : (
                <UIText>
                  {usersQuery.isPending
                    ? "Loading users..."
                    : "No matching usernames"}
                </UIText>
              )}
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
      </KeyboardAvoidingView>

      <SystemMessageModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.screen,
  },
  keyboardView: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: gaps.md,
    paddingTop: gaps.sm,
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
    backgroundColor: semanticColors.surface,
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
    flexGrow: 1,
    gap: gaps.md,
    padding: gaps.md,
    paddingBottom: 96,
  },
  resultCard: {
    ...getCardBasicStyle("sm"),
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: gaps.xl,
    paddingBottom: 96,
  },
  emptyStateTitle: {
    marginTop: gaps.md,
    marginBottom: gaps.xs,
    color: semanticColors.textSecondary,
    fontSize: 18,
    lineHeight: 26,
  },
  emptyStateDescription: {
    color: getColor(colors.paleGrey),
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
