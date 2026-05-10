import { ButtonFab } from "@/components/button/fab";
import { CardTripChecklistItem } from "@/components/card/checklist-item";
import { ConfirmActionDialog } from "@/components/dialog/confirm-action";
import { DialogNewChecklistItem } from "@/components/dialog/new-checklist-item";
import { UITab } from "@/components/ui/tab";
import { gaps } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import {
  actionListLocalChecklistItems,
  actionSoftDeleteLocalChecklistItem,
  actionToggleLocalChecklistItemCompleted,
} from "@/lib/sqlite/model/checklist-item";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  const { session } = useAuthSession();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabId>("my");
  const [isDialogNewChecklistItemVisible, setIsDialogNewChecklistItemVisible] =
    useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [selectedChecklistItemId, setSelectedChecklistItemId] = useState<
    string | null
  >(null);

  const { data: checklistData } = useQuery({
    queryKey: ["local-checklist-items", String(id), session?.user.id],
    queryFn: () => actionListLocalChecklistItems(String(id), session!.user.id),
    enabled: Boolean(id && session?.user.id),
  });

  const toggleChecklistItemMutation = useMutation({
    mutationFn: actionToggleLocalChecklistItemCompleted,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["local-checklist-items", String(id), session?.user.id],
      });
    },
  });

  const softDeleteChecklistItemMutation = useMutation({
    mutationFn: (checklistItemId: string) =>
      actionSoftDeleteLocalChecklistItem(checklistItemId, session!.user.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["local-checklist-items", String(id), session?.user.id],
      });
      setIsDeleteDialogVisible(false);
      setSelectedChecklistItemId(null);
    },
  });

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
        data={checklistData}
        renderItem={({ item }) => (
          <CardTripChecklistItem
            checklistItem={item}
            onPress={() => toggleChecklistItemMutation.mutate(item.id)}
            onDeletePress={() => {
              setSelectedChecklistItemId(item.id);
              setIsDeleteDialogVisible(true);
            }}
          />
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
        tripId={String(id)}
        visible={isDialogNewChecklistItemVisible}
        onDismiss={() => setIsDialogNewChecklistItemVisible(false)}
      />
      <ConfirmActionDialog
        visible={isDeleteDialogVisible}
        title="Delete Checklist Item"
        message="Are you sure you want to delete this checklist item?"
        confirmText="Delete"
        onDismiss={() => {
          setIsDeleteDialogVisible(false);
          setSelectedChecklistItemId(null);
        }}
        onConfirm={() => {
          if (!selectedChecklistItemId) {
            return;
          }

          softDeleteChecklistItemMutation.mutate(selectedChecklistItemId);
        }}
        isPending={softDeleteChecklistItemMutation.isPending}
        confirmVariant="danger"
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
