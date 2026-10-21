import { useAuthSession } from "@/hook/use-auth-session";
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  suspendAnalyticsCollection,
  type AnalyticsConsentPreference,
} from "@/lib/analytics-consent";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

type AnalyticsConsentStatus =
  | "loading"
  | "not-determined"
  | AnalyticsConsentPreference;

type AnalyticsConsentContextValue = {
  status: AnalyticsConsentStatus;
  isEnabled: boolean;
  hasChoice: boolean;
  isUpdating: boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
};

const AnalyticsConsentContext =
  createContext<AnalyticsConsentContextValue | null>(null);

export function AnalyticsConsentProvider({ children }: PropsWithChildren) {
  const { session, isLoading: isAuthLoading } = useAuthSession();
  const userId = session?.user.id;
  const previousUserId = useRef<string | undefined>(undefined);
  const [status, setStatus] = useState<AnalyticsConsentStatus>("loading");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    let isActive = true;
    const priorUserId = previousUserId.current;
    previousUserId.current = userId;

    const loadConsent = async () => {
      const didUserChange = Boolean(priorUserId && priorUserId !== userId);
      await suspendAnalyticsCollection(didUserChange);

      if (!isActive) {
        return;
      }

      if (!userId) {
        setStatus("loading");
        return;
      }

      const storedPreference = await getAnalyticsConsent(userId);

      if (!isActive) {
        return;
      }

      if (storedPreference === "enabled") {
        await setAnalyticsConsent(userId, true);
      }

      if (isActive) {
        setStatus(storedPreference ?? "not-determined");
      }
    };

    void loadConsent().catch((error) => {
      if (__DEV__) {
        console.warn("Unable to load analytics preference", error);
      }

      if (isActive) {
        setStatus("not-determined");
      }
    });

    return () => {
      isActive = false;
    };
  }, [isAuthLoading, userId]);

  const setEnabled = useCallback(
    async (enabled: boolean) => {
      if (!userId) {
        return;
      }

      setIsUpdating(true);

      try {
        await setAnalyticsConsent(userId, enabled);
        setStatus(enabled ? "enabled" : "disabled");
      } finally {
        setIsUpdating(false);
      }
    },
    [userId],
  );

  const value = useMemo(
    () => ({
      status,
      isEnabled: status === "enabled",
      hasChoice: status === "enabled" || status === "disabled",
      isUpdating,
      setEnabled,
    }),
    [isUpdating, setEnabled, status],
  );

  return (
    <AnalyticsConsentContext.Provider value={value}>
      {children}
    </AnalyticsConsentContext.Provider>
  );
}

export function useAnalyticsConsent() {
  const context = useContext(AnalyticsConsentContext);

  if (!context) {
    throw new Error(
      "useAnalyticsConsent must be used within AnalyticsConsentProvider",
    );
  }

  return context;
}
