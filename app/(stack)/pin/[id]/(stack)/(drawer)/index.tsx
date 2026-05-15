import { PinDocuments } from "@/components/pin/documents";
import { PinExpenses } from "@/components/pin/expenses";
import { PinImages } from "@/components/pin/images";
import { PinLinks } from "@/components/pin/links";
import { UIText } from "@/components/ui/text";
import { CATEGORIES } from "@/data/pins";
import { useAuthSession } from "@/hook/use-auth-session";
import {
  actionGetLocalPin,
  actionUpsertLocalPinFromRemote,
} from "@/lib/sqlite/model/pin";
import { actionGetRemotePinById } from "@/lib/supabase/actions";
import { type Pin } from "@/types/pin";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CardPinLocationRegular } from "@/components/card/pin/location/regular";
import { TitleRegular } from "@/components/title/regular";
import { colors, getCardBasicStyle, getColor } from "@/constants/theme";
import { useSystemMessage } from "@/hook/use-system-message";
import { actionGetLocalPinLocation } from "@/lib/sqlite/model/pin-location";
import {
  MapPin as MapPinIcon,
  SquarePen as SquarePenIcon,
} from "lucide-react-native";

export default function PinIndexScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuthSession();
  const color = getColor(colors.purple);
  const queryClient = useQueryClient();
  const { showMessage, SystemMessageModal } = useSystemMessage();

  const { data: localPin } = useQuery({
    queryKey: ["local-pin", String(id), session?.user.id],
    queryFn: () => actionGetLocalPin(String(id), session!.user.id),
    enabled: Boolean(id && session?.user.id),
  });

  useQuery({
    queryKey: ["remote-pin", String(id), session?.user.id],
    queryFn: async () => {
      const remotePin = await actionGetRemotePinById(String(id));
      const shouldApplyRemote =
        !localPin ||
        (localPin.syncStatus === "synced" &&
          dayjs(remotePin.updatedAt).isAfter(dayjs(localPin.updatedAt)));

      if (shouldApplyRemote) {
        await actionUpsertLocalPinFromRemote(remotePin);
        await queryClient.invalidateQueries({
          queryKey: ["local-pin", String(id), session?.user.id],
        });
      }

      return remotePin;
    },
    enabled: Boolean(id && session?.user.id),
    staleTime: 0,
    gcTime: 0,
  });
  const { data: localPinLocation } = useQuery({
    queryKey: ["local-pin-location", String(id), session?.user.id],
    queryFn: () => actionGetLocalPinLocation(String(id), session!.user.id),
    enabled: Boolean(id && session?.user.id),
  });

  const pin: Pin | null = localPin
    ? {
        id: localPin.id,
        name: localPin.name,
        category:
          CATEGORIES.find((category) => category.id === localPin.categoryId) ??
          CATEGORIES[0],
        location: {
          id: localPinLocation?.placeId ?? `location-${localPin.id}`,
          name: localPinLocation?.displayName ?? "Unknown location",
          address: localPinLocation?.formattedAddress ?? "",
          latitude: localPinLocation?.latitude ?? 0,
          longitude: localPinLocation?.longitude ?? 0,
        },
        time: dayjs(`${localPin.date} ${localPin.time}`).toISOString(),
        referenceLinks: [],
        documents: [],
        expenses: [],
        images: [],
        notes: [],
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

  const handleOpenImage = async (
    selectedImageId: string,
    images: Pin["images"],
  ) => {
    const urls = images.map((image) => image.url);
    const selectedImage = images.find((image) => image.id === selectedImageId);

    if (!selectedImage) {
      showMessage("Failed to open image", "error");
      return;
    }

    router.push({
      pathname: "/image-viewer",
      params: {
        url: selectedImage.url,
        urls: JSON.stringify(urls),
      },
    });
  };

  if (!pin || !localPin || !session?.user.id) {
    return <UIText>Pin not found</UIText>;
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.map}></View>
        <View style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPinIcon size={24} color={color} />
              <TitleRegular size="md" weight="600">
                Location
              </TitleRegular>
            </View>
            <CardPinLocationRegular
              pin={pin}
              onPress={() => {
                router.push({
                  pathname: "/place-search",
                  params: {
                    pinId: pin.id,
                  },
                });
              }}
            />
          </View>

          <PinExpenses
            pinId={pin.id}
            tripId={localPin.tripId}
            userId={session.user.id}
          />

          <PinImages
            pinId={pin.id}
            tripId={localPin.tripId}
            userId={session.user.id}
            onOpenImage={handleOpenImage}
          />

          <PinDocuments
            pinId={pin.id}
            tripId={localPin.tripId}
            userId={session.user.id}
            onOpenDocument={handleOpenDocument}
          />

          <PinLinks
            pinId={pin.id}
            tripId={localPin.tripId}
            userId={session.user.id}
          />
        </View>
      </ScrollView>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/pin/${id}/notes`)}
        activeOpacity={0.8}
      >
        <SquarePenIcon size={24} color="#fff" />
      </TouchableOpacity>
      <SystemMessageModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  map: {
    width: "100%",
    aspectRatio: 1.5,
    backgroundColor: "red",
  },
  section: {
    gap: 6,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    ...getCardBasicStyle("lg"),
    backgroundColor: getColor(colors.purple),
    borderRadius: "50%",
  },
});
