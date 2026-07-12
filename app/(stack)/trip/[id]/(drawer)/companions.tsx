import { ButtonFab } from "@/components/button/fab";
import { CardCompanionRegular } from "@/components/card/companion/regular";
import { UIText } from "@/components/ui/text";
import { borderRadiuses, colors, gaps, getCardBasicStyle, getColor } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { actionGetLocalTrip } from "@/lib/sqlite/model/trip";
import {
  actionDisableCompanionAccess,
  actionListTripCompanions,
  actionWithdrawTripInvitation,
  type TripCompanionListItem,
} from "@/lib/supabase/actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Copy as CopyIcon,
  Link as LinkIcon,
  Plus as PlusIcon,
} from "lucide-react-native";
import { useMemo } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const MAX_COMPANIONS = 10;

export default function TripCompanionsScreen() {
  const { id } = useLocalSearchParams<{
    id?: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuthSession();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const tripId = String(id ?? "");

  const { data: localTrip } = useQuery({
    queryKey: ["local-trip", tripId, session?.user.id],
    queryFn: () => actionGetLocalTrip(tripId, session!.user.id),
    enabled: Boolean(id && session?.user.id),
  });

  const companionsQuery = useQuery({
    queryKey: ["trip-companions", tripId, session?.user.id],
    queryFn: () => actionListTripCompanions(tripId),
    enabled: Boolean(tripId && session?.user.id),
  });

  const withdrawInvitationMutation = useMutation({
    mutationFn: actionWithdrawTripInvitation,
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
    mutationFn: actionDisableCompanionAccess,
    onSuccess: () => {
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

  const trip = {
    id: tripId,
    title: localTrip?.title ?? "Barcelona Getaway",
  };

  const companions = useMemo(() => companionsQuery.data ?? [], [companionsQuery.data]);

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
      .filter((companion) =>
        ["ACCEPTED", "DISABLED"].includes(companion.state),
      )
      .map((companion) => companion.userId)
      .join(",");
  }, [companions]);

  const handleCompanionAction = (companion: TripCompanionListItem) => {
    if (companion.state === "INVITED") {
      if (!companion.tripInvitationId) {
        showMessage("Invite not found", "error");
        return;
      }

      withdrawInvitationMutation.mutate(companion.tripInvitationId);
      return;
    }

    if (companion.state === "ACCEPTED") {
      if (!companion.tripMemberId) {
        showMessage("Companion not found", "error");
        return;
      }

      disableCompanionMutation.mutate(companion.tripMemberId);
      return;
    }

    showMessage(`${companion.fullname} has disabled access`, "info");
  };

  if (!trip.id) {
    return <UIText>Trip not found</UIText>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.companions}
        data={companions}
        keyExtractor={(item) => item.id}
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
                  <Text style={styles.statValue}>owner</Text>
                  <Text style={styles.statLabel}>admin</Text>
                </View>
              </View>
            </View>

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
              showRemoveButton={item.state === "INVITED" || item.state === "ACCEPTED"}
              onRemove={() => {
                handleCompanionAction(item);
              }}
            />
          </View>
        )}
      />
      <ButtonFab
        onPress={() => {
          if (activeCompanionCount >= MAX_COMPANIONS) {
            showMessage(`You can invite up to ${MAX_COMPANIONS} companions`, "error");
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
      <SystemMessageModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.purple),
  },
  companion: {
    ...getCardBasicStyle("sm"),
    gap: gaps.xs,
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
