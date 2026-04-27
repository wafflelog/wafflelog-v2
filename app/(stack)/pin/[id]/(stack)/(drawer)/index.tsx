import { CardDocument } from "@/components/card/document";
import { HeaderPin } from "@/components/header/pin";
import { UIText } from "@/components/ui/text";
import { CATEGORIES } from "@/data/pins";
import { useAuthSession } from "@/hook/use-auth-session";
import { actionGetLocalPin } from "@/lib/sqlite/model/pin";
import { type Pin } from "@/types/pin";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ButtonAdd } from "@/components/button/add";
import { CardExpenseRegular } from "@/components/card/expense/regular";
import { CardImageRegular } from "@/components/card/image/regular";
import { CardPinLocationRegular } from "@/components/card/pin/location/regular";
import { CardPinReferenceLinkRegular } from "@/components/card/reference-link/regular";
import { DialogNewReferenceLink } from "@/components/dialog/new-reference-link";
import { TitleRegular } from "@/components/title/regular";
import { colors, getCardBasicStyle, getColor } from "@/constants/theme";
import { actionListLocalReferenceLinksByPin } from "@/lib/sqlite/model/reference-link";
import {
  FileText as FileTextIcon,
  Image as ImageIcon,
  Link2 as Link2Icon,
  MapPin as MapPinIcon,
  SquarePen as SquarePenIcon,
  Wallet as WalletIcon,
} from "lucide-react-native";
import { useState } from "react";

export default function PinIndexScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuthSession();
  const color = getColor(colors.purple);
  const navigation = useNavigation();
  const [isDialogNewReferenceLinkOpen, setIsDialogNewReferenceLinkOpen] =
    useState(false);

  const { data: localPin } = useQuery({
    queryKey: ["local-pin", String(id), session?.user.id],
    queryFn: () => actionGetLocalPin(String(id), session!.user.id),
    enabled: Boolean(id && session?.user.id),
  });
  const { data: localReferenceLinks = [] } = useQuery({
    queryKey: ["local-reference-links", String(id), session?.user.id],
    queryFn: () => actionListLocalReferenceLinksByPin(String(id), session!.user.id),
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
          id: `location-${localPin.id}`,
          name: "Unknown location",
          address: "",
          latitude: 0,
          longitude: 0,
        },
        time: dayjs(`${localPin.date} ${localPin.time}`).toISOString(),
        referenceLinks: localReferenceLinks.map((referenceLink) => ({
          id: referenceLink.id,
          title: referenceLink.title ?? referenceLink.url,
          url: referenceLink.url,
          caption: referenceLink.caption ?? undefined,
        })),
        documents: [],
        expenses: [],
        images: [],
      }
    : null;

  if (!pin) {
    return <UIText>Pin not found</UIText>;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <HeaderPin
        pin={pin}
        onBackPress={() => router.back()}
        onMorePress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      />

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
                router.push(`/place-search`);
              }}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <WalletIcon size={24} color={color} />
              <TitleRegular size="md" weight="600">
                Expenses
              </TitleRegular>
            </View>
            <View style={styles.sectionCard}>
              {pin.expenses.map((expense, index) => (
                <View key={expense.id}>
                  <CardExpenseRegular expense={expense} onPress={() => {}} />
                  {index < pin.expenses.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
            <ButtonAdd text="Add Expense" onPress={() => {}} />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ImageIcon size={24} color={color} />
              <TitleRegular size="md" weight="600">
                Images
              </TitleRegular>
            </View>
            <View style={styles.sectionCard}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageList}
              >
                {pin.images.map((image) => (
                  <View key={image.id} style={styles.imageCard}>
                    <CardImageRegular image={image} onPress={() => {}} />
                  </View>
                ))}
                <ButtonAdd
                  style={styles.addImageButton}
                  text="Add Image"
                  onPress={() => {}}
                />
              </ScrollView>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileTextIcon size={24} color={color} />
              <TitleRegular size="md" weight="600">
                Documents
              </TitleRegular>
            </View>
            <View style={styles.sectionCard}>
              {pin.documents.map((document, index) => (
                <View key={document.id}>
                  <CardDocument document={document} variant="regular" />
                  {index < pin.documents.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
            <ButtonAdd text="Add Document" onPress={() => {}} />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Link2Icon size={24} color={color} />
              <TitleRegular size="md" weight="600">
                Reference Links
              </TitleRegular>
            </View>
            <View style={styles.sectionCard}>
              {pin.referenceLinks.map((referenceLink, index) => (
                <View key={referenceLink.id}>
                  <CardPinReferenceLinkRegular referenceLink={referenceLink} />
                  {index < pin.referenceLinks.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
            <ButtonAdd
              text="Add Reference Link"
              onPress={() => {
                setIsDialogNewReferenceLinkOpen(true);
              }}
            />
          </View>
        </View>
      </ScrollView>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/pin/${id}/notes`)}
        activeOpacity={0.8}
      >
        <SquarePenIcon size={24} color="#fff" />
      </TouchableOpacity>
      <DialogNewReferenceLink
        pinId={localPin?.id}
        tripId={localPin?.tripId}
        visible={isDialogNewReferenceLinkOpen}
        onDismiss={() => setIsDialogNewReferenceLinkOpen(false)}
      />
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
  imageList: {
    gap: 12,
  },
  imageCard: {
    width: 120,
    height: 120,
    backgroundColor: "red",
  },
  section: {
    gap: 6,
  },
  sectionCard: {
    gap: 12,
    ...getCardBasicStyle("sm"),
  },
  divider: {
    height: 1,
    marginTop: 12,
    backgroundColor: getColor(colors.textLightGrey, 0.2),
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
  addImageButton: {
    width: 120,
    flexDirection: "column",
  },
});
