import { ButtonFab } from "@/components/button/fab";
import { CardTripChecklistItem } from "@/components/card/checklist-item";
import { ConfirmActionDialog } from "@/components/dialog/confirm-action";
import { DialogNewChecklistItem } from "@/components/dialog/new-checklist-item";
import { EmptyState } from "@/components/ui/empty-state";
import { UITab } from "@/components/ui/tab";
import { colors, gaps, getColor, semanticColors } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useKnownTripsRefresh } from "@/hook/use-known-trips-refresh";
import { canDeleteChecklistItem } from "@/lib/helper/permissions";
import {
  actionListLocalChecklistItems,
  actionSoftDeleteLocalChecklistItem,
  actionToggleLocalChecklistItemCompleted,
} from "@/lib/sqlite/model/checklist-item";
import { actionGetLocalTrip } from "@/lib/sqlite/model/trip";
import { type ChecklistVisibility } from "@/types/trip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import {
  Plus as PlusIcon,
  ListChecks as ListChecksIcon,
  User as UserIcon,
  Users as UsersIcon,
} from "lucide-react-native";
import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";

type TabId = ChecklistVisibility;

export default function TripChecklistScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { session } = useAuthSession();
  const { isRefreshing, refreshKnownTrips } = useKnownTripsRefresh();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabId>("private");
  const [isDialogNewChecklistItemVisible, setIsDialogNewChecklistItemVisible] =
    useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [selectedChecklistItemId, setSelectedChecklistItemId] = useState<
    string | null
  >(null);

  const { data: checklistData } = useQuery({
    queryKey: ["local-checklist-items", String(tripId), session?.user.id],
    queryFn: () =>
      actionListLocalChecklistItems(String(tripId), session!.user.id),
    enabled: Boolean(tripId && session?.user.id),
  });

  const { data: localTrip } = useQuery({
    queryKey: ["local-trip", String(tripId), session?.user.id],
    queryFn: () => actionGetLocalTrip(String(tripId), session!.user.id),
    enabled: Boolean(tripId && session?.user.id),
  });
  const isTripOwner = localTrip?.userId === session?.user.id;

  const toggleChecklistItemMutation = useMutation({
    mutationFn: actionToggleLocalChecklistItemCompleted,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "local-checklist-items",
          String(tripId),
          session?.user.id,
        ],
      });
    },
  });

  const softDeleteChecklistItemMutation = useMutation({
    mutationFn: (checklistItemId: string) =>
      actionSoftDeleteLocalChecklistItem(checklistItemId, session!.user.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [
          "local-checklist-items",
          String(tripId),
          session?.user.id,
        ],
      });
      setIsDeleteDialogVisible(false);
      setSelectedChecklistItemId(null);
    },
  });

  const tabs = [
    {
      id: "private" as TabId,
      label: "My Checklist",
      isActive: activeTab === "private",
      icon: (color: string) => <UserIcon size={24} color={color} />,
    },
    {
      id: "trip" as TabId,
      label: "Trip Checklist",
      isActive: activeTab === "trip",
      icon: (color: string) => <UsersIcon size={24} color={color} />,
    },
  ];
  const visibleChecklistItems = (checklistData ?? []).filter(
    (item) => item.visibility === activeTab,
  );

  return (
    <View style={styles.container}>
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
        data={visibleChecklistItems}
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
            icon={
              <ListChecksIcon size={24} color={getColor(colors.purple)} />
            }
            title={
              activeTab === "private"
                ? "Nothing on your checklist yet"
                : "Nothing on the trip checklist yet"
            }
            message={
              activeTab === "private"
                ? "Add anything you want to remember for this trip."
                : "Checklist items shared within this trip will appear here."
            }
          />
        }
        renderItem={({ item }) => (
          <CardTripChecklistItem
            checklistItem={item}
            onPress={() => toggleChecklistItemMutation.mutate(item.id)}
            onDeletePress={
              canDeleteChecklistItem({
                currentUserId: session?.user.id,
                entityUserId: item.userId,
                isTripOwner,
                visibility: item.visibility,
              })
                ? () => {
                    setSelectedChecklistItemId(item.id);
                    setIsDeleteDialogVisible(true);
                  }
                : undefined
            }
          />
        )}
      />

      <ButtonFab
        onPress={() => {
          setIsDialogNewChecklistItemVisible(true);
        }}
        text={activeTab === "private" ? "New Personal Item" : "New Trip Item"}
        icon={(color) => <PlusIcon size={20} color={color} />}
      />
      <DialogNewChecklistItem
        tripId={String(tripId)}
        visible={isDialogNewChecklistItemVisible}
        visibility={activeTab}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.screen,
  },
  tabs: {
    gap: gaps.md,
    backgroundColor: semanticColors.surface,
    padding: gaps.md,
    flexDirection: "row",
  },
  tab: {
    flex: 1,
  },
  checklist: {
    flexGrow: 1,
    gap: gaps.md,
    padding: gaps.md,
  },
});
