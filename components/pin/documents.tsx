import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText as FileTextIcon } from "lucide-react-native";

import { CardDocument } from "@/components/card/document";
import { ConfirmActionDialog } from "@/components/dialog/confirm-action";
import { colors, getColor } from "@/constants/theme";
import {
  actionListLocalDocumentsByPin,
  actionSoftDeleteLocalDocument,
} from "@/lib/sqlite/model/document";
import { PinSectionTemplate, pinSectionStyles } from "./section-template";

type PinDocumentsProps = {
  pinId: string;
  userId: string;
  onOpenDocument: (document: {
    fileName: string;
    localUri: string | null;
  }) => void;
  onAddDocument: () => void;
};

export const PinDocuments = ({
  pinId,
  userId,
  onOpenDocument,
  onAddDocument,
}: PinDocumentsProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const queryClient = useQueryClient();

  const { data: localDocuments = [] } = useQuery({
    queryKey: ["local-pin-documents", pinId, userId],
    queryFn: () => actionListLocalDocumentsByPin(pinId, userId),
    enabled: Boolean(pinId && userId),
  });

  const softDeleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) =>
      actionSoftDeleteLocalDocument(documentId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["local-pin-documents", pinId, userId],
      });
      setIsDeleteDialogOpen(false);
      setSelectedDocumentId(null);
    },
  });

  return (
    <>
      <PinSectionTemplate
        title="Documents"
        icon={<FileTextIcon size={24} color={getColor(colors.purple)} />}
        onAdd={onAddDocument}
        addText="Add Document"
      >
        {localDocuments.map((document, index) => (
          <View key={document.id}>
            <CardDocument
              document={{
                id: document.id,
                fileName: document.fileName,
                mimeType: document.mimeType,
                url: document.localUri ?? "",
                caption: document.caption ?? undefined,
                creator: document.creator,
              }}
              variant="regular"
              onPress={() =>
                onOpenDocument({
                  fileName: document.fileName,
                  localUri: document.localUri,
                })
              }
              onDeletePress={() => {
                setSelectedDocumentId(document.id);
                setIsDeleteDialogOpen(true);
              }}
            />
            {index < localDocuments.length - 1 && (
              <View style={pinSectionStyles.divider} />
            )}
          </View>
        ))}
      </PinSectionTemplate>

      <ConfirmActionDialog
        visible={isDeleteDialogOpen}
        title="Delete Document"
        message="Are you sure you want to delete this document?"
        confirmText="Delete"
        onDismiss={() => {
          setIsDeleteDialogOpen(false);
          setSelectedDocumentId(null);
        }}
        onConfirm={() => {
          if (!selectedDocumentId) {
            return;
          }

          softDeleteDocumentMutation.mutate(selectedDocumentId);
        }}
        isPending={softDeleteDocumentMutation.isPending}
        confirmVariant="danger"
      />
    </>
  );
};
