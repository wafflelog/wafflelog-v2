import { IconPinCategory } from "@/components/icon/pin-category";
import { Dialog } from "@/components/ui/dialog";
import { UIInputDate } from "@/components/ui/input/date";
import { UIInputSelect } from "@/components/ui/input/select";
import { UIInputText } from "@/components/ui/input/text";
import { UIInputTime } from "@/components/ui/input/time";
import { gaps } from "@/constants/theme";
import { CATEGORIES } from "@/constants/pin-categories";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import {
  actionCreateLocalPin,
  actionSyncLocalPin,
} from "@/lib/sqlite/model/pin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { newPinFormSchema } from "./schema";

type DialogNewPinProps = {
  tripId: string;
  visible: boolean;
  onDismiss: () => void;
};

export const DialogNewPin = ({
  tripId,
  visible,
  onDismiss,
}: DialogNewPinProps) => {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const [pinName, setPinName] = useState("");
  const [pinDate, setPinDate] = useState("");
  const [pinTime, setPinTime] = useState("");
  const [pinCategoryId, setPinCategoryId] = useState("");

  const createPinMutation = useMutation({
    mutationFn: actionCreateLocalPin,
    onSuccess: async (localPin) => {
      if (session?.user.id) {
        queryClient.invalidateQueries({
          queryKey: ["local-pins", tripId, session.user.id],
        });
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
        title="New Pin"
        size="md"
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
