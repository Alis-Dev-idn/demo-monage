import { useState, useEffect, useRef, useCallback } from "react";
import { ApiError } from "../core/ApiError.js";
import type { UseApiOptions, UseApiResult } from "../types";

/**
 * React hook for consuming any async function with automatic loading, error,
 * and data state management.
 *
 * Supports auto-cancel on unmount via AbortController, and prevents state
 * updates after the component has unmounted.
 *
 * @typeParam T - The expected response data type
 * @param fn - A closure that returns a Promise (e.g. a service method call)
 * @param options - Hook configuration
 * @returns An object containing `data`, `loading`, `error`, and an `execute` function
 *
 * @example
 * ```typescript
 * // Auto-fetch on mount
 * const { data, loading, error } = useApi(() => UserService.getProfile());
 *
 * // Manual trigger
 * const { execute, loading } = useApi(
 *   () => UserService.updateProfile(form),
 *   { immediate: false }
 * );
 * ```
 */
export function useApi<T>(
  fn: (signal?: AbortSignal) => Promise<T>,
  options?: UseApiOptions
): UseApiResult<T> {
  const { immediate = true } = options ?? {};

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<ApiError | null>(null);

  // Track current AbortController so we can cancel previous requests
  const controllerRef = useRef<AbortController | null>(null);
  // Track mounted state to prevent state updates after unmount
  const mountedRef = useRef<boolean>(true);

  /**
   * Core execution function that manages the request lifecycle.
   */
  const executeFn = useCallback(
    async (signal?: AbortSignal): Promise<T | null> => {
      // Cancel any previous in-flight request
      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      // Create a new AbortController for this request
      const controller = new AbortController();
      controllerRef.current = controller;

      // Link external signal (if any) to our internal controller
      const internalSignal = controller.signal;
      if (signal) {
        signal.addEventListener("abort", () => controller.abort(), { once: true });
      }

      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }

      try {
        const result = await fn(internalSignal);

        if (mountedRef.current && !internalSignal.aborted) {
          setData(result);
          setLoading(false);
        }

        return result;
      } catch (err: unknown) {
        // Cancelled requests should be silently ignored
        if (err instanceof ApiError && err.code === "REQUEST_CANCELLED") {
          // Only update loading if this controller is still the current one
          if (mountedRef.current && controllerRef.current === controller) {
            setLoading(false);
          }
          return null;
        }

        // Check if it's an abort-related error (native AbortError)
        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          if (mountedRef.current && controllerRef.current === controller) {
            setLoading(false);
          }
          return null;
        }

        // Real error — update state
        if (mountedRef.current) {
          const apiError =
            err instanceof ApiError
              ? err
              : new ApiError({
                  message: err instanceof Error ? err.message : "Unknown error",
                  status: 0,
                  code: "UNKNOWN_ERROR",
                  originalError: err,
                });

          setError(apiError);
          setLoading(false);
        }

        return null;
      }
    },
    [fn]
  );

  /**
   * Public execute function exposed to consumers.
   * Cancels any previous in-flight request before starting a new one.
   */
  const execute = useCallback(async (): Promise<T | null> => {
    return executeFn();
  }, [executeFn]);

  // ─── Effect: Auto-execute on mount & cleanup on unmount ─────────────────
  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();

    if (immediate) {
      executeFn(controller.signal);
    }

    return () => {
      mountedRef.current = false;
      controller.abort();
      // Also abort any in-flight request from execute()
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, execute };
}
