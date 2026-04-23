import { Dialog } from "@/components/ui/dialog";
import { UIInputText } from "@/components/ui/input/text";
import { gaps } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { actionCreateLocalChecklistItem } from "@/lib/sqlite/model/checklist-item";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { newChecklistItemFormSchema } from "./schema";

type DialogNewChecklistItemProps = {
  tripId: string;
  visible: boolean;
  onDismiss: () => void;
};

export const DialogNewChecklistItem = ({
  tripId,
  visible,
  onDismiss,
}: DialogNewChecklistItemProps) => {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const [checklistItemTitle, setChecklistItemTitle] = useState("");
  const createChecklistItemMutation = useMutation({
    mutationFn: actionCreateLocalChecklistItem,
    onSuccess: () => {
      if (session?.user.id) {
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
    });
  };

  return (
    <>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        title="New Checklist Item"
        size="md"
        onConfirm={handleConfirm}
      >
        <View style={styles.content}>
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
