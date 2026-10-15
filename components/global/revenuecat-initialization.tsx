import { useAuthSession } from "@/hook/use-auth-session";
import { getRevenueCatCatalogueSnapshot } from "@/lib/revenuecat/catalog";
import { syncRevenueCatIdentity } from "@/lib/revenuecat/client";
import { useEffect } from "react";

export function RevenueCatInitialization() {
  const { session, isLoading } = useAuthSession();
  const appUserId = session?.user.id ?? null;

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const initializeRevenueCat = async () => {
      await syncRevenueCatIdentity(appUserId);

      const catalogue = await getRevenueCatCatalogueSnapshot();

      if (catalogue) {
        console.info("[revenuecat] Catalogue loaded", catalogue);
      }
    };

    void initializeRevenueCat().catch((error) => {
      console.error("Unable to load the RevenueCat catalogue:", error);
    });
  }, [appUserId, isLoading]);

  return null;
}
