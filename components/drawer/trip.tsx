import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { router } from "expo-router";
import { StyleSheet } from "react-native";

import {
  DrawerItemRegular,
  type DrawerItem,
} from "@/components/drawer/item/regular";
import {
  ChevronRightIcon,
  FileTextIcon,
  ImageIcon,
  Link2Icon,
  ListCheckIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react-native";
import { useState } from "react";

interface DrawerTripProps extends DrawerContentComponentProps {
  id?: string;
}

export function DrawerTrip({ id, navigation }: DrawerTripProps) {
  const [activeLink, setActiveLink] = useState<string>("1");
  if (!id) {
    return null;
  }

  const links: (DrawerItem & { id: string })[] = [
    {
      id: "1",
      label: "Back to Trip",
      icon: (color) => <ChevronRightIcon size={20} color={color} />,
      onPress: () => router.push(`/trip/${id}`),
    },
    {
      id: "2",
      label: "Checklist",
      icon: (color) => <ListCheckIcon size={20} color={color} />,
      onPress: () => router.push(`/trip/${id}/checklist`),
    },
    {
      id: "3",
      label: "Links",
      icon: (color) => <Link2Icon size={20} color={color} />,
      onPress: () => router.push(`/trip/${id}/links`),
    },
    {
      id: "4",
      label: "Documents",
      icon: (color) => <FileTextIcon size={20} color={color} />,
      onPress: () => router.push(`/trip/${id}/documents`),
    },
    {
      id: "5",
      label: "Images",
      icon: (color) => <ImageIcon size={20} color={color} />,
      onPress: () => router.push(`/trip/${id}/images`),
    },
    {
      id: "6",
      label: "Expenses",
      icon: (color) => <WalletIcon size={20} color={color} />,
      onPress: () => router.push(`/trip/${id}/expenses`),
    },
    {
      id: "7",
      label: "Companions",
      icon: (color) => <UsersIcon size={20} color={color} />,
      onPress: () => router.push(`/trip/${id}/companions`),
    },
    {
      id: "8",
      label: "Companions",
      onPress: () => {
        router.push("/companions");
      },
    },
    {
      id: "9",
      label: "Checklist",
      onPress: () => router.push("/checklist"),
    },
    {
      id: "10",
      label: "All Documents",
      onPress: () => router.push("/documents"),
    },
    {
      id: "11",
      label: "All Expenses",
      onPress: () => router.push("/expenses"),
    },
    {
      id: "12",
      label: "All Images",
      onPress: () => router.push("/images"),
    },
    {
      id: "13",
      label: "Pinned Notes",
      onPress: () => router.push("/pinned-notes"),
    },
    {
      id: "14",
      label: "All Reference Links",
      onPress: () => router.push("/reference-links"),
    },
  ];

  return (
    <DrawerContentScrollView contentContainerStyle={styles.container}>
      {links.map((link) => (
        <DrawerItemRegular
          key={link.id}
          item={{
            ...link,
            isActive: activeLink === link.id,
            onPress: () => {
              setActiveLink(link.id);
              link.onPress();
            },
          }}
        />
      ))}
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 2,
  },
});
