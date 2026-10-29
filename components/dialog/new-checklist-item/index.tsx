import { Dialog } from "@/components/ui/dialog";
import { UIInputText } from "@/components/ui/input/text";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import {
  actionCreateLocalChecklistItem,
  type LocalChecklistItem,
} from "@/lib/sqlite/model/checklist-item";
import { sendTrackingEvent } from "@/lib/tracking";
import { type ChecklistVisibility } from "@/types/trip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { newChecklistItemFormSchema } from "./schema";

type DialogNewChecklistItemProps = {
  tripId: string;
  visible: boolean;
  visibility: ChecklistVisibility;
  onDismiss: () => void;
};

export const DialogNewChecklistItem = ({
  tripId,
  visible,
  visibility,
  onDismiss,
}: DialogNewChecklistItemProps) => {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const [checklistItemTitle, setChecklistItemTitle] = useState("");
  const createChecklistItemMutation = useMutation({
    mutationFn: actionCreateLocalChecklistItem,
    onSuccess: (checklistItem) => {
      void sendTrackingEvent("trip_item_created", {
        item_type: "checklist",
        source: "manual",
      });

      if (session?.user.id) {
        queryClient.setQueryData<LocalChecklistItem[]>(
          ["local-checklist-items", tripId, session.user.id],
          (items = []) => {
            if (items.some((item) => item.id === checklistItem.id)) {
              return items;
            }

            return [...items, checklistItem];
          },
        );
        queryClient.invalidateQueries({
          queryKey: ["local-checklist-items", tripId, session.user.id],
        });
      }
      setChecklistItemTitle("");
      onDismiss();
      showMessage("Checklist item saved locally", "info");
    },
    onError: (error) => {
      console.error("Error creating checklist item:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create checklist item";
      showMessage(message, "error");
    },
  });

  const handleConfirm = () => {
    if (!session?.user.id) {
      showMessage("You must be signed in to create a checklist item", "error");
      return;
    }

    const result = newChecklistItemFormSchema.safeParse({
      checklistItemTitle,
    });

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        "Check your checklist item details and try again.";
      showMessage(message, "error");
      return;
    }

    createChecklistItemMutation.mutate({
      tripId,
      userId: session.user.id,
      title: result.data.checklistItemTitle,
      visibility,
    });
  };

  return (
    <>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        title={
          visibility === "private" ? "New Personal Item" : "New Trip Item"
        }
        size="md"
        onConfirm={handleConfirm}
      >
        <View style={styles.content}>
          <TitleRegular size="xs" color={colors.textLightGrey}>
            {visibility === "private"
              ? "Only visible to you."
              : "Shared with trip companions."}
          </TitleRegular>
          <UIInputText
            placeholder="Enter item"
            value={checklistItemTitle}
            onChange={setChecklistItemTitle}
            autoFocus
          />
        </View>
      </Dialog>
      <SystemMessageModal />
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: gaps.sm,
  },
});
