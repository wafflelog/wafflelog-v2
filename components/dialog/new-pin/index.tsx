import { IconPinCategory } from "@/components/icon/pin-category";
import { Dialog } from "@/components/ui/dialog";
import { UIInputDate } from "@/components/ui/input/date";
import { UIInputSelect } from "@/components/ui/input/select";
import { UIInputText } from "@/components/ui/input/text";
import { UIInputTime } from "@/components/ui/input/time";
import { CATEGORIES } from "@/constants/pin-categories";
import { gaps } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import {
  actionCreateLocalPin,
  actionSyncLocalPin,
  actionUpdateLocalPin,
} from "@/lib/sqlite/model/pin";
import { formatDate } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { newPinFormSchema } from "./schema";

type DialogNewPinProps = {
  tripId: string;
  tripStartDate: string;
  tripEndDate: string;
  visible: boolean;
  onDismiss: () => void;
  mode?: "create" | "edit";
  initialPin?: {
    id: string;
    name: string;
    date: string;
    time: string;
    categoryId: string;
  };
};

export const DialogNewPin = ({
  tripId,
  tripStartDate,
  tripEndDate,
  visible,
  onDismiss,
  mode = "create",
  initialPin,
}: DialogNewPinProps) => {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const [pinName, setPinName] = useState("");
  const [pinDate, setPinDate] = useState("");
  const [pinTime, setPinTime] = useState("");
  const [pinCategoryId, setPinCategoryId] = useState("");
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (isEditMode && initialPin) {
      setPinName(initialPin.name);
      setPinDate(initialPin.date);
      setPinTime(initialPin.time);
      setPinCategoryId(initialPin.categoryId);
      return;
    }

    setPinName("");
    setPinDate("");
    setPinTime("");
    setPinCategoryId("");
  }, [visible, isEditMode, initialPin]);

  const createPinMutation = useMutation({
    mutationFn: actionCreateLocalPin,
    onSuccess: async (localPin) => {
      if (session?.user.id) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["local-pins", tripId, pinDate, session.user.id],
          }),
          queryClient.invalidateQueries({
            queryKey: ["local-pins", tripId, session.user.id],
          }),
        ]);
      }
      setPinName("");
      setPinDate("");
      setPinTime("");
      setPinCategoryId("");
      onDismiss();
      showMessage("Pin saved locally", "info");

      try {
        await actionSyncLocalPin(localPin);

        if (session?.user.id) {
          await queryClient.invalidateQueries({
            queryKey: ["local-pins", tripId, session.user.id],
          });
        }
      } catch (error) {
        console.error("Error syncing new pin:", error);
      }
    },
    onError: (error) => {
      console.error("Error creating pin:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create pin";
      showMessage(message, "error");
    },
  });

  const updatePinMutation = useMutation({
    mutationFn: actionUpdateLocalPin,
    onSuccess: async (localPin) => {
      if (session?.user.id && initialPin) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["local-pin", localPin.id, session.user.id],
          }),
          queryClient.invalidateQueries({
            queryKey: ["local-pins", tripId, initialPin.date, session.user.id],
          }),
          queryClient.invalidateQueries({
            queryKey: ["local-pins", tripId, localPin.date, session.user.id],
          }),
          queryClient.invalidateQueries({
            queryKey: ["local-pins", tripId, session.user.id],
          }),
          queryClient.invalidateQueries({
            queryKey: ["local-pin-locations"],
          }),
        ]);
      }

      onDismiss();
      showMessage("Pin updated locally", "info");

      try {
        await actionSyncLocalPin(localPin);

        if (session?.user.id) {
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ["local-pin", localPin.id, session.user.id],
            }),
            queryClient.invalidateQueries({
              queryKey: ["local-pins", tripId, session.user.id],
            }),
          ]);
        }
      } catch (error) {
        console.error("Error syncing updated pin:", error);
      }
    },
    onError: (error) => {
      console.error("Error updating pin:", error);
      const message =
        error instanceof Error ? error.message : "Failed to update pin";
      showMessage(message, "error");
    },
  });

  const handleConfirm = () => {
    if (!session?.user.id) {
      showMessage("You must be signed in to create a pin", "error");
      return;
    }

    const result = newPinFormSchema.safeParse({
      pinName,
      pinDate,
      pinTime,
      pinCategoryId,
    });

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        "Check your pin details and try again.";
      showMessage(message, "error");
      return;
    }

    const pinDateValue = dayjs(result.data.pinDate);
    const tripStartDateValue = dayjs(tripStartDate);
    const tripEndDateValue = dayjs(tripEndDate);

    if (
      pinDateValue.isBefore(tripStartDateValue, "day") ||
      pinDateValue.isAfter(tripEndDateValue, "day")
    ) {
      showMessage(
        `Choose a date between ${formatDate(tripStartDate)} and ${formatDate(tripEndDate)}`,
        "error",
      );
      return;
    }

    if (isEditMode) {
      if (!initialPin) {
        showMessage("Pin not found", "error");
        return;
      }

      updatePinMutation.mutate({
        id: initialPin.id,
        userId: session.user.id,
        name: result.data.pinName,
        date: result.data.pinDate,
        time: result.data.pinTime,
        categoryId: result.data.pinCategoryId,
      });
      return;
    }

    createPinMutation.mutate({
      tripId,
      userId: session.user.id,
      name: result.data.pinName,
      date: result.data.pinDate,
      time: result.data.pinTime,
      categoryId: result.data.pinCategoryId,
    });
  };

  return (
    <>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        title={isEditMode ? "Edit Pin" : "New Pin"}
        size="md"
        confirmText={isEditMode ? "Save" : "Create"}
        onConfirm={handleConfirm}
      >
        <View style={styles.content}>
          <UIInputText
            placeholder="Enter pin name"
            value={pinName}
            onChange={setPinName}
            autoFocus
          />
          <UIInputDate
            placeholder="Enter pin date"
            value={pinDate}
            onChange={setPinDate}
            minimumDate={dayjs(tripStartDate).toDate()}
            maximumDate={dayjs(tripEndDate).toDate()}
          />
          <UIInputTime
            placeholder="Enter pin time"
            value={pinTime}
            onChange={setPinTime}
          />
          <UIInputSelect
            selectedValue={pinCategoryId}
            options={CATEGORIES.map((category) => ({
              label: category.name,
              value: category.id,
              icon: (color) => (
                <IconPinCategory category={category} color={color} size={20} />
              ),
            }))}
            onValueChange={setPinCategoryId}
            placeholder="Select pin category"
          />
        </View>
        <SystemMessageModal />
      </Dialog>
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: gaps.sm,
  },
});
