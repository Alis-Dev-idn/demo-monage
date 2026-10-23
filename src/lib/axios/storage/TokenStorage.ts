import type { StorageType, CookieOptions } from "../types";

/**
 * Flexible token storage adapter that supports localStorage, sessionStorage, and cookies.
 *
 * Provides a unified API for getting, setting, and removing access and refresh tokens
 * regardless of the underlying storage mechanism.
 *
 * @example
 * ```typescript
 * const storage = new TokenStorage("localStorage", "access_token", "refresh_token");
 * storage.setAccessToken("eyJhbGciOi...");
 * const token = storage.getAccessToken(); // "eyJhbGciOi..."
 * ```
 */
export class TokenStorage {
  private readonly storageType: StorageType;
  private readonly accessTokenKey: string;
  private readonly refreshTokenKey: string;
  private readonly cookieOptions: CookieOptions;

  constructor(
    storage: StorageType,
    accessTokenKey: string,
    refreshTokenKey: string,
    cookieOptions?: CookieOptions
  ) {
    this.storageType = storage;
    this.accessTokenKey = accessTokenKey;
    this.refreshTokenKey = refreshTokenKey;
    this.cookieOptions = {
      expires: 7,
      path: "/",
      secure: false,
      sameSite: "Lax",
      ...cookieOptions,
    };
  }

  // ─── Access Token ─────────────────────────────────────────────────────────

  /** Retrieves the access token from storage, or null if not found */
  getAccessToken(): string | null {
    return this.getItem(this.accessTokenKey);
  }

  /** Stores the access token */
  setAccessToken(token: string): void {
    this.setItem(this.accessTokenKey, token);
  }

  /** Removes the access token from storage */
  removeAccessToken(): void {
    this.removeItem(this.accessTokenKey);
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────

  /** Retrieves the refresh token from storage, or null if not found */
  getRefreshToken(): string | null {
    return this.getItem(this.refreshTokenKey);
  }

  /** Stores the refresh token */
  setRefreshToken(token: string): void {
    this.setItem(this.refreshTokenKey, token);
  }

  /** Removes the refresh token from storage */
  removeRefreshToken(): void {
    this.removeItem(this.refreshTokenKey);
  }

  // ─── Clear All ────────────────────────────────────────────────────────────

  /** Removes both access and refresh tokens */
  clearAll(): void {
    this.removeAccessToken();
    this.removeRefreshToken();
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private getItem(key: string): string | null {
    try {
      switch (this.storageType) {
        case "localStorage":
          return typeof window !== "undefined"
            ? window.localStorage.getItem(key)
            : null;

        case "sessionStorage":
          return typeof window !== "undefined"
            ? window.sessionStorage.getItem(key)
            : null;

        case "cookie":
          return this.getCookie(key);

        default:
          return null;
      }
    } catch {
      // Storage may be unavailable (e.g. SSR, privacy mode)
      return null;
    }
  }

  private setItem(key: string, value: string): void {
    try {
      switch (this.storageType) {
        case "localStorage":
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, value);
          }
          break;

        case "sessionStorage":
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(key, value);
          }
          break;

        case "cookie":
          this.setCookie(key, value);
          break;
      }
    } catch {
      // Silently fail if storage is unavailable
    }
  }

  private removeItem(key: string): void {
    try {
      switch (this.storageType) {
        case "localStorage":
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(key);
          }
          break;

        case "sessionStorage":
          if (typeof window !== "undefined") {
            window.sessionStorage.removeItem(key);
          }
          break;

        case "cookie":
          this.deleteCookie(key);
          break;
      }
    } catch {
      // Silently fail if storage is unavailable
    }
  }

  // ─── Cookie Helpers ───────────────────────────────────────────────────────

  private getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;

    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [cookieName, ...cookieValueParts] = cookie.split("=");
      if (cookieName?.trim() === name) {
        const value = cookieValueParts.join("=").trim();
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      }
    }
    return null;
  }

  private setCookie(name: string, value: string): void {
    if (typeof document === "undefined") return;

    const parts: string[] = [
      `${name}=${encodeURIComponent(value)}`,
    ];

    if (this.cookieOptions.expires !== undefined) {
      const date = new Date();
      date.setTime(date.getTime() + this.cookieOptions.expires * 24 * 60 * 60 * 1000);
      parts.push(`expires=${date.toUTCString()}`);
    }

    if (this.cookieOptions.path) {
      parts.push(`path=${this.cookieOptions.path}`);
    }

    if (this.cookieOptions.secure) {
      parts.push("secure");
    }

    if (this.cookieOptions.sameSite) {
      parts.push(`samesite=${this.cookieOptions.sameSite}`);
    }

    document.cookie = parts.join("; ");
  }

  private deleteCookie(name: string): void {
    if (typeof document === "undefined") return;

    const path = this.cookieOptions.path ?? "/";
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
  }
}
