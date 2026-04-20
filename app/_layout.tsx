import { AuthSessionProvider } from "@/hook/use-auth-session";
import { initializeDatabase } from "@/lib/sqlite/init";
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  useFonts,
} from "@expo-google-fonts/montserrat";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  useEffect(() => {
    initializeDatabase().catch((error) => {
      console.error("Failed to initialize SQLite database", error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider>
        <KeyboardProvider>
          <Stack>
            <Stack.Screen name="(stack)" options={{ headerShown: false }} />
          </Stack>
        </KeyboardProvider>
      </AuthSessionProvider>
    </QueryClientProvider>
  );
}
