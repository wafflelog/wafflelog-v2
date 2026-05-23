import { DrawerTrip } from "@/components/drawer/trip";
import {
  HeaderTripBackButton,
  HeaderTripTitle,
} from "@/components/header/trip";
import { useAuthSession } from "@/hook/use-auth-session";
import { actionGetLocalTrip } from "@/lib/sqlite/model/trip";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";

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
      screenOptions={{
        drawerPosition: "right",
        headerTitle: () => <HeaderTripTitle trip={localTrip} />,
        headerLeft: (props) => (
          <HeaderTripBackButton
            {...props}
            onPress={() => {
              router.back();
            }}
          />
        ),
        headerRight: () => <DrawerToggleButton />,
      }}
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
