import axios from "axios";
import type { AxiosInstance } from "axios";
import { TokenStorage } from "../storage/TokenStorage.js";
import { RequestMethods } from "../methods/request.js";
import { TransferMethods } from "../methods/transfer.js";
import { setupAuthInterceptor } from "./interceptors/auth.interceptor.js";
import { setupErrorInterceptor } from "./interceptors/error.interceptor.js";
import type {
  AxiosKitConfig,
  RequestOptions,
  DownloadOptions,
  UploadOptions,
} from "../types";

/**
 * Main Axios wrapper class with a static registry pattern for managing
 * multiple named instances.
 *
 * Each instance wraps an Axios instance with automatic token management,
 * silent token refresh, and centralized error handling.
 *
 * @example
 * ```typescript
 * // Register instances in app entry point
 * AxiosKit.register("main", {
 *   baseURL: "https://api.example.com",
 *   tokenStorage: {
 *     type: "localStorage",
 *     accessTokenKey: "access_token",
 *     refreshTokenKey: "refresh_token",
 *   },
 *   refreshTokenPath: "/auth/refresh",
 * });
 *
 * // Use anywhere in the app
 * const api = AxiosKit.use("main");
 * const user = await api.get<IUser>("/user/profile");
 * ```
 */
export class AxiosKit {
  /** @internal Static registry of named AxiosKit instances */
  private static registry: Map<string, AxiosKit> = new Map();

  /** @internal The underlying Axios instance */
  private readonly instance: AxiosInstance;

  /** @internal Token storage adapter, null if token management is disabled */
  private readonly tokenStorage: TokenStorage | null;

  /** @internal Request methods handler */
  private readonly requestMethods: RequestMethods;

  /** @internal Transfer methods handler */
  private readonly transferMethods: TransferMethods;

