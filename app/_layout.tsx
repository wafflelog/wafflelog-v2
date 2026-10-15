import { GlobalAppNotifications } from "@/components/global/app-notifications";
import { DataBootstrapGate } from "@/components/global/data-bootstrap-gate";
import { GlobalDataSyncMessages } from "@/components/global/data-sync-messages";
import { DataSyncProvider } from "@/components/global/data-sync-provider";
import { DatabaseInitializationGate } from "@/components/global/database-initialization-gate";
import { RevenueCatInitialization } from "@/components/global/revenuecat-initialization";
import { AuthSessionProvider } from "@/hook/use-auth-session";
import { useRouteChange } from "@/hook/use-route-change";
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

import { sendScreenViewEvent } from "@/lib/tracking";

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

  useRouteChange((from, to) => {
    sendScreenViewEvent(from, to);
  });

  return (
    <QueryClientProvider client={queryClient}>
      <DatabaseInitializationGate>
        <AuthSessionProvider>
          <RevenueCatInitialization />
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
