import { GlobalAppNotifications } from "@/components/global/app-notifications";
import { DataBootstrapGate } from "@/components/global/data-bootstrap-gate";
import { DatabaseInitializationGate } from "@/components/global/database-initialization-gate";
import { GlobalDataSyncMessages } from "@/components/global/data-sync-messages";
import { DataSyncProvider } from "@/components/global/data-sync-provider";
import { AuthSessionProvider } from "@/hook/use-auth-session";
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  useFonts,
} from "@expo-google-fonts/montserrat";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
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

  return (
    <QueryClientProvider client={queryClient}>
      <DatabaseInitializationGate>
        <AuthSessionProvider>
          <DataSyncProvider>
            <GlobalAppNotifications />
            <GlobalDataSyncMessages />
            <DataBootstrapGate>
              <KeyboardProvider>
                <Stack>
                  <Stack.Screen
                    name="(stack)"
                    options={{ headerShown: false }}
                  />
                </Stack>
              </KeyboardProvider>
            </DataBootstrapGate>
          </DataSyncProvider>
        </AuthSessionProvider>
      </DatabaseInitializationGate>
    </QueryClientProvider>
  );
}
