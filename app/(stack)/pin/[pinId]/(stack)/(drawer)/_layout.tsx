import { DrawerPin } from "@/components/drawer/pin";
import { HeaderPin } from "@/components/header/pin";
import { semanticColors } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { actionGetLocalPin } from "@/lib/sqlite/model/pin";
import { useQuery } from "@tanstack/react-query";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { DrawerActions } from "expo-router/react-navigation";

export default function Layout() {
  const { pinId } = useGlobalSearchParams<{ pinId: string }>();
  const router = useRouter();
  const { session } = useAuthSession();

  const { data: localPin } = useQuery({
    queryKey: ["local-pin", String(pinId), session?.user.id],
    queryFn: () => actionGetLocalPin(String(pinId), session!.user.id),
    enabled: Boolean(pinId && session?.user.id),
  });

  console.log("localPin", pinId);

  return (
    <Drawer
      drawerContent={(props) => {
        return <DrawerPin {...props} pinId={pinId} />;
      }}
      screenOptions={({ navigation }) => ({
        drawerPosition: "right",
        drawerStyle: { backgroundColor: semanticColors.screen },
        sceneStyle: { backgroundColor: semanticColors.screen },
        headerShadowVisible: false,
        header: () => (
          <HeaderPin
            pin={localPin}
            onBackPress={() => {
              router.back();
            }}
            onMenuPress={() => {
              navigation.dispatch(DrawerActions.toggleDrawer());
            }}
          />
        ),
      })}
    >
      <Drawer.Screen name="index" options={{ headerShown: true }} />
    </Drawer>
  );
}
