import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="trip" />
      <Stack.Screen name="pin" />
      <Stack.Screen name="place-search" />
      <Stack.Screen name="companions" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="expenses" />
      <Stack.Screen
        name="notes"
        options={{
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
