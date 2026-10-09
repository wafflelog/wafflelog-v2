import { useQuery, useQueryClient } from "@tanstack/react-query";

import { resolveLocalImageFile } from "@/lib/media/local-image";
import { type LocalImage } from "@/lib/sqlite/model/image";

export function getLocalImageFileQueryKey(image: LocalImage) {
  return ["local-image-file", image.id, image.storagePath] as const;
}

export function useLocalImageFile(image: LocalImage) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: getLocalImageFileQueryKey(image),
    queryFn: async () => {
      const localUri = await resolveLocalImageFile(image);

      if (localUri !== image.localUri) {
        const invalidations = [
          queryClient.invalidateQueries({
            queryKey: ["local-trip-images", image.tripId],
          }),
        ];

        if (image.pinId) {
          invalidations.push(
            queryClient.invalidateQueries({
              queryKey: ["local-pin-images", image.pinId],
            }),
          );
        }

        await Promise.all(invalidations);
      }

      return localUri;
    },
    retry: false,
  });
}
