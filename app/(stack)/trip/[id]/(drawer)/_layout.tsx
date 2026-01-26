import { DrawerTrip } from "@/components/drawer/trip";
import { useLocalSearchParams } from "expo-router";
import { Drawer } from "expo-router/drawer";

export default function Layout() {
  // Get id from route params (available because we're nested under trip/[id])
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Drawer
      drawerContent={(props) => {
        return <DrawerTrip {...props} id={id} />;
      }}
      screenOptions={{
        drawerPosition: "right",
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Trip",
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="checklist"
        options={{
          title: "Checklist",
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="links"
        options={{
          title: "Links",
          headerShown: false,
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
    </Drawer>
  );
}
