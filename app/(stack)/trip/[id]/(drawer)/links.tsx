import { ButtonFab } from "@/components/button/fab";
import { CardPinReferenceLinkRegular } from "@/components/card/reference-link/regular";
import { DialogNewReferenceLink } from "@/components/dialog/new-reference-link";
import { UIText } from "@/components/ui/text";
import { gaps, getCardBasicStyle } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { getPinTitle } from "@/lib/pin";
import { actionListLocalReferenceLinksByTrip } from "@/lib/sqlite/model/reference-link";
import { actionGetLocalTrip } from "@/lib/sqlite/model/trip";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Plus as PlusIcon } from "lucide-react-native";
import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

export default function TripLinksScreen() {
  const [isDialogNewReferenceLinkVisible, setIsDialogNewReferenceLinkVisible] =
    useState(false);
  const { id } = useLocalSearchParams();
  const { session } = useAuthSession();
  const { showMessage, SystemMessageModal } = useSystemMessage();

  const { data: localTrip } = useQuery({
    queryKey: ["local-trip", String(id), session?.user.id],
    queryFn: () => actionGetLocalTrip(String(id), session!.user.id),
    enabled: Boolean(id && session?.user.id),
  });

  const { data: localReferenceLinks = [] } = useQuery({
    queryKey: ["local-trip-reference-links", String(id), session?.user.id],
    queryFn: () => actionListLocalReferenceLinksByTrip(String(id), session!.user.id),
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

  const referenceLinks = localReferenceLinks.map((referenceLink) => {
    const linkedPinLabel = referenceLink.pin
      ? `For ${getPinTitle(referenceLink.pin)}`
      : null;
    const captionParts = [linkedPinLabel, referenceLink.caption].filter(Boolean);

    return {
      id: referenceLink.id,
      title: referenceLink.title ?? referenceLink.url,
      url: referenceLink.url,
      caption: captionParts.length ? captionParts.join(" · ") : undefined,
    };
  });

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.links}
        data={referenceLinks}
        renderItem={({ item }) => (
          <View key={item.id} style={styles.link}>
            <CardPinReferenceLinkRegular referenceLink={item} />
          </View>
        )}
      />
      <ButtonFab
        onPress={() => {
          setIsDialogNewReferenceLinkVisible(true);
        }}
        text="New Item"
        icon={(color) => <PlusIcon size={20} color={color} />}
      />
      <DialogNewReferenceLink
        tripId={String(id)}
        visible={isDialogNewReferenceLinkVisible}
        onDismiss={() => setIsDialogNewReferenceLinkVisible(false)}
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
  links: {
    gap: gaps.md,
    padding: gaps.md,
  },
  link: {
    ...getCardBasicStyle("sm"),
  },
});
