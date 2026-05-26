import { Dialog } from "@/components/ui/dialog";
import { UIInputText } from "@/components/ui/input/text";
import { gaps } from "@/constants/theme";
import { type SystemMessageType } from "@/hook/use-system-message";
import { useAuthSession } from "@/hook/use-auth-session";
import { actionCreateLocalReferenceLink } from "@/lib/sqlite/model/reference-link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { StyleSheet, View } from "react-native";
import { newReferenceLinkFormSchema } from "./schema";

type DialogNewReferenceLinkProps = {
  pinId?: string;
  tripId?: string;
  visible: boolean;
  onDismiss: () => void;
  onShowMessage: (message: string, type?: SystemMessageType) => void;
  systemMessageOverlay?: ReactNode;
};

export const DialogNewReferenceLink = ({
  pinId,
  tripId,
  visible,
  onDismiss,
  onShowMessage,
  systemMessageOverlay,
}: DialogNewReferenceLinkProps) => {
  const [referenceLinkUrl, setReferenceLinkUrl] = useState("");
  const [referenceLinkCaption, setReferenceLinkCaption] = useState("");
  const { session } = useAuthSession();
  const queryClient = useQueryClient();

  const createReferenceLinkMutation = useMutation({
    mutationFn: actionCreateLocalReferenceLink,
    onSuccess: () => {
      if (session?.user.id) {
        if (pinId) {
          queryClient.invalidateQueries({
            queryKey: ["local-reference-links", pinId, session.user.id],
          });
        }

        if (tripId) {
          queryClient.invalidateQueries({
            queryKey: ["local-trip-reference-links", tripId, session.user.id],
          });
        }
      }

      setReferenceLinkUrl("");
      setReferenceLinkCaption("");
      onDismiss();
      onShowMessage("Reference link saved locally", "info");
    },
    onError: (error) => {
      console.error("Error creating reference link:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create reference link";
      onShowMessage(message, "error");
    },
  });

  const handleConfirm = () => {
    if (!session?.user.id) {
      onShowMessage(
        "You must be signed in to create a reference link",
        "error",
      );
      return;
    }

    if (!tripId) {
      onShowMessage(
        "Reference links need to be attached to a trip.",
        "error",
      );
      return;
    }

    const result = newReferenceLinkFormSchema.safeParse({
      referenceLinkUrl,
      referenceLinkCaption,
    });

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        "Check your reference link details and try again.";
      onShowMessage(message, "error");
      return;
    }

    createReferenceLinkMutation.mutate({
      tripId,
      pinId: pinId ?? null,
      userId: session.user.id,
      url: result.data.referenceLinkUrl,
      caption: result.data.referenceLinkCaption,
    });
  };

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      title="New Reference Link"
      size="md"
      onConfirm={handleConfirm}
      overlay={systemMessageOverlay}
    >
      <View style={styles.content}>
        <UIInputText
          placeholder="Enter URL"
          value={referenceLinkUrl}
          onChange={setReferenceLinkUrl}
          autoFocus
        />
        <UIInputText
          placeholder="Add caption (optional)"
          value={referenceLinkCaption}
          onChange={setReferenceLinkCaption}
        />
      </View>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: gaps.sm,
  },
});
