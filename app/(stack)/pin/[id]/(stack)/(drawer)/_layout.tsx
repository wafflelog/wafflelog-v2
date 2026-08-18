import { DrawerPin } from "@/components/drawer/pin";
import { HeaderPin } from "@/components/header/pin";
import { semanticColors } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { actionGetLocalPin } from "@/lib/sqlite/model/pin";
import { DrawerActions } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";

export default function Layout() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
