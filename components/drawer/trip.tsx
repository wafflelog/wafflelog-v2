import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface DrawerTripProps extends DrawerContentComponentProps {
  id?: string;
}

export function DrawerTrip({ id, navigation }: DrawerTripProps) {
  if (!id) {
    return null;
  }

  const links = [
    {
      label: "Back to Trip",
      onPress: () => router.push(`/trip/${id}`),
    },
    {
      label: "Trip Checklist",
      onPress: () => router.push(`/trip/${id}/checklist`),
    },
    {
      label: "Links",
      onPress: () => router.push(`/trip/${id}/links`),
    },
    {
      label: "Trip Documents",
      onPress: () => router.push(`/trip/${id}/documents`),
    },
    {
      label: "Trip Images",
      onPress: () => router.push(`/trip/${id}/images`),
    },
    {
      label: "Trip Expenses",
      onPress: () => router.push(`/trip/${id}/expenses`),
    },
    {
      label: "Trip Companions",
      onPress: () => router.push(`/trip/${id}/companions`),
    },
    {
      label: "Companions",
      onPress: () => {
        router.push("/companions");
      },
    },
    {
      label: "Checklist",
      onPress: () => router.push("/checklist"),
    },
    {
      label: "All Documents",
      onPress: () => router.push("/documents"),
    },
    {
      label: "All Expenses",
      onPress: () => router.push("/expenses"),
    },
    {
      label: "All Images",
      onPress: () => router.push("/images"),
    },
    {
      label: "Pinned Notes",
      onPress: () => router.push("/pinned-notes"),
    },
    {
      label: "All Reference Links",
      onPress: () => router.push("/reference-links"),
    },
  ];

  return (
    <DrawerContentScrollView contentContainerStyle={styles.container}>
      {links.map((link) => (
        <TouchableOpacity
          key={link.label}
          onPress={() => {
            link.onPress();
            navigation.closeDrawer();
          }}
        >
          <Text>{link.label}</Text>
        </TouchableOpacity>
      ))}
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
});
