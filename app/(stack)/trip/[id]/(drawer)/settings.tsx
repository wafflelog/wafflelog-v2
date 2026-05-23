import { ConfirmActionDialog } from "@/components/dialog/confirm-action";
import { DialogNewTrip } from "@/components/dialog/new-trip";
import { TitleRegular } from "@/components/title/regular";
import { UIText } from "@/components/ui/text";
import { colors, gaps, getCardBasicStyle, getColor } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import {
  actionGetLocalTrip,
  actionSoftDeleteLocalTrip,
} from "@/lib/sqlite/model/trip";
import { formatDateRange } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  SquarePen as SquarePenIcon,
  Trash2 as Trash2Icon,
} from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function TripSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const [isEditDialogVisible, setIsEditDialogVisible] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const tripId = String(id);

  const { data: localTrip } = useQuery({
    queryKey: ["local-trip", tripId, session?.user.id],
    queryFn: () => actionGetLocalTrip(tripId, session!.user.id),
    enabled: Boolean(tripId && session?.user.id),
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

  if (!localTrip) {
    return <UIText>Trip not found</UIText>;
  }

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
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: gaps.md,
    padding: gaps.md,
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
});
