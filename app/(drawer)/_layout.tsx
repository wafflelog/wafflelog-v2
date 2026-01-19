import { DrawerContent } from "@/components/drawer/content";
import { Drawer } from "expo-router/drawer";

export default function Layout() {
  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        drawerPosition: "right",
      }}
    >
      <Drawer.Screen
        name="(stack)"
        options={{
          drawerLabel: "Home",
          title: "Home",
          headerShown: false,
        }}
      />
    </Drawer>
  );
}
