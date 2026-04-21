import { ButtonFab } from "@/components/button/fab";
import { CardPinReferenceLinkRegular } from "@/components/card/reference-link/regular";
import { DialogNewReferenceLink } from "@/components/dialog/new-reference-link";
import { HeaderTrip } from "@/components/header/trip";
import { UIText } from "@/components/ui/text";
import { gaps, getCardBasicStyle } from "@/constants/theme";
import { TRIPS } from "@/data";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus as PlusIcon } from "lucide-react-native";
import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TripLinksScreen() {
  const [isDialogNewReferenceLinkVisible, setIsDialogNewReferenceLinkVisible] =
    useState(false);
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();

  const trip = TRIPS.find((trip) => trip.id === id);

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
        contentContainerStyle={styles.links}
        data={trip.referenceLinks}
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
        visible={isDialogNewReferenceLinkVisible}
        onDismiss={() => setIsDialogNewReferenceLinkVisible(false)}
      />
    </SafeAreaView>
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
