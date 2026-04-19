import { ButtonFab } from "@/components/button/fab";
import { CardTripChecklistItem } from "@/components/card/checklist-item";
import { DialogNewChecklistItem } from "@/components/dialog/new-checklist-item";
import { HeaderTrip } from "@/components/header/trip";
import { UITab } from "@/components/ui/tab";
import { UIText } from "@/components/ui/text";
import { gaps } from "@/constants/theme";
import { TRIPS } from "@/data";
import { ChecklistItem } from "@/types/trip";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Plus as PlusIcon,
  User as UserIcon,
  Users as UsersIcon,
} from "lucide-react-native";
import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabId = "my" | "public";

export default function TripChecklistScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState<TabId>("my");
  const [isDialogNewChecklistItemVisible, setIsDialogNewChecklistItemVisible] =
    useState(false);

  const trip = TRIPS.find((trip) => trip.id === id);

  if (!trip) {
    return <UIText>Trip not found</UIText>;
  }

  const tabs = [
    {
      id: "my" as TabId,
      label: "My Checklist",
      isActive: activeTab === "my",
      icon: (color: string) => <UserIcon size={24} color={color} />,
    },
    {
      id: "public" as TabId,
      label: "Public Checklist",
      isActive: activeTab === "public",
      icon: (color: string) => <UsersIcon size={24} color={color} />,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <HeaderTrip
        trip={trip}
        onBackPress={() => router.back()}
        onMorePress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      />
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <UITab
            key={tab.id}
            text={tab.label}
            icon={tab.icon}
            onPress={() => setActiveTab(tab.id)}
            isActive={tab.isActive}
            style={styles.tab}
          />
        ))}
      </View>

      <FlatList
        contentContainerStyle={styles.checklist}
        data={trip.checklistItems as ChecklistItem[]}
        renderItem={({ item }) => (
          <CardTripChecklistItem checklistItem={item} onPress={() => {}} />
        )}
      />

      <ButtonFab
        onPress={() => {
          setIsDialogNewChecklistItemVisible(true);
        }}
        text="New Item"
        icon={(color) => <PlusIcon size={20} color={color} />}
      />
      <DialogNewChecklistItem
        visible={isDialogNewChecklistItemVisible}
        onDismiss={() => setIsDialogNewChecklistItemVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    gap: gaps.md,
    backgroundColor: "white",
    padding: gaps.md,
    flexDirection: "row",
  },
  tab: {
    flex: 1,
  },
  checklist: {
    gap: gaps.md,
    padding: gaps.md,
  },
});
