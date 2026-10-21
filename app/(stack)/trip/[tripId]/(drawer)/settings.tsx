import { ConfirmActionDialog } from "@/components/dialog/confirm-action";
import { DialogNewTrip } from "@/components/dialog/new-trip";
import { TitleRegular } from "@/components/title/regular";
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
import { formatDateRange } from "@/lib/helper/utils";
import {
  actionGetLocalTrip,
  actionSoftDeleteLocalTrip,
} from "@/lib/sqlite/model/trip";
import { actionPurgeLocalCompanionTrip } from "@/lib/sqlite/model/companion-access";
import { actionGetLocalUserProfile } from "@/lib/sqlite/model/user-profile";
import { actionLeaveTrip } from "@/lib/supabase/actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Info as InfoIcon,
  LogOut as LogOutIcon,
  SquarePen as SquarePenIcon,
  Trash2 as Trash2Icon,
} from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function TripSettingsScreen() {
  const { tripId: routeTripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const [isEditDialogVisible, setIsEditDialogVisible] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [isLeaveDialogVisible, setIsLeaveDialogVisible] = useState(false);
  const tripId = String(routeTripId);

  const { data: localTrip } = useQuery({
    queryKey: ["local-trip", tripId, session?.user.id],
    queryFn: () => actionGetLocalTrip(tripId, session!.user.id),
    enabled: Boolean(tripId && session?.user.id),
  });

  const isOwner = Boolean(
    localTrip && session?.user.id && localTrip.userId === session.user.id,
  );

  const { data: ownerProfile } = useQuery({
    queryKey: ["local-user-profile", localTrip?.userId],
    queryFn: () => actionGetLocalUserProfile(localTrip!.userId),
    enabled: Boolean(localTrip?.userId && !isOwner),
  });

  const softDeleteTripMutation = useMutation({
    mutationFn: () => actionSoftDeleteLocalTrip(tripId, session!.user.id),
    onSuccess: async () => {
      setIsDeleteDialogVisible(false);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["local-trip", tripId, session?.user.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["local-trips", session?.user.id],
        }),
      ]);

      router.replace("/");
    },
  });

  const leaveTripMutation = useMutation({
    mutationFn: async () => {
      await actionLeaveTrip(tripId);
      await actionPurgeLocalCompanionTrip(tripId, session!.user.id);
    },
    onSuccess: async () => {
      setIsLeaveDialogVisible(false);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["local-trip", tripId, session?.user.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["local-trips", session?.user.id],
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

  if (!localTrip) {
    return <UIText>Trip not found</UIText>;
  }

  const ownerLabel = isOwner
    ? "You"
    : ownerProfile?.username
      ? `@${ownerProfile.username}`
      : "Trip owner";

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.row}>
          <TitleRegular size="xs" color={colors.textLightGrey}>
            Name
          </TitleRegular>
          <TitleRegular size="md" weight="600" color={colors.textDarkGrey}>
            {localTrip.title}
          </TitleRegular>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <TitleRegular size="xs" color={colors.textLightGrey}>
            Dates
          </TitleRegular>
          <TitleRegular size="md" weight="600" color={colors.textDarkGrey}>
            {formatDateRange(localTrip.startDate, localTrip.endDate)}
          </TitleRegular>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <TitleRegular size="xs" color={colors.textLightGrey}>
            Owner
          </TitleRegular>
          <TitleRegular size="md" weight="600" color={colors.textDarkGrey}>
            {ownerLabel}
          </TitleRegular>
        </View>
      </View>

      {isOwner ? (
        <>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditDialogVisible(true)}
            activeOpacity={0.8}
          >
            <SquarePenIcon size={18} color={getColor(colors.purple)} />
            <TitleRegular size="sm" weight="600" color={colors.purple}>
              Edit Trip
            </TitleRegular>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setIsDeleteDialogVisible(true)}
            activeOpacity={0.8}
          >
            <Trash2Icon size={18} color={getColor(colors.red)} />
            <TitleRegular size="sm" weight="600" color={colors.red}>
              Delete Trip
            </TitleRegular>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.ownerNotice}>
            <InfoIcon size={18} color={getColor(colors.purple)} />
            <TitleRegular
              size="sm"
              color={colors.textLightGrey}
              style={styles.ownerNoticeText}
            >
              Only the trip owner can edit trip details or delete this trip.
            </TitleRegular>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setIsLeaveDialogVisible(true)}
            activeOpacity={0.8}
          >
            <LogOutIcon size={18} color={getColor(colors.red)} />
            <TitleRegular size="sm" weight="600" color={colors.red}>
              Leave Trip
            </TitleRegular>
          </TouchableOpacity>
        </>
      )}

      <DialogNewTrip
        visible={isEditDialogVisible}
        onDismiss={() => setIsEditDialogVisible(false)}
        mode="edit"
        initialTrip={{
          id: localTrip.id,
          title: localTrip.title,
          startDate: localTrip.startDate,
          endDate: localTrip.endDate,
        }}
      />
      <ConfirmActionDialog
        visible={isDeleteDialogVisible}
        title="Delete Trip"
        message="Are you sure you want to delete this trip?"
        confirmText="Delete"
        onDismiss={() => setIsDeleteDialogVisible(false)}
        onConfirm={() => {
          if (!localTrip || !session?.user.id) {
            return;
          }

          softDeleteTripMutation.mutate();
        }}
        isPending={softDeleteTripMutation.isPending}
        confirmVariant="danger"
      />
      <ConfirmActionDialog
        visible={isLeaveDialogVisible}
        title="Leave Trip"
        message="You will lose access to this trip. Pins, notes, expenses and other content you added will remain available to the trip owner and companions. The owner can invite you again later."
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
    gap: gaps.md,
    padding: gaps.md,
    backgroundColor: semanticColors.screen,
  },
  card: {
    ...getCardBasicStyle("sm"),
    gap: gaps.sm,
  },
  row: {
    gap: gaps.xxs,
  },
  divider: {
    height: 1,
    backgroundColor: getColor(colors.textLightGrey, 0.2),
  },
  editButton: {
    alignSelf: "stretch",
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: getColor(colors.purple, 0.25),
    backgroundColor: getColor(colors.purple, 0.08),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xs,
  },
  deleteButton: {
    alignSelf: "stretch",
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
  ownerNotice: {
    ...getCardBasicStyle("sm"),
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
    backgroundColor: getColor(colors.purple, 0.06),
  },
  ownerNoticeText: {
    flex: 1,
  },
});
