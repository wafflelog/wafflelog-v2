import { ButtonFab } from "@/components/button/fab";
import { CardPinReferenceLinkRegular } from "@/components/card/reference-link/regular";
import { DialogNewReferenceLink } from "@/components/dialog/new-reference-link";
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
import { actionListLocalReferenceLinksByTrip } from "@/lib/sqlite/model/reference-link";
import { actionGetLocalTrip } from "@/lib/sqlite/model/trip";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import {
  Link2 as Link2Icon,
  Plus as PlusIcon,
} from "lucide-react-native";
import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";

export default function TripLinksScreen() {
  const [isDialogNewReferenceLinkVisible, setIsDialogNewReferenceLinkVisible] =
    useState(false);
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { session } = useAuthSession();
  const { isRefreshing, refreshKnownTrips } = useKnownTripsRefresh();
  const { showMessage, SystemMessageModal } = useSystemMessage();

  const { data: localTrip } = useQuery({
    queryKey: ["local-trip", String(tripId), session?.user.id],
    queryFn: () => actionGetLocalTrip(String(tripId), session!.user.id),
    enabled: Boolean(tripId && session?.user.id),
  });

  const { data: localReferenceLinks = [] } = useQuery({
    queryKey: [
      "local-trip-reference-links",
      String(tripId),
      session?.user.id,
    ],
    queryFn: () =>
      actionListLocalReferenceLinksByTrip(String(tripId), session!.user.id),
    enabled: Boolean(tripId && session?.user.id),
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

  const referenceLinks = localReferenceLinks.map((referenceLink) => {
    const linkedPinLabel = referenceLink.pin
      ? `For ${getPinTitle(referenceLink.pin)}`
      : null;
    const captionParts = [linkedPinLabel, referenceLink.caption].filter(
      Boolean,
    );

    return {
      id: referenceLink.id,
      title: referenceLink.title ?? referenceLink.url,
      url: referenceLink.url,
      caption: captionParts.length ? captionParts.join(" · ") : undefined,
      creator: referenceLink.creator,
    };
  });

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.links}
        data={referenceLinks}
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
            icon={<Link2Icon size={24} color={getColor(colors.purple)} />}
            title="No links saved yet"
            message="Save useful websites and references for this trip."
          />
        }
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
        tripId={String(tripId)}
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
    backgroundColor: semanticColors.screen,
  },
  links: {
    flexGrow: 1,
    gap: gaps.md,
    padding: gaps.md,
  },
  link: {
    ...getCardBasicStyle("sm"),
  },
});
