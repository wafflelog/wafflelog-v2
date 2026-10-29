import { removeCurrentPushDevice } from "@/lib/notifications/push-device";
import { supabase } from "@/lib/supabase/client";

type SignOutDependencies = {
  removePushDevice: () => Promise<void>;
  signOut: () => Promise<void>;
};

const defaultDependencies: SignOutDependencies = {
  removePushDevice: removeCurrentPushDevice,
  signOut: async () => {
    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      throw error;
    }
  },
};

export async function actionSignOutCurrentDevice(
  dependencies: SignOutDependencies = defaultDependencies,
) {
  try {
    await dependencies.removePushDevice();
  } catch (error) {
    console.warn("Unable to remove push device during sign out", error);
  }

  await dependencies.signOut();
}
