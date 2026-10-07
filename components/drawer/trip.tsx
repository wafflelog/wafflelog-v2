import { router, usePathname } from "expo-router";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "expo-router/drawer";
import { StyleSheet, View } from "react-native";

import {
  DrawerItemRegular,
  type DrawerItem,
} from "@/components/drawer/item/regular";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, semanticColors } from "@/constants/theme";
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
  tripId?: string;
}

export function DrawerTrip({ tripId, navigation }: DrawerTripProps) {
  const pathname = usePathname();

  if (!tripId) {
    return null;
  }

  const tripBasePath = `/trip/${tripId}`;

  const links: (DrawerItem & { href: string })[] = [
    {
      label: "Overview",
      icon: (color) => <LayoutDashboardIcon size={20} color={color} />,
      href: tripBasePath,
      onPress: () => router.push(`/trip/${tripId}`),
    },
    {
      label: "Checklist",
      icon: (color) => <ListCheckIcon size={20} color={color} />,
      href: `${tripBasePath}/checklist`,
      onPress: () => router.push(`/trip/${tripId}/checklist`),
    },
    {
      label: "Links",
      icon: (color) => <Link2Icon size={20} color={color} />,
      href: `${tripBasePath}/links`,
      onPress: () => router.push(`/trip/${tripId}/links`),
    },
    {
      label: "Documents",
      icon: (color) => <FileTextIcon size={20} color={color} />,
      href: `${tripBasePath}/documents`,
      onPress: () => router.push(`/trip/${tripId}/documents`),
    },
    {
      label: "Images",
      icon: (color) => <ImageIcon size={20} color={color} />,
      href: `${tripBasePath}/images`,
      onPress: () => router.push(`/trip/${tripId}/images`),
    },
    {
      label: "Expenses",
      icon: (color) => <WalletIcon size={20} color={color} />,
      href: `${tripBasePath}/expenses`,
      onPress: () => router.push(`/trip/${tripId}/expenses`),
    },
    {
      label: "Companions",
      icon: (color) => <UsersIcon size={20} color={color} />,
      href: `${tripBasePath}/companions`,
      onPress: () => router.push(`/trip/${tripId}/companions`),
    },
    {
      label: "Settings",
      icon: (color) => <SettingsIcon size={20} color={color} />,
      href: `${tripBasePath}/settings`,
      onPress: () => router.push(`/trip/${tripId}/settings`),
    },
  ];

  return (
    <DrawerContentScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <TitleRegular size="xxl" weight="700" color={colors.textDarkGrey}>
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
    backgroundColor: semanticColors.screen,
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
    backgroundColor: semanticColors.brandDivider,
  },
});
