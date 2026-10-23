import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import { ApiError } from "../ApiError.js";
import { TokenStorage } from "../../storage/TokenStorage.js";
import type { RetryableAxiosRequestConfig } from "../../types";

/**
 * @internal
 * Sets up auth interceptors on the given Axios instance.
 *
 * - **Request interceptor**: Attaches the access token as a Bearer token to every request.
 * - **Response interceptor**: On 401, silently refreshes the access token and retries
 *   the failed request. Queues concurrent 401s so only one refresh fires at a time.
 */
export function setupAuthInterceptor(
  instance: AxiosInstance,
  tokenStorage: TokenStorage,
  refreshTokenPath?: string,
  httpOnlyRefreshToken?: boolean
): void {
  // ─── Request Interceptor: Attach Access Token ───────────────────────────
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = tokenStorage.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: unknown) => Promise.reject(error)
  );

  // ─── Response Interceptor: Silent Token Refresh ─────────────────────────
  let isRefreshing = false;
  let refreshSubscribers: Array<(token: string) => void> = [];

  /**
   * Adds a callback to be invoked once the token has been refreshed.
   */
  function subscribeTokenRefresh(cb: (token: string) => void): void {
    refreshSubscribers.push(cb);
  }

  /**
   * Invokes all queued callbacks with the new token, then clears the queue.
   */
  function onTokenRefreshed(newToken: string): void {
    refreshSubscribers.forEach((cb) => cb(newToken));
    refreshSubscribers = [];
  }

  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: unknown) => {
      // Only handle Axios errors with 401 status
      if (!axios.isAxiosError(error) || error.response?.status !== 401) {
        return Promise.reject(error);
      }

      const originalRequest = error.config as RetryableAxiosRequestConfig | undefined;

      // Guard: no config available or already retried → reject
      if (!originalRequest || originalRequest._retry) {
        return Promise.reject(error);
      }

      // If no refresh path configured, skip refresh and reject
      if (!refreshTokenPath) {
        return Promise.reject(error);
      }

      // MONAGE-PATCH: Skip silent-refresh for auth endpoints themselves —
      // a 401 from `/auth/login` means the credentials are wrong, not that
      // the access token expired. Without this guard the interceptor would
      // overwrite the original "Email atau kata sandi salah" message with
      // a generic "Session expired" error.
      const reqUrl = originalRequest.url ?? "";
      const isAuthEndpoint =
        reqUrl.includes("/auth/login") ||
        reqUrl.includes("/auth/register") ||
        reqUrl.includes("/auth/refresh") ||
        reqUrl.includes("/auth/forgot-password") ||
        reqUrl.includes("/auth/reset-password");
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      // If already refreshing, queue this request to retry after refresh
      if (isRefreshing) {
        return new Promise<AxiosResponse>((resolve, reject) => {
          subscribeTokenRefresh((newToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            originalRequest._retry = true;
            instance.request(originalRequest).then(resolve).catch(reject);
          });
        });
      }

      // Start refresh — flag the request as retried *before* setting the
      // global refresh flag so the request is correctly marked even if a
      // synchronous error short-circuits the refresh.
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        let refreshToken: string | null = null;

        if (!httpOnlyRefreshToken) {
          refreshToken = tokenStorage.getRefreshToken();

          if (!refreshToken) {
            tokenStorage.clearAll();
            throw new ApiError({
              message: "No refresh token available. Session expired.",
              status: 401,
              code: "SESSION_EXPIRED",
              originalError: error,
            });
          }
        }

        // Call refresh endpoint
        const refreshResponse = await axios.post<{ accessToken: string }>(
          `${instance.defaults.baseURL ?? ""}${refreshTokenPath}`,
          httpOnlyRefreshToken ? {} : { refreshToken },
          {
            // Don't use the instance (it would attach the old token & trigger interceptors)
            headers: { "Content-Type": "application/json" },
            withCredentials: httpOnlyRefreshToken ? true : undefined,
          }
        );

        const newAccessToken = refreshResponse.data.accessToken;
        tokenStorage.setAccessToken(newAccessToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // Notify all queued requests
        onTokenRefreshed(newAccessToken);

        return instance.request(originalRequest);
      } catch (refreshError: unknown) {
        // If refresh itself failed, clear tokens and throw SESSION_EXPIRED
        refreshSubscribers = [];
        tokenStorage.clearAll();

        // If it's already an ApiError (from our check above), rethrow it
        if (refreshError instanceof ApiError) {
          throw refreshError;
        }

        throw new ApiError({
          message: "Token refresh failed. Session expired.",
          status: 401,
          code: "SESSION_EXPIRED",
          originalError: refreshError,
        });
      } finally {
        isRefreshing = false;
      }
    }
  );
}
