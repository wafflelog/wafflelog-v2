import { actionListAppNotifications } from "@/lib/supabase/actions";
import { useQuery } from "@tanstack/react-query";

export const getAppNotificationsQueryKey = (userId?: string) =>
  ["app-notifications", userId] as const;

export function useAppNotifications(userId?: string) {
  return useQuery({
    queryKey: getAppNotificationsQueryKey(userId),
    queryFn: () => actionListAppNotifications(),
    enabled: Boolean(userId),
  });
}
