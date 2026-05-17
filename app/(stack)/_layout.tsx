import { useAuthSession } from "@/hook/use-auth-session";
import { Stack } from "expo-router";

export default function Layout() {
  const { isAuthenticated } = useAuthSession();

  return (
    <Stack>
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
          name="notification-center"
          options={{ headerShown: false }}
        />
        {/* <Stack.Screen name="(stack)" options={{ headerShown: false }} /> */}
        <Stack.Screen
          name="image-viewer"
          options={{
            presentation: "fullScreenModal",
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="web-viewer"
          options={{
            presentation: "modal",
            headerShown: true,
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
