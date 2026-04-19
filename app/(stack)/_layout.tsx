import { useAuthSession } from "@/hook/use-auth-session";
import { Stack } from "expo-router";

export default function Layout() {
  const { isAuthenticated } = useAuthSession();

  return (
    <Stack>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="user" options={{ headerShown: false }} />
        <Stack.Screen name="(stack)" options={{ headerShown: false }} />
        <Stack.Screen name="notes" options={{ headerShown: true }} />
        <Stack.Screen
          name="image-viewer"
          options={{
            presentation: "fullScreenModal",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="web-viewer"
          options={{
            presentation: "fullScreenModal",
            headerShown: false,
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen
          name="register"
          options={{ headerShown: false, presentation: "modal" }}
        />
      </Stack.Protected>
    </Stack>
  );
}
