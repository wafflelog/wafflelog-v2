import { DrawerPin } from "@/components/drawer/pin";
import { useLocalSearchParams } from "expo-router";
import { Drawer } from "expo-router/drawer";

export default function Layout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Drawer
      drawerContent={(props) => {
        return <DrawerPin {...props} id={id} />;
      }}
      screenOptions={{
        drawerPosition: "right",
      }}
    >
      <Drawer.Screen name="index" options={{ headerShown: false }} />
    </Drawer>
  );
}
