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
          name="trip/[tripId]/(drawer)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="trip/[tripId]/map"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="pin/[pinId]/(stack)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="notes"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="notification-center"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="settings/index" options={{ headerShown: false }} />
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
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
          }}
        />
        {/* <Stack.Screen name="(stack)" options={{ headerShown: false }} /> */}
        <Stack.Screen
          name="image-viewer"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="web-viewer"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
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
