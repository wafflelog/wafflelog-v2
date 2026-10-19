import { planningApiClient } from "@/lib/ai-trip-planning/client";
import { clearLocalMediaFiles } from "@/lib/media/local-file";
import { actionClearLocalData } from "@/lib/sqlite/clear-local-data";
import { supabase } from "@/lib/supabase/client";

type DeleteAccountOptions = {
  clearClientCache?: () => void | Promise<void>;
};

type DeleteAccountDependencies = {
  deletePlanningData: () => Promise<void>;
  deleteSupabaseAccount: () => Promise<void>;
  signOut: () => Promise<void>;
  clearLocalData: () => Promise<void>;
  clearLocalMediaFiles: () => Promise<void>;
};

const defaultDependencies: DeleteAccountDependencies = {
  deletePlanningData: () => planningApiClient.deletePlanningData(),
  deleteSupabaseAccount: async () => {
    const { data, error } = await supabase.functions.invoke<{ ok: true }>(
      "delete-account",
      { method: "POST" },
    );

    if (error) {
      throw error;
    }

    if (data?.ok !== true) {
      throw new Error("Account deletion was not confirmed");
    }
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      throw error;
    }
  },
  clearLocalData: actionClearLocalData,
  clearLocalMediaFiles,
};

export async function actionDeleteAccount(
  options: DeleteAccountOptions = {},
  dependencies: DeleteAccountDependencies = defaultDependencies,
) {
  await dependencies.deletePlanningData();
  await dependencies.deleteSupabaseAccount();
  await options.clearClientCache?.();
  await dependencies.signOut();

  const cleanupResults = await Promise.allSettled([
    dependencies.clearLocalData(),
    dependencies.clearLocalMediaFiles(),
  ]);

  for (const cleanupResult of cleanupResults) {
    if (cleanupResult.status === "rejected") {
      console.error("Unable to clear deleted account data from this device", cleanupResult.reason);
    }
  }
}
