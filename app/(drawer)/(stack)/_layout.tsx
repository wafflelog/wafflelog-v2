import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="trip" options={{ headerShown: false }} />
      <Stack.Screen name="trip/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="pin" options={{ headerShown: false }} />
      <Stack.Screen name="pin/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="place-search" />
      <Stack.Screen name="companions" options={{ headerShown: false }} />
      <Stack.Screen name="documents" options={{ headerShown: false }} />
      <Stack.Screen name="expenses" options={{ headerShown: false }} />
      <Stack.Screen name="images" options={{ headerShown: false }} />
      <Stack.Screen name="reference-links" options={{ headerShown: false }} />
      <Stack.Screen name="checklist" options={{ headerShown: false }} />
      <Stack.Screen name="pinned-notes" options={{ headerShown: false }} />
      <Stack.Screen
        name="notes"
        options={{
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
