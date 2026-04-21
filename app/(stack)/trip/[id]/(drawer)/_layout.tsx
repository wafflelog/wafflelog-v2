import { DrawerTrip } from "@/components/drawer/trip";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { Text, TouchableOpacity } from "react-native";

export default function Layout() {
  // Get id from route params (available because we're nested under trip/[id])
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <Drawer
      drawerContent={(props) => {
        return <DrawerTrip {...props} id={id} />;
      }}
      screenOptions={{
        drawerPosition: "right",
        headerLeft: (props) => (
          <TouchableOpacity onPress={() => router.back()}>
            <Text>Go Back</Text>
          </TouchableOpacity>
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
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="images"
        options={{
          title: "Images",
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="expenses"
        options={{
          title: "Expenses",
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="companions"
        options={{
          title: "Companions",
          headerShown: false,
        }}
      />
    </Drawer>
  );
}
