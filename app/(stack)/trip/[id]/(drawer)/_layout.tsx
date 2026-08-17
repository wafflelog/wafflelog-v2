import { DrawerTrip } from "@/components/drawer/trip";
import {
  HeaderTripBackButton,
  HeaderTripMenuButton,
  HeaderTripTitle,
} from "@/components/header/trip";
import { semanticColors } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { actionGetLocalTrip } from "@/lib/sqlite/model/trip";
import { DrawerActions } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { StyleSheet } from "react-native";

const tripSectionTitles: Record<string, string> = {
  checklist: "Checklist",
  links: "Links",
  documents: "Documents",
  images: "Images",
  expenses: "Expenses",
  companions: "Companions",
  settings: "Settings",
};

export default function Layout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuthSession();

  const { data: localTrip } = useQuery({
    queryKey: ["local-trip", String(id), session?.user.id],
    queryFn: () => actionGetLocalTrip(String(id), session!.user.id),
    enabled: Boolean(id && session?.user.id),
  });

  return (
    <Drawer
      drawerContent={(props) => {
        return <DrawerTrip {...props} id={id} />;
      }}
      screenOptions={({ navigation, route }) => ({
        drawerPosition: "right",
        drawerStyle: { backgroundColor: semanticColors.screen },
        sceneStyle: { backgroundColor: semanticColors.screen },
        headerStyle: {
          backgroundColor: semanticColors.screen,
          borderBottomColor: semanticColors.neutralDivider,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
        headerLeftContainerStyle: { paddingLeft: 8 },
        headerRightContainerStyle: { paddingRight: 8 },
        headerTintColor: semanticColors.textPrimary,
        headerShadowVisible: false,
        headerTitle: () => (
          <HeaderTripTitle
            trip={localTrip}
            sectionTitle={tripSectionTitles[route.name]}
          />
        ),
        headerLeft: (props) => (
          <HeaderTripBackButton
            {...props}
            onPress={() => {
              router.back();
            }}
          />
        ),
        headerRight: () => (
          <HeaderTripMenuButton
            onPress={() => {
              navigation.dispatch(DrawerActions.toggleDrawer());
            }}
          />
        ),
      })}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Trip",
        }}
      />
      <Drawer.Screen
        name="checklist"
        options={{
          title: "Checklist",
        }}
      />
      <Drawer.Screen
        name="links"
        options={{
          title: "Links",
        }}
      />
      <Drawer.Screen
        name="documents"
        options={{
          title: "Documents",
        }}
      />
      <Drawer.Screen
        name="images"
        options={{
          title: "Images",
        }}
      />
      <Drawer.Screen
        name="expenses"
        options={{
          title: "Expenses",
        }}
      />
      <Drawer.Screen
        name="companions"
        options={{
          title: "Companions",
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Drawer>
  );
}
