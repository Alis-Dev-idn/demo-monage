import type { AxiosInstance, AxiosResponse } from "axios";
import axios from "axios";
import { ApiError } from "../ApiError.js";
import { NotifyKit } from "../../../notify/core/NotifyKit";
import { notify } from "../../../notify/notify";

/**
 * Map of HTTP status codes to human-readable error code strings.
 */
const HTTP_STATUS_CODES: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  405: "METHOD_NOT_ALLOWED",
  408: "REQUEST_TIMEOUT",
  409: "CONFLICT",
  410: "GONE",
  413: "PAYLOAD_TOO_LARGE",
  415: "UNSUPPORTED_MEDIA_TYPE",
  422: "UNPROCESSABLE_ENTITY",
  429: "TOO_MANY_REQUESTS",
  500: "INTERNAL_SERVER_ERROR",
  502: "BAD_GATEWAY",
  503: "SERVICE_UNAVAILABLE",
  504: "GATEWAY_TIMEOUT",
};

/**
 * @internal
 * Sets up a centralized error interceptor on the given Axios instance.
 *
 * Converts all Axios errors into `ApiError` instances so consumers
 * always receive a consistent, typed error interface.
 */
function notifyIfEnabled(err: ApiError): void {
  try {
    const cfg = NotifyKit.getConfig().interceptApiError;
    if (!cfg?.enabled) return;
    const message = cfg.messageOverride
      ? cfg.messageOverride({ message: err.message, status: err.status, code: err.code, data: err.data })
      : err.message;
    notify.error(message);
  } catch {
    // NotifyKit not initialized — silently skip
  }
}

function buildApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (!axios.isAxiosError(error)) {
    return new ApiError({
      message: error instanceof Error ? error.message : "An unknown error occurred",
      status: 0,
      code: "UNKNOWN_ERROR",
      originalError: error,
    });
  }

  if (axios.isCancel(error) || error.code === "ERR_CANCELED") {
    return new ApiError({
      message: "Request was cancelled",
      status: 0,
      code: "REQUEST_CANCELLED",
      originalError: error,
    });
  }

  if (error.response) {
    const status = error.response.status;
    const responseData = error.response.data as Record<string, unknown> | undefined;
    const code =
      (responseData && typeof responseData.code === "string" ? responseData.code : undefined) ??
      HTTP_STATUS_CODES[status] ??
      `HTTP_${status}`;
    const message =
      (responseData && typeof responseData.message === "string" ? responseData.message : undefined) ??
      error.message ??
      "Request failed";
    return new ApiError({
      message,
      status,
      code,
      data: responseData ?? null,
      originalError: error,
    });
  }

  if (error.request) {
    return new ApiError({
      message: error.message ?? "Network error — no response received",
      status: 0,
      code: "NETWORK_ERROR",
      originalError: error,
    });
  }

  return new ApiError({
    message: error.message ?? "An unknown error occurred",
    status: 0,
    code: "UNKNOWN_ERROR",
    originalError: error,
  });
}

export function setupErrorInterceptor(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: unknown) => {
      const apiError = buildApiError(error);
      // Skip cancellations — they aren't user-facing errors.
      if (apiError.code !== "REQUEST_CANCELLED") {
        notifyIfEnabled(apiError);
      }
      throw apiError;
    }
  );
}