  /**
   * @internal
   * Private constructor — use `AxiosKit.register()` and `AxiosKit.use()` instead.
   */
  private constructor(config: AxiosKitConfig) {
    // Create Axios instance
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 10000,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    });

    // Set up token storage if configured
    if (config.tokenStorage) {
      this.tokenStorage = new TokenStorage(
        config.tokenStorage.type,
        config.tokenStorage.accessTokenKey,
        config.tokenStorage.refreshTokenKey ?? "",
        config.tokenStorage.cookieOptions
      );

      // Set up auth interceptor (must be before error interceptor)
      setupAuthInterceptor(
        this.instance,
        this.tokenStorage,
        config.refreshTokenPath,
        config.tokenStorage.httpOnlyRefreshToken
      );
    } else {
      this.tokenStorage = null;
    }

    // Set up error interceptor (runs after auth interceptor)
    setupErrorInterceptor(this.instance);

    // Initialize method handlers
    this.requestMethods = new RequestMethods(this.instance);
    this.transferMethods = new TransferMethods(this.instance);
  }

  // ─── Registry Pattern (Static Methods) ──────────────────────────────────

  /**
   * Registers a new named AxiosKit instance.
   *
   * @param name - Unique identifier for this instance
   * @param config - Configuration for the Axios instance
   * @throws Error if an instance with the same name is already registered
   *
   * @example
   * ```typescript
   * AxiosKit.register("main", {
   *   baseURL: "https://api.example.com",
   *   timeout: 15000,
   * });
   * ```
   */
  static register(name: string, config: AxiosKitConfig): void {
    if (AxiosKit.registry.has(name)) {
      throw new Error(
        `[AxiosKit] Instance "${name}" is already registered. ` +
          `Call AxiosKit.unregister("${name}") first if you want to replace it.`
      );
    }
    AxiosKit.registry.set(name, new AxiosKit(config));
  }

  /**
   * Retrieves a previously registered AxiosKit instance by name.
   *
   * @param name - The registered instance name
   * @returns The AxiosKit instance
   * @throws Error if no instance is registered with the given name
   *
   * @example
   * ```typescript
   * const api = AxiosKit.use("main");
   * const data = await api.get<IUser>("/user");
   * ```
   */
  static use(name: string): AxiosKit {
    const instance = AxiosKit.registry.get(name);
    if (!instance) {
      const available = Array.from(AxiosKit.registry.keys());
      throw new Error(
        `[AxiosKit] Instance "${name}" is not registered. ` +
          `Available instances: [${available.join(", ")}]. ` +
          `Make sure to call AxiosKit.register("${name}", config) first.`
      );
    }
    return instance;
  }

  /**
   * Unregisters a named AxiosKit instance.
   *
   * @param name - The instance name to remove
   */
  static unregister(name: string): void {
    AxiosKit.registry.delete(name);
  }

  /**
   * Unregisters all AxiosKit instances. Useful for testing or app teardown.
   */
  static clearAll(): void {
    AxiosKit.registry.clear();
  }

  // ─── HTTP Methods (delegated to RequestMethods) ─────────────────────────

  /**
   * Performs an HTTP GET request.
   *
   * @typeParam T - The expected response body type
   * @param url - Request URL (relative to baseURL)
   * @param options - Optional request configuration
   * @returns The response body typed as `T`
   */
  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.requestMethods.get<T>(url, options);
  }

  /**
   * Performs an HTTP POST request.
   *
   * @typeParam T - The expected response body type
   * @param url - Request URL (relative to baseURL)
   * @param data - Request body payload
   * @param options - Optional request configuration
   * @returns The response body typed as `T`
   */
  async post<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.requestMethods.post<T>(url, data, options);
  }

  /**
   * Performs an HTTP PUT request.
   *
   * @typeParam T - The expected response body type
   * @param url - Request URL (relative to baseURL)
   * @param data - Request body payload
   * @param options - Optional request configuration
   * @returns The response body typed as `T`
   */
  async put<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.requestMethods.put<T>(url, data, options);
  }

  /**
   * Performs an HTTP PATCH request.
   *
   * @typeParam T - The expected response body type
   * @param url - Request URL (relative to baseURL)
   * @param data - Request body payload
   * @param options - Optional request configuration
   * @returns The response body typed as `T`
   */
  async patch<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.requestMethods.patch<T>(url, data, options);
  }

  /**
   * Performs an HTTP DELETE request.
   *
   * @typeParam T - The expected response body type
   * @param url - Request URL (relative to baseURL)
   * @param options - Optional request configuration
   * @returns The response body typed as `T`
   */
  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.requestMethods.delete<T>(url, options);
  }

  // ─── Transfer Methods (delegated to TransferMethods) ────────────────────

  /**
   * Downloads a file with detailed progress tracking.
   *
   * @param url - Download URL (relative to baseURL)
   * @param options - Download options including progress callback and auto-download filename
   * @returns A Blob containing the downloaded file
   */
  async download(url: string, options?: DownloadOptions): Promise<Blob> {
    return this.transferMethods.download(url, options);
  }

  /**
   * Uploads a file or FormData with detailed progress tracking.
   *
   * @typeParam T - The expected response body type
   * @param url - Upload URL (relative to baseURL)
   * @param data - File or FormData to upload (File is auto-wrapped in FormData)
   * @param options - Upload options including progress callback
   * @returns The response body typed as `T`
   */
  async upload<T>(url: string, data: File | FormData, options?: UploadOptions): Promise<T> {
    return this.transferMethods.upload<T>(url, data, options);
  }

  // ─── Utility ────────────────────────────────────────────────────────────

  /**
   * Returns the underlying Axios instance for advanced usage.
   * Use with caution — prefer the typed methods above.
   */
  getAxiosInstance(): AxiosInstance {
    return this.instance;
  }

  /**
   * Returns the token storage adapter, or null if token management is disabled.
   */
  getTokenStorage(): TokenStorage | null {
    return this.tokenStorage;
  }
}
