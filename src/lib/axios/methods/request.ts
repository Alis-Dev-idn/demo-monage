import type { AxiosInstance } from "axios";
import type { RequestOptions } from "../types";

/**
 * Mixin that adds standard HTTP methods (GET, POST, PUT, PATCH, DELETE)
 * to an AxiosKit instance.
 *
 * All methods are generic and return `Promise<T>` — they automatically
 * unwrap `response.data` so consumers receive the response body directly.
 */
export class RequestMethods {
  /** @internal The underlying Axios instance */
  protected readonly instance: AxiosInstance;

  constructor(instance: AxiosInstance) {
    this.instance = instance;
  }

  /**
   * Performs an HTTP GET request.
   *
   * @typeParam T - The expected response body type
   * @param url - Request URL (relative to baseURL)
   * @param options - Optional request configuration
   * @returns The response body typed as `T`
   *
   * @example
   * ```typescript
   * const users = await api.get<IUser[]>("/users", { params: { page: 1 } });
   * ```
   */
  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    const response = await this.instance.get<T>(url, {
      params: options?.params,
      headers: options?.headers,
      signal: options?.signal,
      timeout: options?.timeout,
    });
    return response.data;
  }

  /**
   * Performs an HTTP POST request.
   *
   * @typeParam T - The expected response body type
   * @param url - Request URL (relative to baseURL)
   * @param data - Request body payload
   * @param options - Optional request configuration
   * @returns The response body typed as `T`
   *
   * @example
   * ```typescript
   * const user = await api.post<IUser>("/users", { name: "John" });
   * ```
   */
  async post<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const response = await this.instance.post<T>(url, data, {
      params: options?.params,
      headers: options?.headers,
      signal: options?.signal,
      timeout: options?.timeout,
    });
    return response.data;
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
    const response = await this.instance.put<T>(url, data, {
      params: options?.params,
      headers: options?.headers,
      signal: options?.signal,
      timeout: options?.timeout,
    });
    return response.data;
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
    const response = await this.instance.patch<T>(url, data, {
      params: options?.params,
      headers: options?.headers,
      signal: options?.signal,
      timeout: options?.timeout,
    });
    return response.data;
  }

  /**
   * Performs an HTTP DELETE request.
   *
   * @typeParam T - The expected response body type
   * @param url - Request URL (relative to baseURL)
   * @param options - Optional request configuration
   * @returns The response body typed as `T`
   *
   * @example
   * ```typescript
   * await api.delete<void>("/users/123");
   * ```
   */
  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    const response = await this.instance.delete<T>(url, {
      params: options?.params,
      headers: options?.headers,
      signal: options?.signal,
      timeout: options?.timeout,
    });
    return response.data;
  }
}
