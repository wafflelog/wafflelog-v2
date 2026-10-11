import { CardDocumentRegular } from "@/components/card/document/regular";
import { useLocalDocumentFile } from "@/hook/use-local-document-file";
import { type LocalDocument } from "@/lib/sqlite/model/document";

type CardDocumentResolvedProps = {
  document: LocalDocument;
  onPress: (localUri: string) => void;
  onDeletePress?: () => void;
  onError: (message: string) => void;
};

export function CardDocumentResolved({
  document,
  onPress,
  onDeletePress,
  onError,
}: CardDocumentResolvedProps) {
  const documentFileQuery = useLocalDocumentFile(document);

  const handlePress = async () => {
    const result = await documentFileQuery.refetch();

    if (result.data) {
      onPress(result.data);
      return;
    }

    const message =
      result.error instanceof Error
        ? result.error.message
        : "Failed to download document";
    onError(message);
  };

  return (
    <CardDocumentRegular
      document={{
        id: document.id,
        fileName: document.fileName,
        mimeType: document.mimeType,
        url: document.localUri ?? "",
        caption: document.caption ?? undefined,
        creator: document.creator,
      }}
      onPress={() => void handlePress()}
      onDeletePress={onDeletePress}
      isLoading={documentFileQuery.isFetching}
    />
  );
}
