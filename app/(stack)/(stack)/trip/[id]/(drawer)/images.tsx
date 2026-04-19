import { CardImageRegular } from "@/components/card/image/regular";
import { HeaderTrip } from "@/components/header/trip";
import { UIText } from "@/components/ui/text";
import { gaps, getCardBasicStyle } from "@/constants/theme";
import { TRIPS } from "@/data";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TripImagesScreen() {
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
        contentContainerStyle={styles.images}
        data={trip.images}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View key={item.id} style={styles.item}>
            <CardImageRegular
              image={item}
              showCaption={true}
              onPress={() => {}}
            />
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
