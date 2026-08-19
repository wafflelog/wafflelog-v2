import { semanticColors } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { Stack } from "expo-router";

export default function Layout() {
  const { isAuthenticated } = useAuthSession();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: semanticColors.screen },
        headerShown: false,
      }}
    >
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="user" options={{ headerShown: false }} />
        <Stack.Screen
          name="trip/[id]/(drawer)"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="trip/[id]/map" options={{ headerShown: false }} />
        <Stack.Screen name="pin/[id]/(stack)" options={{ headerShown: false }} />
        <Stack.Screen
          name="notes"
          options={{
            presentation: "modal",
            title: "Notes",
          }}
        />
        <Stack.Screen
          name="notification-center"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="settings/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ai-trip-planner"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="user-search"
          options={{ headerShown: false, presentation: "modal" }}
        />
        {/* <Stack.Screen name="(stack)" options={{ headerShown: false }} /> */}
        <Stack.Screen
          name="image-viewer"
          options={{
            presentation: "fullScreenModal",
          }}
        />
        <Stack.Screen
          name="web-viewer"
          options={{
            presentation: "modal",
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
