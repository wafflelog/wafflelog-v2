import { ButtonFab } from "@/components/button/fab";
import { CardDocument } from "@/components/card/document";
import { ConfirmActionDialog } from "@/components/dialog/confirm-action";
import { DialogNewDocument } from "@/components/dialog/new-document";
import { UIText } from "@/components/ui/text";
import { gaps, getCardBasicStyle } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { getPinTitle } from "@/lib/helper/pin";
import {
  actionListLocalDocumentsByTrip,
  actionSoftDeleteLocalDocument,
} from "@/lib/sqlite/model/document";
import { actionGetLocalTrip } from "@/lib/sqlite/model/trip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus as PlusIcon } from "lucide-react-native";
import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

export default function TripDocumentsScreen() {
  const [isDialogNewDocumentVisible, setIsDialogNewDocumentVisible] =
    useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuthSession();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const queryClient = useQueryClient();

  const { data: localTrip } = useQuery({
    queryKey: ["local-trip", String(id), session?.user.id],
    queryFn: () => actionGetLocalTrip(String(id), session!.user.id),
    enabled: Boolean(id && session?.user.id),
  });

  const { data: localDocuments = [] } = useQuery({
    queryKey: ["local-trip-documents", String(id), session?.user.id],
    queryFn: () => actionListLocalDocumentsByTrip(String(id), session!.user.id),
    enabled: Boolean(id && session?.user.id),
  });

  const softDeleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) =>
      actionSoftDeleteLocalDocument(documentId, session!.user.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["local-trip-documents", String(id), session!.user.id],
      });
      setIsDeleteDialogOpen(false);
      setSelectedDocumentId(null);
    },
  });

  const trip = localTrip
    ? {
        id: localTrip.id,
        title: localTrip.title,
        startDate: localTrip.startDate,
        endDate: localTrip.endDate,
        location: "Unknown destination",
        companions: [],
        pins: [],
        checklistItems: [],
        referenceLinks: [],
        documents: [],
        images: [],
        expenses: [],
      }
    : null;

  const handleOpenDocument = async (document: {
    fileName: string;
    localUri: string | null;
  }) => {
    try {
      if (!document.localUri) {
        throw new Error(
          "This document is not available offline on this device",
        );
      }

      router.push({
        pathname: "/web-viewer",
        params: {
          url: document.localUri,
          title: document.fileName,
        },
      });
    } catch (error) {
      console.error("Error opening document:", error);
      const message =
        error instanceof Error ? error.message : "Failed to open document";
      showMessage(message, "error");
    }
  };

  if (!trip) {
    return <UIText>Trip not found</UIText>;
  }

  const documents = localDocuments.map((document) => {
    const linkedPinLabel = document.pin
      ? `For ${getPinTitle(document.pin)}`
      : null;
    const captionParts = [linkedPinLabel, document.caption].filter(Boolean);

    return {
      ...document,
      caption: captionParts.length ? captionParts.join(" · ") : null,
    };
  });

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.documents}
        data={documents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View key={item.id} style={styles.item}>
            <View style={styles.document}>
              <CardDocument
                document={{
                  id: item.id,
                  fileName: item.fileName,
                  mimeType: item.mimeType,
                  url: "",
                  caption: item.caption ?? undefined,
                  creator: item.creator,
                }}
                variant="regular"
                onPress={() =>
                  void handleOpenDocument({
                    fileName: item.fileName,
                    localUri: item.localUri,
                  })
                }
                onDeletePress={() => {
                  setSelectedDocumentId(item.id);
                  setIsDeleteDialogOpen(true);
                }}
              />
            </View>
          </View>
        )}
      />
      <ButtonFab
        onPress={() => {
          setIsDialogNewDocumentVisible(true);
        }}
        text="New Document"
        icon={(color) => <PlusIcon size={20} color={color} />}
      />
      <DialogNewDocument
        tripId={String(id)}
        visible={isDialogNewDocumentVisible}
        onDismiss={() => setIsDialogNewDocumentVisible(false)}
        onShowMessage={showMessage}
      />
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
      <SystemMessageModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  documents: {
    gap: gaps.md,
    padding: gaps.md,
  },
  item: {
    paddingHorizontal: gaps.xs,
  },
  document: {
    ...getCardBasicStyle("sm"),
  },
});
