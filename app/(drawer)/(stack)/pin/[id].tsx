import { HeaderPin } from "@/components/header/pin";
import { UIText } from "@/components/ui/text";
import { PINS } from "@/data/pins";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CardPinDocumentRegular } from "@/components/card/pin/document/regular";
import { CardPinExpenseRegular } from "@/components/card/pin/expense/regular";
import { CardPinLocationRegular } from "@/components/card/pin/location/regular";
import { CardPinReferenceLinkRegular } from "@/components/card/pin/reference-link/regular";
import { colors, getCardBasicStyle, getColor } from "@/constants/theme";
import {
  FileText as FileTextIcon,
  Image as ImageIcon,
  Link2 as Link2Icon,
  MapPin as MapPinIcon,
  SquarePen as SquarePenIcon,
  Wallet as WalletIcon,
} from "lucide-react-native";

export default function PinScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const pin = PINS.find((pin) => pin.id === id);
  const color = getColor(colors.purple);

  if (!pin) {
    return <UIText>Pin not found</UIText>;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <HeaderPin
        pin={pin}
        onBackPress={() => router.back()}
        onMorePress={() => {}}
      />
      <TouchableOpacity onPress={() => router.push("/pin")}>
        <UIText>Design</UIText>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.map}></View>
        <View style={styles.content}>
          <View style={styles.info}></View>
          <View style={styles.location}>
            <View style={styles.sectionHeader}>
              <MapPinIcon size={24} color={color} />
              <UIText style={styles.sectionTitle} weight="600">
                Location
              </UIText>
            </View>
            <CardPinLocationRegular pin={pin} onPress={() => {}} />
          </View>
          <View style={styles.notes}>
            <View style={styles.sectionHeader}>
              <SquarePenIcon size={24} color={color} />
              <UIText style={styles.sectionTitle} weight="600">
                Notes
              </UIText>
            </View>
          </View>
          <View style={styles.expenses}>
            <View style={styles.sectionHeader}>
              <WalletIcon size={24} color={color} />
              <UIText style={styles.sectionTitle} weight="600">
                Expenses
              </UIText>
            </View>
            <View style={styles.sectionCard}>
              {pin.expenses.map((expense, index) => (
                <View key={expense.id}>
                  <CardPinExpenseRegular expense={expense} onPress={() => {}} />
                  {index < pin.expenses.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
          </View>
          <View style={styles.images}>
            <View style={styles.sectionHeader}>
              <ImageIcon size={24} color={color} />
              <UIText style={styles.sectionTitle} weight="600">
                Images
              </UIText>
            </View>
          </View>
          <View style={styles.docs}>
            <View style={styles.sectionHeader}>
              <FileTextIcon size={24} color={color} />
              <UIText style={styles.sectionTitle} weight="600">
                Documents
              </UIText>
            </View>
            <View style={styles.sectionCard}>
              {pin.documents.map((document, index) => (
                <View key={document.id}>
                  <CardPinDocumentRegular
                    document={document}
                    onPress={() => {}}
                  />
                  {index < pin.documents.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
          </View>
          <View style={styles.referenceLinks}>
            <View style={styles.sectionHeader}>
              <Link2Icon size={24} color={color} />
              <UIText style={styles.sectionTitle} weight="600">
                Reference Links
              </UIText>
            </View>
            <View style={styles.sectionCard}>
              {pin.referenceLinks.map((referenceLink, index) => (
                <View key={referenceLink.id}>
                  <CardPinReferenceLinkRegular
                    referenceLink={referenceLink}
                    onPress={() => {}}
                  />
                  {index < pin.referenceLinks.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
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
  sectionTitle: {
    fontSize: 18,
    color: getColor(colors.textLightGrey),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  map: {
    width: "100%",
    aspectRatio: 1.5,
    backgroundColor: "red",
  },
  info: {},
  location: {},
  notes: {},
  expenses: {},
  images: {},
  docs: {},
  referenceLinks: {},
  sectionCard: {
    gap: 12,
    ...getCardBasicStyle("md"),
  },
  divider: {
    height: 1,
    marginTop: 12,
    backgroundColor: getColor(colors.textLightGrey, 0.2),
  },
});
