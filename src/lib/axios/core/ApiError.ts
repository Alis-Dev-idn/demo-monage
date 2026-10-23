/**
 * Custom error class that carries structured information from failed HTTP responses.
 *
 * All errors thrown by AxiosKit are instances of `ApiError`, providing
 * a consistent, typed error interface for consumers.
 *
 * @example
 * ```typescript
 * try {
 *   const data = await api.get<IUser>("/user");
 * } catch (err) {
 *   const error = err as ApiError;
 *   console.log(error.message);   // "Unauthorized"
 *   console.log(error.status);    // 401
 *   console.log(error.code);      // "TOKEN_EXPIRED"
 *   console.log(error.data);      // server response body
 * }
 * ```
 */
export class ApiError extends Error {
  /** HTTP status code (e.g. 401, 403, 500). 0 for network/unknown errors. */
  public readonly status: number;

  /** Application-level error code (e.g. "TOKEN_EXPIRED", "NETWORK_ERROR") */
  public readonly code: string;

  /** Response body from the server, if available */
  public readonly data: unknown;

  /** The raw original error (typically an AxiosError) */
  public readonly originalError: unknown;

  constructor(params: {
    message: string;
    status: number;
    code: string;
    data?: unknown;
    originalError?: unknown;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status;
    this.code = params.code;
    this.data = params.data ?? null;
    this.originalError = params.originalError ?? null;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Returns a human-readable string representation of the error.
   */
  override toString(): string {
    return `ApiError [${this.code}] (${this.status}): ${this.message}`;
  }

  /**
   * Serializes the error to a plain object (useful for logging).
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      data: this.data,
    };
  }
}
