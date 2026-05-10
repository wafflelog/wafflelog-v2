import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Image as ImageIcon } from "lucide-react-native";

import { CardImageRegular } from "@/components/card/image/regular";
import { DialogNewImage } from "@/components/dialog/new-image";
import { colors, getColor } from "@/constants/theme";
import { actionListLocalImagesByPin } from "@/lib/sqlite/model/image";
import { type Pin } from "@/types/pin";
import { PinSectionTemplate } from "./section-template";

type PinImagesProps = {
  pinId: string;
  tripId: string;
  userId: string;
  onOpenImage: (selectedImageId: string, images: Pin["images"]) => void;
};

export const PinImages = ({
  pinId,
  tripId,
  userId,
  onOpenImage,
}: PinImagesProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: localImages = [] } = useQuery({
    queryKey: ["local-pin-images", pinId, userId],
    queryFn: () => actionListLocalImagesByPin(pinId, userId),
    enabled: Boolean(pinId && userId),
  });

  const images: Pin["images"] = localImages.map((image) => ({
    id: image.id,
    url: image.localUri,
    width: image.width,
    height: image.height,
    caption: image.caption ?? undefined,
  }));

  return (
    <>
      <PinSectionTemplate
        title="Images"
        icon={<ImageIcon size={24} color={getColor(colors.purple)} />}
        onAdd={() => setIsDialogOpen(true)}
        addText="Add Image"
        addButtonStyle={styles.addImageButton}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageList}
        >
          {images.map((image) => (
            <View key={image.id} style={styles.imageCard}>
              <CardImageRegular
                image={image}
                onPress={() => onOpenImage(image.id, images)}
              />
            </View>
          ))}
        </ScrollView>
      </PinSectionTemplate>

      <DialogNewImage
        pinId={pinId}
        tripId={tripId}
        visible={isDialogOpen}
        onDismiss={() => setIsDialogOpen(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  addImageButton: {
    width: 120,
    flexDirection: "column",
  },
  imageCard: {
    width: 120,
    height: 120,
  },
  imageList: {
    gap: 12,
  },
});
