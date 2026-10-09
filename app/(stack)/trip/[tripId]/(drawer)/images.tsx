import { ButtonFab } from "@/components/button/fab";
import { CardImageResolved } from "@/components/card/image/resolved";
import { ConfirmActionDialog } from "@/components/dialog/confirm-action";
import { DialogNewImage } from "@/components/dialog/new-image";
import { EmptyState } from "@/components/ui/empty-state";
import { UIText } from "@/components/ui/text";
import {
  colors,
  gaps,
  getCardBasicStyle,
  getColor,
  semanticColors,
} from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useKnownTripsRefresh } from "@/hook/use-known-trips-refresh";
import { useSystemMessage } from "@/hook/use-system-message";
import { getPinTitle } from "@/lib/helper/pin";
import {
  actionListLocalImagesByTrip,
  actionSoftDeleteLocalImage,
} from "@/lib/sqlite/model/image";
import { actionGetLocalTrip } from "@/lib/sqlite/model/trip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Image as ImageIcon,
  Plus as PlusIcon,
} from "lucide-react-native";
import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";

export default function TripImagesScreen() {
  const [isDialogNewImageVisible, setIsDialogNewImageVisible] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();
  const { session } = useAuthSession();
  const { isRefreshing, refreshKnownTrips } = useKnownTripsRefresh();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const queryClient = useQueryClient();

  const { data: localTrip } = useQuery({
    queryKey: ["local-trip", String(tripId), session?.user.id],
    queryFn: () => actionGetLocalTrip(String(tripId), session!.user.id),
    enabled: Boolean(tripId && session?.user.id),
  });

  const { data: localImages = [] } = useQuery({
    queryKey: ["local-trip-images", String(tripId), session?.user.id],
    queryFn: () =>
      actionListLocalImagesByTrip(String(tripId), session!.user.id),
    enabled: Boolean(tripId && session?.user.id),
  });

  const softDeleteImageMutation = useMutation({
    mutationFn: (imageId: string) =>
      actionSoftDeleteLocalImage(imageId, session!.user.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["local-trip-images", String(tripId), session!.user.id],
      });
      setSelectedImageId(null);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to delete image";
      showMessage(message, "error");
    },
  });

  const trip = localTrip
    ? {
        id: localTrip.id,
        title: localTrip.title,
        startDate: localTrip.startDate,
        endDate: localTrip.endDate,
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
        alwaysBounceVertical
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshKnownTrips}
            tintColor={getColor(colors.purple)}
            colors={[getColor(colors.purple)]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<ImageIcon size={24} color={getColor(colors.purple)} />}
            title="No images added yet"
            message="Add photos or visual references for this trip."
          />
        }
        renderItem={({ item }) => (
          <View key={item.id} style={styles.item}>
            <CardImageResolved
              image={item}
              showCaption={true}
              onPress={(localUri) => {
                const imageUrls = images.flatMap((image) => {
                  const imageUrl =
                    image.id === item.id ? localUri : image.localUri;
                  return imageUrl ? [imageUrl] : [];
                });

                router.push({
                  pathname: "/image-viewer",
                  params: {
                    url: localUri,
                    urls: JSON.stringify(imageUrls),
                  },
                });
              }}
              onDeletePress={
                item.creator.isCurrentUser
                  ? () => setSelectedImageId(item.id)
                  : undefined
              }
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
        tripId={String(tripId)}
        visible={isDialogNewImageVisible}
        onDismiss={() => setIsDialogNewImageVisible(false)}
        onShowMessage={showMessage}
      />
      <ConfirmActionDialog
        visible={Boolean(selectedImageId)}
        title="Delete Image"
        message="Are you sure you want to delete this image?"
        confirmText="Delete"
        onDismiss={() => setSelectedImageId(null)}
        onConfirm={() => {
          if (selectedImageId) {
            softDeleteImageMutation.mutate(selectedImageId);
          }
        }}
        isPending={softDeleteImageMutation.isPending}
        confirmVariant="danger"
      />
      <SystemMessageModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.screen,
  },
  images: {
    flexGrow: 1,
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
