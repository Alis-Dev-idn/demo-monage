import type { AxiosRequestConfig } from "axios";

// ─── Storage Types ────────────────────────────────────────────────────────────

/** Supported storage backends for token persistence */
export type StorageType = "localStorage" | "sessionStorage" | "cookie";

/** Cookie-specific configuration options */
export interface CookieOptions {
  /** Number of days until the cookie expires */
  expires?: number;
  /** Cookie path scope (default: "/") */
  path?: string;
  /** Whether to set the Secure flag on the cookie */
  secure?: boolean;
  /** SameSite attribute for the cookie */
  sameSite?: "Strict" | "Lax" | "None";
}

// ─── AxiosKit Config ──────────────────────────────────────────────────────────

/** Token storage configuration for an AxiosKit instance */
export interface TokenStorageConfig {
  /** Which storage backend to use */
  type: StorageType;
  /** Key name for storing the access token */
  accessTokenKey: string;
  /** Key name for storing the refresh token (ignored if httpOnlyRefreshToken is true) */
  refreshTokenKey?: string;
  /** Set to true if the refresh token is managed by the server via an httpOnly cookie */
  httpOnlyRefreshToken?: boolean;
  /** Cookie-specific options (only used when type is "cookie") */
  cookieOptions?: CookieOptions;
}

/** Configuration for creating an AxiosKit instance */
export interface AxiosKitConfig {
  /** Base URL for all requests made by this instance */
  baseURL: string;
  /** Token storage configuration. If omitted, no token management is performed */
  tokenStorage?: TokenStorageConfig;
  /** Endpoint path for refreshing the access token (e.g. "/auth/refresh") */
  refreshTokenPath?: string;
  /** Default request timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Default headers applied to every request */
  headers?: Record<string, string>;
}

// ─── Request Options ──────────────────────────────────────────────────────────

/** Options for individual HTTP requests */
export interface RequestOptions {
  /** Query parameters to append to the URL */
  params?: Record<string, unknown>;
  /** Per-request headers (merged with instance-level headers) */
  headers?: Record<string, string>;
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
  /** Override instance-level timeout for this request */
  timeout?: number;
}

// ─── Transfer Progress ───────────────────────────────────────────────────────

/** Detailed download progress information */
export interface DownloadProgress {
  /** Download percentage (0–100) */
  percent: number;
  /** Bytes downloaded so far */
  loaded: number;
  /** Total bytes to download (0 if unknown) */
  total: number;
  /** Current download speed in bytes per second */
  speed: number;
  /** Estimated seconds remaining (Infinity if unknown) */
  estimatedTime: number;
}

/** Detailed upload progress information */
export interface UploadProgress {
  /** Upload percentage (0–100) */
  percent: number;
  /** Bytes uploaded so far */
  loaded: number;
  /** Total bytes to upload */
  total: number;
  /** Current upload speed in bytes per second */
  speed: number;
  /** Estimated seconds remaining (Infinity if unknown) */
  estimatedTime: number;
}

// ─── Download / Upload Options ────────────────────────────────────────────────

/** Options for download requests */
export interface DownloadOptions {
  /** Callback invoked with download progress updates */
  onProgress?: (progress: DownloadProgress) => void;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
  /** Per-request headers */
  headers?: Record<string, string>;
  /** If provided, triggers an automatic browser file download with this filename */
  filename?: string;
}

/** Options for upload requests */
export interface UploadOptions {
  /** Callback invoked with upload progress updates */
  onProgress?: (progress: UploadProgress) => void;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
  /** Per-request headers */
  headers?: Record<string, string>;
  /** Query string params (e.g. `bookId` for book-scoped uploads) */
  params?: Record<string, unknown>;
}

// ─── useApi Hook ──────────────────────────────────────────────────────────────

/** Options for the useApi hook */
export interface UseApiOptions {
  /** Whether to execute the API call immediately on mount (default: true) */
  immediate?: boolean;
}

/** Return type of the useApi hook */
export interface UseApiResult<T> {
  /** The response data, or null if not yet loaded or an error occurred */
  data: T | null;
  /** Whether a request is currently in-flight */
  loading: boolean;
  /** The error from the last request, or null if successful */
  error: import("../core/ApiError.js").ApiError | null;
  /** Manually trigger the API call. Returns the data on success, or null on error */
  execute: () => Promise<T | null>;
}

// ─── Internal Types ───────────────────────────────────────────────────────────

/** @internal Extended Axios request config with retry metadata */
export interface RetryableAxiosRequestConfig extends AxiosRequestConfig {
  /** @internal Flag to prevent infinite retry loops */
  _retry?: boolean;
}
