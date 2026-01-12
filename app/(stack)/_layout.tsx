import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen name="trip" />
      <Stack.Screen name="pin" />
      <Stack.Screen name="user" />
      <Stack.Screen name="place-search" />
      <Stack.Screen
        name="comments"
        options={{
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
