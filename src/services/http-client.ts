import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { ENV } from "@/constants/environment";
import { ApiError } from "@/types/api.responses";

// ─── Case conversion helpers ──────────────────────────────────────────────────

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function convertKeys<T>(data: unknown, converter: (key: string) => string): T {
  if (Array.isArray(data)) {
    return data.map((item) => convertKeys(item, converter)) as T;
  }
  if (data !== null && typeof data === "object" && !(data instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[converter(key)] = convertKeys(value, converter);
    }
    return result as T;
  }
  return data as T;
}

// ─── Error extractor ──────────────────────────────────────────────────────────

function extractApiError(error: AxiosError): ApiError {
  const status = error.response?.status ?? 0;
  const data = error.response?.data as Record<string, unknown> | undefined;

  if (!data) {
    return { message: error.message || "Network error", status };
  }

  // Django REST Framework typically returns { detail: "..." } or { field: ["error"] }
  const detail = data.detail as string | undefined;
  if (detail) {
    return { message: detail, status };
  }

  const nonFieldErrors = data.non_field_errors as string[] | undefined;
  if (nonFieldErrors?.length) {
    return { message: nonFieldErrors[0], status, details: data as Record<string, string[]> };
  }

  // Collect field errors — including nested objects like { user: { phone: ["..."] } }
  const fieldErrors: Record<string, string[]> = {};
  let firstMessage = "An error occurred";
  let hasFirstMessage = false;

  function collectErrors(obj: Record<string, unknown>, prefix = "") {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (Array.isArray(value) && value.length > 0) {
        fieldErrors[fullKey] = value as string[];
        if (!hasFirstMessage) {
          firstMessage = String(value[0]);
          hasFirstMessage = true;
        }
      } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        collectErrors(value as Record<string, unknown>, fullKey);
      }
    }
  }

  collectErrors(data);

  return { message: firstMessage, status, details: fieldErrors };
}

// ─── JWT expiry helper ────────────────────────────────────────────────────────

function isTokenExpired(token: string, bufferSeconds = 30): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return Date.now() / 1000 >= (payload.exp as number) - bufferSeconds;
  } catch {
    return true; // treat malformed tokens as expired
  }
}

// ─── Create HTTP client factory ───────────────────────────────────────────────

let getAuthStore: (() => { tokens: { access: string; refresh: string } | null; revokeSession: () => void }) | null = null;
let refreshTokenFn: ((token: string) => Promise<{ access: string; refresh?: string }>) | null = null;
let onUnauthorized: (() => void) | null = null;

export function configureHttpClient(opts: {
  getAuth: () => { tokens: { access: string; refresh: string } | null; revokeSession: () => void };
  refreshToken: (token: string) => Promise<{ access: string; refresh?: string }>;
  onUnauthorized: () => void;
}) {
  getAuthStore = opts.getAuth;
  refreshTokenFn = opts.refreshToken;
  onUnauthorized = opts.onUnauthorized;
}

function createAxiosInstance(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 30_000,
    headers: { "Content-Type": "application/json" },
  });

  // Shared unauthorized notifier used by both request/response interceptors
  let unauthorizedFired = false;
  const fireUnauthorized = () => {
    if (unauthorizedFired) return;
    unauthorizedFired = true;
    onUnauthorized?.();
    // Reset after a short delay so future logins work
    setTimeout(() => { unauthorizedFired = false; }, 2000);
  };

  // Request: proactively refresh if access token is near expiry, then attach
  let proactiveRefreshing = false;
  let proactiveQueue: Array<(token: string | null) => void> = [];

  instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    if (getAuthStore && refreshTokenFn) {
      const auth = getAuthStore();
      const tokens = auth.tokens;

      if (tokens?.access) {
        if (isTokenExpired(tokens.access) && tokens.refresh && !isTokenExpired(tokens.refresh)) {
          // Access token expired but refresh is valid — proactively refresh
          if (proactiveRefreshing) {
            const newToken = await new Promise<string | null>((resolve) => {
              proactiveQueue.push(resolve);
            });
            if (newToken) config.headers["Authorization"] = `Bearer ${newToken}`;
          } else {
            proactiveRefreshing = true;
            try {
              const result = await refreshTokenFn(tokens.refresh);
              tokens.access = result.access;
              config.headers["Authorization"] = `Bearer ${result.access}`;
              proactiveQueue.forEach((cb) => cb(result.access));
            } catch {
              proactiveQueue.forEach((cb) => cb(null));
              // let the response interceptor handle the 401
            } finally {
              proactiveQueue = [];
              proactiveRefreshing = false;
            }
          }
        } else if (isTokenExpired(tokens.access)) {
          // Both access and refresh are unusable (or refresh missing): force logout now.
          fireUnauthorized();
        } else {
          config.headers["Authorization"] = `Bearer ${tokens.access}`;
        }
      }
    }

    if (config.data && typeof config.data === "object") {
      config.data = convertKeys(config.data, toSnakeCase);
    }
    if (config.params && typeof config.params === "object") {
      config.params = convertKeys(config.params, toSnakeCase);
    }

    return config;
  });

  // Response: convert keys to camelCase, handle 401
  let isRefreshing = false;
  type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void };
  let refreshQueue: QueueEntry[] = [];

  instance.interceptors.response.use(
    (response) => {
      if (response.data) {
        response.data = convertKeys(response.data, toCamelCase);
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes("token/refresh")) {
        const auth = getAuthStore?.();
        const refreshToken = auth?.tokens?.refresh;

        if (!refreshToken || !refreshTokenFn) {
          fireUnauthorized();
          return Promise.reject(extractApiError(error));
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            refreshQueue.push({
              resolve: (newToken: string) => {
                originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                resolve(instance(originalRequest));
              },
              reject,
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const result = await refreshTokenFn(refreshToken);
          const newAccess = result.access;
          // Patch the in-memory token so queued requests use the new token
          if (auth?.tokens) {
            auth.tokens.access = newAccess;
          }
          originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
          refreshQueue.forEach(({ resolve }) => resolve(newAccess));
          refreshQueue = [];
          return instance(originalRequest);
        } catch (refreshErr) {
          refreshQueue.forEach(({ reject }) => reject(refreshErr));
          refreshQueue = [];
          fireUnauthorized();
          return Promise.reject(extractApiError(error));
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(extractApiError(error));
    }
  );

  return instance;
}

// ─── Exported instances ───────────────────────────────────────────────────────

export const httpClient = createAxiosInstance(ENV.API_BASE_URL);
export const impactClient = createAxiosInstance(ENV.IMPACT_BASE_URL);
export const farmerImpactClient = createAxiosInstance(ENV.FARMER_IMPACT_BASE_URL);
