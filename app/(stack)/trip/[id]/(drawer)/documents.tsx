import { CardDocument } from "@/components/card/document";
import { HeaderTrip } from "@/components/header/trip";
import { UIText } from "@/components/ui/text";
import { gaps, getCardBasicStyle } from "@/constants/theme";
import { TRIPS } from "@/data";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TripDocumentsScreen() {
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
        contentContainerStyle={styles.documents}
        data={trip.documents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View key={item.id} style={styles.item}>
            <View style={styles.document}>
              <CardDocument document={item} variant="regular" />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  documents: {
    gap: gaps.md,
    padding: gaps.md,
  },
  item: {
    paddingHorizontal: gaps.xs,
  },
  document: {
    ...getCardBasicStyle("sm"),
  },
});
