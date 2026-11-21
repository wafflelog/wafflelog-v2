import {
  getPersistedAuthSession,
  supabase,
} from "@/lib/supabase/client";
import { type Session } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

type AuthSessionContextValue = {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let hasReceivedAuthEvent = false;

    const loadPersistedSession = async () => {
      try {
        const persistedSession = await getPersistedAuthSession();

        if (isMounted && !hasReceivedAuthEvent) {
          setSession(persistedSession);
        }
      } catch (error) {
        console.warn("Unable to restore the persisted auth session", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPersistedSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      hasReceivedAuthEvent = true;

      if (event === "INITIAL_SESSION" && !nextSession) {
        void getPersistedAuthSession()
          .then((persistedSession) => {
            if (isMounted) {
              setSession(persistedSession);
              setIsLoading(false);
            }
          })
          .catch((error) => {
            console.warn("Unable to restore the persisted auth session", error);

            if (isMounted) {
              setIsLoading(false);
            }
          });
        return;
      }

      if (isMounted) {
        setSession(nextSession ?? null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      isLoading,
      isAuthenticated: Boolean(session),
    }),
    [session, isLoading],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }

  return context;
}
