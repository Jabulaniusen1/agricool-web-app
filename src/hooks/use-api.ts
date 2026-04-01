import useSWR, { SWRConfiguration } from "swr";
import { useAuthStore } from "@/stores/auth";

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
};

export function useApiCall<T>(
  key: string | null | undefined | false,
  fetcher: () => Promise<T>,
  config?: SWRConfiguration
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // Gate every API call behind authentication — prevents 401 cascades
  // when the session is stale or the user is logged out.
  const resolvedKey = isAuthenticated ? (key ?? null) : null;
  return useSWR<T>(resolvedKey, fetcher, { ...defaultConfig, ...config });
}
