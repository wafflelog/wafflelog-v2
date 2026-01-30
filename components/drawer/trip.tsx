import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import {
  DrawerItemRegular,
  type DrawerItem,
} from "@/components/drawer/item/regular";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
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
  ];

  return (
    <DrawerContentScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <TitleRegular size="xxl" weight="600" color={colors.waffle}>
          Wafflelog
        </TitleRegular>
      </View>
      <View style={styles.divider} />
      <View style={styles.links}>
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
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: gaps.sm,
    paddingVertical: gaps.sm,
  },
  content: {
    gap: gaps.lg,
  },
  links: {
    gap: 2,
  },
  header: {},
  divider: {
    height: 1,
    backgroundColor: getColor(colors.paleGrey, 0.5),
  },
});
