import { useQuery, useQueryClient } from "@tanstack/react-query";

import { resolveLocalDocumentFile } from "@/lib/media/local-document";
import { type LocalDocument } from "@/lib/sqlite/model/document";

export function getLocalDocumentFileQueryKey(document: LocalDocument) {
  return ["local-document-file", document.id, document.storagePath] as const;
}

export function useLocalDocumentFile(document: LocalDocument) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: getLocalDocumentFileQueryKey(document),
    queryFn: async () => {
      const localUri = await resolveLocalDocumentFile(document);

      if (localUri !== document.localUri) {
        const invalidations = [
          queryClient.invalidateQueries({
            queryKey: ["local-trip-documents", document.tripId],
          }),
        ];

        if (document.pinId) {
          invalidations.push(
            queryClient.invalidateQueries({
              queryKey: ["local-pin-documents", document.pinId],
            }),
          );
        }

        await Promise.all(invalidations);
      }

      return localUri;
    },
    enabled: false,
    retry: false,
  });
}
