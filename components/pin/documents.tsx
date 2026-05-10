import { useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { FileText as FileTextIcon } from "lucide-react-native";

import { CardDocument } from "@/components/card/document";
import { DialogNewDocument } from "@/components/dialog/new-document";
import { colors, getColor } from "@/constants/theme";
import { actionListLocalDocumentsByPin } from "@/lib/sqlite/model/document";
import { PinSectionTemplate, pinSectionStyles } from "./section-template";

type PinDocumentsProps = {
  pinId: string;
  tripId: string;
  userId: string;
  onOpenDocument: (document: {
    fileName: string;
    localUri: string | null;
  }) => void;
};

export const PinDocuments = ({
  pinId,
  tripId,
  userId,
  onOpenDocument,
}: PinDocumentsProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: localDocuments = [] } = useQuery({
    queryKey: ["local-pin-documents", pinId, userId],
    queryFn: () => actionListLocalDocumentsByPin(pinId, userId),
    enabled: Boolean(pinId && userId),
  });

  return (
    <>
      <PinSectionTemplate
        title="Documents"
        icon={<FileTextIcon size={24} color={getColor(colors.purple)} />}
        onAdd={() => setIsDialogOpen(true)}
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
              }}
              variant="regular"
              onPress={() =>
                onOpenDocument({
                  fileName: document.fileName,
                  localUri: document.localUri,
                })
              }
            />
            {index < localDocuments.length - 1 && (
              <View style={pinSectionStyles.divider} />
            )}
          </View>
        ))}
      </PinSectionTemplate>

      <DialogNewDocument
        tripId={tripId}
        pinId={pinId}
        visible={isDialogOpen}
        onDismiss={() => setIsDialogOpen(false)}
      />
    </>
  );
};
