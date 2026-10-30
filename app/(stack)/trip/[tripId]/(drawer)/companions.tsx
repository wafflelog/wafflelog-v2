import { ButtonFab } from "@/components/button/fab";
import { CardCompanionRegular } from "@/components/card/companion/regular";
import { ConfirmActionDialog } from "@/components/dialog/confirm-action";
import { UIText } from "@/components/ui/text";
import {
  borderRadiuses,
  colors,
  gaps,
  getCardBasicStyle,
  getColor,
  semanticColors,
} from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { actionPurgeLocalCompanionTrip } from "@/lib/sqlite/model/companion-access";
import {
  actionGetLocalTrip,
  type LocalTrip,
} from "@/lib/sqlite/model/trip";
import { actionGetLocalUserProfile } from "@/lib/sqlite/model/user-profile";
import {
  actionDisableCompanionAccess,
  actionLeaveTrip,
  actionListTripCompanions,
  actionRestoreCompanionAccess,
  actionWithdrawTripInvitation,
  type TripCompanionListItem,
} from "@/lib/supabase/actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  LogOut as LogOutIcon,
  Plus as PlusIcon,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const MAX_COMPANIONS = 10;

export default function TripCompanionsScreen() {
  const { tripId: routeTripId } = useLocalSearchParams<{
    tripId?: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuthSession();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const [isLeaveDialogVisible, setIsLeaveDialogVisible] = useState(false);
  const [companionPendingDisable, setCompanionPendingDisable] =
    useState<TripCompanionListItem | null>(null);
  const tripId = String(routeTripId ?? "");

  const { data: localTrip } = useQuery({
    queryKey: ["local-trip", tripId, session?.user.id],
    queryFn: () => actionGetLocalTrip(tripId, session!.user.id),
    enabled: Boolean(routeTripId && session?.user.id),
  });
  const isTripOwner = localTrip?.userId === session?.user.id;

  const { data: ownerProfile } = useQuery({
    queryKey: ["local-user-profile", localTrip?.userId],
    queryFn: () => actionGetLocalUserProfile(localTrip!.userId),
    enabled: Boolean(localTrip?.userId),
  });

  const companionsQuery = useQuery({
    queryKey: ["trip-companions", tripId, session?.user.id],
    queryFn: () => actionListTripCompanions(tripId),
    enabled: Boolean(tripId && session?.user.id),
  });

  const withdrawInvitationMutation = useMutation({
    mutationFn: (invitationId: string) =>
      actionWithdrawTripInvitation(invitationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["trip-companions", tripId, session?.user.id],
      });
      showMessage("Invite withdrawn", "info");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to withdraw invite";
      showMessage(message, "error");
    },
  });

  const disableCompanionMutation = useMutation({
    mutationFn: (tripMemberId: string) =>
      actionDisableCompanionAccess(tripMemberId),
    onSuccess: () => {
      setCompanionPendingDisable(null);
      void queryClient.invalidateQueries({
        queryKey: ["trip-companions", tripId, session?.user.id],
      });
      showMessage("Companion access disabled", "info");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to disable access";
      showMessage(message, "error");
    },
  });

  const restoreCompanionMutation = useMutation({
    mutationFn: (tripMemberId: string) =>
      actionRestoreCompanionAccess(tripMemberId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["trip-companions", tripId, session?.user.id],
      });
      showMessage("Companion access restored", "info");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to restore access";
      showMessage(message, "error");
    },
  });

  const leaveTripMutation = useMutation({
    mutationFn: async () => {
      await actionLeaveTrip(tripId);
      await actionPurgeLocalCompanionTrip(tripId, session!.user.id);
    },
    onSuccess: async () => {
      setIsLeaveDialogVisible(false);

      queryClient.setQueryData<LocalTrip[]>(
        ["local-trips", session?.user.id],
        (trips) => trips?.filter((trip) => trip.id !== tripId),
      );
      queryClient.removeQueries({ queryKey: ["local-trip", tripId] });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["local-trips", session?.user.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["trip-companions", tripId, session?.user.id],
        }),
      ]);

      router.replace("/");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to leave this trip";
      showMessage(message, "error");
    },
  });

  const trip = {
    id: tripId,
    title: localTrip?.title ?? "Barcelona Getaway",
  };

  const companions = useMemo(
    () => companionsQuery.data ?? [],
    [companionsQuery.data],
  );

  const activeCompanionCount = useMemo(() => {
    return companions.filter((companion) =>
      ["ACCEPTED", "INVITED"].includes(companion.state),
    ).length;
  }, [companions]);

  const invitedUserIds = useMemo(() => {
    return companions
      .filter((companion) => companion.state === "INVITED")
      .map((companion) => companion.userId)
      .join(",");
  }, [companions]);

  const inTripUserIds = useMemo(() => {
    return companions
      .filter((companion) => companion.state === "ACCEPTED")
      .map((companion) => companion.userId)
      .join(",");
  }, [companions]);

  const handleCompanionAction = (companion: TripCompanionListItem) => {
    if (!isTripOwner) {
      return;
    }

    switch (companion.state) {
      case "INVITED":
        if (!companion.tripInvitationId) {
          showMessage("Invite not found", "error");
          return;
        }

        withdrawInvitationMutation.mutate(companion.tripInvitationId);
        return;
      case "ACCEPTED":
        if (!companion.tripMemberId) {
          showMessage("Companion not found", "error");
          return;
        }

        setCompanionPendingDisable(companion);
        return;
      default:
        return;
    }
  };

  const handleRestoreAccess = (companion: TripCompanionListItem) => {
    if (!isTripOwner || companion.state !== "DISABLED") {
      return;
    }

    if (!companion.tripMemberId) {
      showMessage("Companion not found", "error");
      return;
    }

    restoreCompanionMutation.mutate(companion.tripMemberId);
  };

  if (!trip.id) {
    return <UIText>Trip not found</UIText>;
  }

  const ownerUsername =
    ownerProfile?.username ??
    (isTripOwner ? session?.user.user_metadata.username : null) ??
    "Trip owner";

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.companions}
        data={companions}
        keyExtractor={(item) => item.id}
        alwaysBounceVertical
        refreshControl={
          <RefreshControl
            refreshing={companionsQuery.isRefetching}
            onRefresh={() => {
              void companionsQuery.refetch();
            }}
            tintColor={getColor(colors.purple)}
            colors={[getColor(colors.purple)]}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerStack}>
            <View style={styles.summaryCard}>
              <Text style={styles.eyebrow}>Companion access</Text>
              <Text style={styles.title}>{trip.title}</Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{activeCompanionCount}</Text>
                  <Text style={styles.statLabel}>active</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{MAX_COMPANIONS}</Text>
                  <Text style={styles.statLabel}>max</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue} numberOfLines={1}>
                    {ownerUsername}
                  </Text>
                  <Text style={styles.statLabel}>owner</Text>
                </View>
              </View>
            </View>

            {/* TODO: Restore the invite-link card when Universal Links/App Links
                and the shareable join-request flow are implemented.
            <View style={styles.inviteLinkCard}>
              <View style={styles.inviteLinkIcon}>
                <LinkIcon size={20} color={getColor(colors.purple)} />
              </View>
              <View style={styles.inviteLinkContent}>
                <Text style={styles.inviteLinkTitle}>Invite link</Text>
                <Text style={styles.inviteLinkText}>wafflelog.app/invite/barcelona-7d</Text>
              </View>
              <TouchableOpacity
                style={styles.smallAction}
                onPress={() => {
                  showMessage("Prototype invite link copied", "info");
                }}
              >
                <CopyIcon size={16} color={getColor(colors.white)} />
              </TouchableOpacity>
            </View>
            */}
          </View>
        }
        ListEmptyComponent={
          companionsQuery.isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={getColor(colors.purple)} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No companions yet</Text>
              <Text style={styles.emptyText}>Invite someone to co-edit this trip.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View key={item.id} style={styles.companion}>
            <CardCompanionRegular
              companion={item}
              showStateBadge={item.state !== "ACCEPTED"}
              showRemoveButton={
                isTripOwner &&
                (item.state === "INVITED" || item.state === "ACCEPTED")
              }
              showRestoreButton={isTripOwner && item.state === "DISABLED"}
              onRemove={() => {
                handleCompanionAction(item);
              }}
              onRestore={() => {
                handleRestoreAccess(item);
              }}
            />
          </View>
        )}
        ListFooterComponent={
          !isTripOwner ? (
            <View style={styles.leaveSection}>
              <TouchableOpacity
                style={styles.leaveButton}
                onPress={() => setIsLeaveDialogVisible(true)}
                activeOpacity={0.8}
              >
                <LogOutIcon size={18} color={getColor(colors.red)} />
                <Text style={styles.leaveButtonText}>Leave trip</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
      {isTripOwner ? (
        <ButtonFab
          onPress={() => {
            if (activeCompanionCount >= MAX_COMPANIONS) {
              showMessage(
                `You can invite up to ${MAX_COMPANIONS} companions`,
                "error",
              );
              return;
            }

            router.push({
              pathname: "/user-search",
              params: {
                tripId: trip.id,
                invitedUserIds,
                inTripUserIds,
                tripTitle: trip.title,
              },
            });
          }}
          text="Invite companion"
          icon={(color) => <PlusIcon size={20} color={color} />}
        />
      ) : null}
      <ConfirmActionDialog
        visible={Boolean(companionPendingDisable)}
        title="Disable access?"
        message={`${companionPendingDisable?.fullname ?? "This companion"} will lose access to this trip. Their existing contributions will remain, and you can restore their access later.`}
        confirmText="Disable access"
        onDismiss={() => setCompanionPendingDisable(null)}
        onConfirm={() => {
          if (companionPendingDisable?.tripMemberId) {
            disableCompanionMutation.mutate(
              companionPendingDisable.tripMemberId,
            );
          }
        }}
        isPending={disableCompanionMutation.isPending}
        confirmVariant="danger"
      />
      <ConfirmActionDialog
        visible={isLeaveDialogVisible}
        title="Leave Trip"
        message="You will lose access to this trip. Pins, notes, expenses and other content you added will remain available to the trip owner and companions."
        confirmText="Leave Trip"
        onDismiss={() => setIsLeaveDialogVisible(false)}
        onConfirm={() => leaveTripMutation.mutate()}
        isPending={leaveTripMutation.isPending}
        confirmVariant="danger"
      />
      <SystemMessageModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.screen,
  },
  companions: {
    gap: gaps.md,
    padding: gaps.md,
    paddingBottom: 96,
  },
  headerStack: {
    gap: gaps.md,
  },
  summaryCard: {
    ...getCardBasicStyle("md"),
    gap: gaps.sm,
  },
  eyebrow: {
    color: getColor(colors.purple),
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    color: getColor(colors.textDarkGrey),
    fontSize: 22,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: gaps.sm,
  },
  stat: {
    flex: 1,
    borderRadius: borderRadiuses.sm,
    backgroundColor: getColor(colors.whiteGrey, 0.3),
    padding: gaps.sm,
  },
  statValue: {
    color: getColor(colors.textDarkGrey),
    fontSize: 16,
    fontWeight: "700",
  },
  statLabel: {
    color: getColor(colors.textLightGrey),
    fontSize: 12,
    marginTop: 2,
  },
  inviteLinkCard: {
    ...getCardBasicStyle("sm"),
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
  },
  inviteLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.purple, 0.12),
  },
  inviteLinkContent: {
    flex: 1,
  },
  inviteLinkTitle: {
    color: getColor(colors.textDarkGrey),
    fontSize: 14,
    fontWeight: "700",
  },
  inviteLinkText: {
    color: getColor(colors.textLightGrey),
    fontSize: 12,
    marginTop: 2,
  },
  smallAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.purple),
  },
  companion: {
    ...getCardBasicStyle("sm"),
    gap: gaps.xs,
  },
  leaveSection: {
    paddingTop: gaps.md,
  },
  leaveButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: getColor(colors.red, 0.25),
    backgroundColor: getColor(colors.red, 0.08),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xs,
  },
  leaveButtonText: {
    color: getColor(colors.red),
    fontSize: 14,
    fontWeight: "600",
  },
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: gaps.xl,
  },
  emptyState: {
    ...getCardBasicStyle("sm"),
    alignItems: "center",
    gap: gaps.xs,
  },
  emptyTitle: {
    color: getColor(colors.textDarkGrey),
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    color: getColor(colors.textLightGrey),
    fontSize: 13,
    textAlign: "center",
  },
});
