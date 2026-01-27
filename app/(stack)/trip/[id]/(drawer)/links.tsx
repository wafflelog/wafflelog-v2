import { CardPinReferenceLinkRegular } from "@/components/card/reference-link/regular";
import { HeaderTrip } from "@/components/header/trip";
import { UIText } from "@/components/ui/text";
import { gaps, getCardBasicStyle } from "@/constants/theme";
import { TRIPS } from "@/data";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TripLinksScreen() {
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
            <CardPinReferenceLinkRegular
              referenceLink={item}
              onPress={() => {
                router.push({
                  pathname: "/web-viewer",
                  params: { url: item.url, title: item.title },
                });
              }}
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
  links: {
    gap: gaps.md,
    padding: gaps.md,
  },
  link: {
    ...getCardBasicStyle("sm"),
  },
});
