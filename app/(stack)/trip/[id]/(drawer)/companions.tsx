import { CardCompanionRegular } from "@/components/card/companion/regular";
import { ButtonFab } from "@/components/button/fab";
import { HeaderTrip } from "@/components/header/trip";
import { UIText } from "@/components/ui/text";
import { gaps, getCardBasicStyle } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { actionGetLocalTrip } from "@/lib/sqlite/model/trip";
import { type Companion } from "@/types/trip";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Plus as PlusIcon } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MAX_COMPANIONS = 10;

export default function TripCompanionsScreen() {
  const { id, invitedUserId, invitedUserName } = useLocalSearchParams<{
    id?: string;
    invitedUserId?: string;
    invitedUserName?: string;
  }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { session } = useAuthSession();
  const { showMessage, SystemMessageModal } = useSystemMessage();

  const { data: localTrip } = useQuery({
    queryKey: ["local-trip", String(id), session?.user.id],
    queryFn: () => actionGetLocalTrip(String(id), session!.user.id),
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
  const [companions, setCompanions] = useState<Companion[]>(
    trip?.companions ?? [],
  );

  useFocusEffect(
    useCallback(() => {
      if (!invitedUserId || !invitedUserName) {
        return;
      }

      setCompanions((currentCompanions) => {
        if (
          currentCompanions.some((companion) => companion.id === invitedUserId)
        ) {
          return currentCompanions;
        }

        if (currentCompanions.length >= MAX_COMPANIONS) {
          showMessage(`You can invite up to ${MAX_COMPANIONS} companions`, "error");
          return currentCompanions;
        }

        return [
          ...currentCompanions,
          {
            id: invitedUserId,
            fullname: invitedUserName,
            state: "INVITED",
          },
        ];
      });
    }, [invitedUserId, invitedUserName, showMessage]),
  );

  const invitedUserIds = useMemo(() => {
    return companions
      .filter((companion) => companion.state === "INVITED")
      .map((companion) => companion.id)
      .join(",");
  }, [companions]);

  const inTripUserIds = useMemo(() => {
    return companions
      .filter((companion) => companion.state === "ACCEPTED")
      .map((companion) => companion.id)
      .join(",");
  }, [companions]);

  const handleRemoveCompanion = (companionId: string) => {
    setCompanions((currentCompanions) =>
      currentCompanions.filter((companion) => companion.id !== companionId),
    );
  };

  if (!trip) {
    return <UIText>Trip not found</UIText>;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <HeaderTrip
        trip={trip}
        onBackPress={() => router.back()}
        onMorePress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      />

      <FlatList
        contentContainerStyle={styles.companions}
        data={companions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View key={item.id} style={styles.companion}>
            <CardCompanionRegular
              companion={item}
              showRemoveButton={true}
              onRemove={handleRemoveCompanion}
            />
          </View>
        )}
      />
      <ButtonFab
        onPress={() => {
          if (companions.length >= MAX_COMPANIONS) {
            showMessage(`You can invite up to ${MAX_COMPANIONS} companions`, "error");
            return;
          }

          router.push({
            pathname: "/user-search",
            params: {
              tripId: trip.id,
              invitedUserIds,
              inTripUserIds,
              tripTitle: trip.title,
            },
          });
        }}
        text="New Companion"
        icon={(color) => <PlusIcon size={20} color={color} />}
      />
      <SystemMessageModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  companions: {
    gap: gaps.md,
    padding: gaps.md,
  },
  companion: {
    ...getCardBasicStyle("sm"),
  },
});
