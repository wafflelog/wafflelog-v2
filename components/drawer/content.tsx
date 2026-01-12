import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export function DrawerContent(props: DrawerContentComponentProps) {
  const links = [
    {
      label: "Companions",
      onPress: () => router.push("/companions"),
    },
    {
      label: "Checklist",
      onPress: () => router.push("/"),
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
      onPress: () => router.push("/"),
    },
    {
      label: "Pinned Notes",
      onPress: () => router.push("/"),
    },
    {
      label: "All Reference Links",
      onPress: () => router.push("/"),
    },
  ];

  return (
    <DrawerContentScrollView contentContainerStyle={styles.container}>
      {links.map((link) => (
        <TouchableOpacity key={link.label} onPress={link.onPress}>
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
