import { DrawerPin } from "@/components/drawer/pin";
import { HeaderPinBackButton, HeaderPinTitle } from "@/components/header/pin";
import { useAuthSession } from "@/hook/use-auth-session";
import { actionGetLocalPin } from "@/lib/sqlite/model/pin";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { useQuery } from "@tanstack/react-query";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";

export default function Layout() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuthSession();

  const { data: localPin } = useQuery({
    queryKey: ["local-pin", String(id), session?.user.id],
    queryFn: () => actionGetLocalPin(String(id), session!.user.id),
    enabled: Boolean(id && session?.user.id),
  });

  return (
    <Drawer
      drawerContent={(props) => {
        return <DrawerPin {...props} id={id} />;
      }}
      screenOptions={{
        drawerPosition: "right",
        headerTitle: (props) => <HeaderPinTitle {...props} pin={localPin} />,
        headerLeft: (props) => (
          <HeaderPinBackButton
            {...props}
            onPress={() => {
              console.log("Back button pressed", router.canGoBack());
              router.back();
            }}
          />
        ),
        headerRight: (props) => <DrawerToggleButton {...props} />,
      }}
    >
      <Drawer.Screen name="index" options={{ headerShown: true }} />
    </Drawer>
  );
}
