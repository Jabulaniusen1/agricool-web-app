import { coldtivateService } from "@/services/coldtivate-service";
import { useAuthStore } from "@/stores/auth";
import { useApiCall } from "./use-api";

export function useNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useApiCall(
    isAuthenticated ? "notifications" : null,
    () => coldtivateService.getNotifications(),
    { refreshInterval: 30_000 }
  );
}
