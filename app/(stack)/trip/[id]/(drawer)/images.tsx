import { ButtonFab } from "@/components/button/fab";
import { CardImageRegular } from "@/components/card/image/regular";
import { DialogNewImage } from "@/components/dialog/new-image";
import { UIText } from "@/components/ui/text";
import { gaps, getCardBasicStyle } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { getPinTitle } from "@/lib/helper/pin";
import { actionListLocalImagesByTrip } from "@/lib/sqlite/model/image";
import { actionGetLocalTrip } from "@/lib/sqlite/model/trip";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus as PlusIcon } from "lucide-react-native";
import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

export default function TripImagesScreen() {
  const [isDialogNewImageVisible, setIsDialogNewImageVisible] = useState(false);
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuthSession();
  const { showMessage, SystemMessageModal } = useSystemMessage();

  const { data: localTrip } = useQuery({
    queryKey: ["local-trip", String(id), session?.user.id],
    queryFn: () => actionGetLocalTrip(String(id), session!.user.id),
    enabled: Boolean(id && session?.user.id),
  });

  const { data: localImages = [] } = useQuery({
    queryKey: ["local-trip-images", String(id), session?.user.id],
    queryFn: () => actionListLocalImagesByTrip(String(id), session!.user.id),
    enabled: Boolean(id && session?.user.id),
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

  if (!trip) {
    return <UIText>Trip not found</UIText>;
  }

  const images = localImages.map((image) => {
    const linkedPinLabel = image.pin ? `For ${getPinTitle(image.pin)}` : null;
    const captionParts = [linkedPinLabel, image.caption].filter(Boolean);

    return {
      ...image,
      caption: captionParts.length ? captionParts.join(" · ") : null,
    };
  });

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.images}
        data={images}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View key={item.id} style={styles.item}>
            <CardImageRegular
              image={{
                id: item.id,
                url: item.localUri,
                width: item.width,
                height: item.height,
                caption: item.caption ?? undefined,
                creator: item.creator,
              }}
              showCaption={true}
              onPress={() => {
                router.push({
                  pathname: "/image-viewer",
                  params: {
                    url: item.localUri,
                    urls: JSON.stringify(images.map((image) => image.localUri)),
                  },
                });
              }}
            />
          </View>
        )}
      />
      <ButtonFab
        onPress={() => {
          setIsDialogNewImageVisible(true);
        }}
        text="New Image"
        icon={(color) => <PlusIcon size={20} color={color} />}
      />
      <DialogNewImage
        tripId={String(id)}
        visible={isDialogNewImageVisible}
        onDismiss={() => setIsDialogNewImageVisible(false)}
        onShowMessage={showMessage}
      />
      <SystemMessageModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  images: {
    gap: gaps.md,
    padding: gaps.md,
  },
  item: {
    width: "50%",
    aspectRatio: 1,
    paddingHorizontal: gaps.xs,
  },
  document: {
    ...getCardBasicStyle("sm"),
    height: "100%",
  },
});
