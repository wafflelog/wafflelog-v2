import { Dialog } from "@/components/ui/dialog";
import { UIText } from "@/components/ui/text";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { type SystemMessageType } from "@/hook/use-system-message";
import {
  actionCountLocalImagesByPin,
  actionCreateLocalImage,
} from "@/lib/sqlite/model/image";
import { buildUUID } from "@/lib/sqlite/utils";
import {
  isAllowedLocalImageMimeType,
  persistLocalImage,
} from "@/lib/media/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { type ReactNode, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

const MAX_IMAGES_PER_PIN = 5;

type DialogNewImageProps = {
  pinId?: string;
  tripId: string;
  visible: boolean;
  onDismiss: () => void;
  onShowMessage: (message: string, type?: SystemMessageType) => void;
  systemMessageOverlay?: ReactNode;
};

type SelectedImageAsset = {
  assetId?: string | null;
  fileName: string;
  fileUri: string;
  mimeType: string;
  width: number;
  height: number;
};

export const DialogNewImage = ({
  pinId,
  tripId,
  visible,
  onDismiss,
  onShowMessage,
  systemMessageOverlay,
}: DialogNewImageProps) => {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const [selectedImages, setSelectedImages] = useState<SelectedImageAsset[]>([]);

  const createImagesMutation = useMutation({
    mutationFn: async (images: SelectedImageAsset[]) => {
      if (!session?.user.id) {
        throw new Error("You must be signed in to save images");
      }

      if (pinId) {
        const currentCount = await actionCountLocalImagesByPin(
          pinId,
          session.user.id,
        );

        if (currentCount + images.length > MAX_IMAGES_PER_PIN) {
          throw new Error(`You can save up to ${MAX_IMAGES_PER_PIN} images per pin`);
        }
      }

      await Promise.all(
        images.map(async (image) => {
          const localImageId = buildUUID();
          const localUri = await persistLocalImage({
            tripId,
            pinId,
            localImageId,
            fileName: image.fileName,
            fileUri: image.fileUri,
          });

          return actionCreateLocalImage({
            id: localImageId,
            pinId: pinId ?? null,
            tripId,
            userId: session.user.id,
            localUri,
            mimeType: image.mimeType,
            width: image.width,
            height: image.height,
          });
        }),
      );
    },
    onSuccess: () => {
      if (session?.user.id) {
        queryClient.invalidateQueries({
          queryKey: ["local-trip-images", tripId, session.user.id],
        });

        if (pinId) {
          queryClient.invalidateQueries({
            queryKey: ["local-pin-images", pinId, session.user.id],
          });
        }
      }

      setSelectedImages([]);
      onDismiss();
      onShowMessage("Images saved locally", "info");
    },
    onError: (error) => {
      console.error("Error saving images locally:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save images";
      onShowMessage(message, "error");
    },
  });

  const handleDismiss = () => {
    if (createImagesMutation.isPending) {
      return;
    }

    setSelectedImages([]);
    onDismiss();
  };

  const handlePickImages = async () => {
    if (!session?.user.id) {
      onShowMessage("You must be signed in to save images", "error");
      return;
    }

    const remainingSlots = pinId
      ? MAX_IMAGES_PER_PIN -
        (await actionCountLocalImagesByPin(pinId, session.user.id))
      : MAX_IMAGES_PER_PIN;

    if (pinId && remainingSlots <= 0) {
      onShowMessage(
        `You can save up to ${MAX_IMAGES_PER_PIN} images per pin`,
        "error",
      );
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      onShowMessage("Allow photo library access to pick images", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 1,
    });

    if (result.canceled) {
      return;
    }

    const nextSelectedImages = result.assets.flatMap((asset) => {
      const mimeType = asset.mimeType ?? "image/jpeg";

      if (!isAllowedLocalImageMimeType(mimeType)) {
        return [];
      }

      return [
        {
          assetId: asset.assetId,
          fileName: asset.fileName ?? `image-${Date.now()}.jpg`,
          fileUri: asset.uri,
          mimeType,
          width: asset.width,
          height: asset.height,
        },
      ];
    });

    if (nextSelectedImages.length === 0) {
      onShowMessage("Choose JPG, PNG, or WebP images", "error");
      return;
    }

    setSelectedImages(nextSelectedImages);
  };

  const handleConfirm = () => {
    if (!selectedImages.length) {
      onShowMessage("Choose at least one image to save", "error");
      return;
    }

    createImagesMutation.mutate(selectedImages);
  };

  return (
    <Dialog
      visible={visible}
      onDismiss={handleDismiss}
      title="New Images"
      size="md"
      confirmText={createImagesMutation.isPending ? "Saving..." : "Save"}
      onConfirm={handleConfirm}
      overlay={systemMessageOverlay}
    >
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={handlePickImages}
          activeOpacity={0.8}
        >
          <UIText style={styles.pickerButtonText}>
            {selectedImages.length ? "Choose different images" : "Choose images"}
          </UIText>
        </TouchableOpacity>

        <View style={styles.meta}>
          <UIText style={styles.metaText}>
            {selectedImages.length
              ? `${selectedImages.length} image${selectedImages.length > 1 ? "s" : ""} selected`
              : "No images selected"}
          </UIText>
          <UIText style={styles.metaSubtext}>
            Up to {MAX_IMAGES_PER_PIN} images. JPG, PNG, or WebP only.
          </UIText>
        </View>

        {selectedImages.map((image) => (
          <UIText key={image.assetId ?? image.fileUri} style={styles.imageName}>
            {image.fileName}
          </UIText>
        ))}
      </View>
    </Dialog>
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
  imageName: {
    color: getColor(colors.textDarkGrey),
  },
});
