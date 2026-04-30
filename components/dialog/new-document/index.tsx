import { Dialog } from "@/components/ui/dialog";
import { UIInputText } from "@/components/ui/input/text";
import { UIText } from "@/components/ui/text";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { actionCreateLocalDocument } from "@/lib/sqlite/model/document";
import {
  inferDocumentMimeType,
  isAllowedTravelDocumentMimeType,
  persistLocalTravelDocument,
} from "@/lib/supabase/storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import {
  MAX_TRAVEL_DOCUMENT_SIZE_BYTES,
  newDocumentFormSchema,
} from "./schema";

const ALLOWED_PICKER_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

type DialogNewDocumentProps = {
  tripId: string;
  pinId?: string;
  visible: boolean;
  onDismiss: () => void;
};

type SelectedDocumentAsset = {
  fileName: string;
  fileUri: string;
  mimeType: string;
  fileSize: number;
};

export const DialogNewDocument = ({
  tripId,
  pinId,
  visible,
  onDismiss,
}: DialogNewDocumentProps) => {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const [documentCaption, setDocumentCaption] = useState("");
  const [selectedDocument, setSelectedDocument] =
    useState<SelectedDocumentAsset | null>(null);

  const createDocumentMutation = useMutation({
    mutationFn: async (input: {
      fileName: string;
      fileUri: string;
      mimeType: string;
      caption?: string;
    }) => {
      if (!session?.user.id) {
        throw new Error("You must be signed in to save a document");
      }

      const localDocumentId = `document_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 10)}`;
      const localUri = await persistLocalTravelDocument({
        localDocumentId,
        fileName: input.fileName,
        fileUri: input.fileUri,
      });

      return actionCreateLocalDocument({
        id: localDocumentId,
        tripId,
        pinId,
        userId: session.user.id,
        fileName: input.fileName,
        mimeType: input.mimeType,
        localUri,
        caption: input.caption,
      });
    },
    onSuccess: () => {
      if (session?.user.id) {
        queryClient.invalidateQueries({
          queryKey: ["local-trip-documents", tripId, session.user.id],
        });

        if (pinId) {
          queryClient.invalidateQueries({
            queryKey: ["local-pin-documents", pinId, session.user.id],
          });
        }
      }

      setDocumentCaption("");
      setSelectedDocument(null);
      onDismiss();
      showMessage("Document saved locally", "info");
    },
    onError: (error) => {
      console.error("Error saving document locally:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save document";
      showMessage(message, "error");
    },
  });

  const handleDismiss = () => {
    if (createDocumentMutation.isPending) {
      return;
    }

    setDocumentCaption("");
    setSelectedDocument(null);
    onDismiss();
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      copyToCacheDirectory: true,
      type: ALLOWED_PICKER_MIME_TYPES,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    const inferredMimeType = inferDocumentMimeType(asset.name);
    const mimeType = asset.mimeType ?? inferredMimeType;

    if (!mimeType || !isAllowedTravelDocumentMimeType(mimeType)) {
      showMessage("Choose a PDF, DOC, or DOCX file", "error");
      return;
    }

    if (!asset.size || asset.size > MAX_TRAVEL_DOCUMENT_SIZE_BYTES) {
      showMessage("Choose a document smaller than 5 MB", "error");
      return;
    }

    setSelectedDocument({
      fileName: asset.name,
      fileUri: asset.uri,
      mimeType,
      fileSize: asset.size,
    });
  };

  const handleConfirm = () => {
    if (!session?.user.id) {
      showMessage("You must be signed in to save a document", "error");
      return;
    }

    if (!selectedDocument) {
      showMessage("Choose a document to save", "error");
      return;
    }

    const result = newDocumentFormSchema.safeParse({
      documentCaption,
    });

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        "Check your document details and try again.";
      showMessage(message, "error");
      return;
    }

    createDocumentMutation.mutate({
      fileName: selectedDocument.fileName,
      fileUri: selectedDocument.fileUri,
      mimeType: selectedDocument.mimeType,
      caption: result.data.documentCaption || undefined,
    });
  };

  return (
    <>
      <Dialog
        visible={visible}
        onDismiss={handleDismiss}
        title="New Document"
        size="md"
        confirmText={createDocumentMutation.isPending ? "Saving..." : "Save"}
        onConfirm={handleConfirm}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={handlePickDocument}
            activeOpacity={0.8}
          >
            <UIText style={styles.pickerButtonText}>
              {selectedDocument ? "Choose another file" : "Choose document"}
            </UIText>
          </TouchableOpacity>

          <View style={styles.meta}>
            <UIText style={styles.metaText}>
              {selectedDocument?.fileName ?? "No file selected"}
            </UIText>
            {selectedDocument ? (
              <UIText style={styles.metaSubtext}>
                {selectedDocument.mimeType} · {Math.ceil(selectedDocument.fileSize / 1024)} KB
              </UIText>
            ) : (
              <UIText style={styles.metaSubtext}>
                PDF, DOC, or DOCX up to 5 MB
              </UIText>
            )}
          </View>

          <UIInputText
            placeholder="Add caption (optional)"
            value={documentCaption}
            onChange={setDocumentCaption}
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
    gap: gaps.md,
  },
  pickerButton: {
    borderRadius: borderRadiuses.sm,
    backgroundColor: getColor(colors.blue),
    paddingVertical: gaps.sm,
    paddingHorizontal: gaps.md,
    alignItems: "center",
  },
  pickerButtonText: {
    color: getColor(colors.white),
  },
  meta: {
    gap: gaps.xxs,
    padding: gaps.sm,
    borderRadius: borderRadiuses.sm,
    backgroundColor: getColor(colors.whiteGrey, 0.5),
  },
  metaText: {
    color: getColor(colors.textDarkGrey),
  },
  metaSubtext: {
    color: getColor(colors.textLightGrey),
  },
});
