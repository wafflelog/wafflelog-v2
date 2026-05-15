import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
      <Stack.Screen
        name="notes"
        options={{ headerShown: true, presentation: "modal" }}
      />
    </Stack>
  );
}
