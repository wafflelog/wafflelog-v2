import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { router, usePathname } from "expo-router";
import { StyleSheet, View } from "react-native";

import {
  DrawerItemRegular,
  type DrawerItem,
} from "@/components/drawer/item/regular";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import {
  FileTextIcon,
  ImageIcon,
  LayoutDashboardIcon,
  Link2Icon,
  ListCheckIcon,
  SettingsIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react-native";

interface DrawerTripProps extends DrawerContentComponentProps {
  id?: string;
}

export function DrawerTrip({ id, navigation }: DrawerTripProps) {
  const pathname = usePathname();

  if (!id) {
    return null;
  }

  const tripBasePath = `/trip/${id}`;

  const links: (DrawerItem & { href: string })[] = [
    {
      label: "Overview",
      icon: (color) => <LayoutDashboardIcon size={20} color={color} />,
      href: tripBasePath,
      onPress: () => router.push(`/trip/${id}`),
    },
    {
      label: "Checklist",
      icon: (color) => <ListCheckIcon size={20} color={color} />,
      href: `${tripBasePath}/checklist`,
      onPress: () => router.push(`/trip/${id}/checklist`),
    },
    {
      label: "Links",
      icon: (color) => <Link2Icon size={20} color={color} />,
      href: `${tripBasePath}/links`,
      onPress: () => router.push(`/trip/${id}/links`),
    },
    {
      label: "Documents",
      icon: (color) => <FileTextIcon size={20} color={color} />,
      href: `${tripBasePath}/documents`,
      onPress: () => router.push(`/trip/${id}/documents`),
    },
    {
      label: "Images",
      icon: (color) => <ImageIcon size={20} color={color} />,
      href: `${tripBasePath}/images`,
      onPress: () => router.push(`/trip/${id}/images`),
    },
    {
      label: "Expenses",
      icon: (color) => <WalletIcon size={20} color={color} />,
      href: `${tripBasePath}/expenses`,
      onPress: () => router.push(`/trip/${id}/expenses`),
    },
    {
      label: "Companions",
      icon: (color) => <UsersIcon size={20} color={color} />,
      href: `${tripBasePath}/companions`,
      onPress: () => router.push(`/trip/${id}/companions`),
    },
    {
      label: "Settings",
      icon: (color) => <SettingsIcon size={20} color={color} />,
      href: `${tripBasePath}/settings`,
      onPress: () => router.push(`/trip/${id}/settings`),
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
            key={link.href}
            item={{
              ...link,
              isActive: pathname === link.href,
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
