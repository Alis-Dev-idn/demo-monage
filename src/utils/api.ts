import { AxiosKit } from "@dep/axios";
import type { DownloadOptions, RequestOptions, UploadOptions } from "@dep/axios";
import { getActiveBookId } from "./activeBook";

export const API_INSTANCE_NAME = "main";

let initialized = false;

export function setupApi(): void {
  if (initialized) return;
  initialized = true;

  const rawBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";
  const appBase = (import.meta.env.BASE_URL as string | undefined) ?? "/";
  const normalizedAppBase = appBase === "./" ? "" : appBase.replace(/\/$/, "");
  const baseURL = rawBase.startsWith("/")
    ? `${normalizedAppBase}${rawBase}`
    : rawBase;

  AxiosKit.register(API_INSTANCE_NAME, {
    baseURL,
    timeout: 15_000,
    headers: { "X-Client": "monage-fe" },
    /**
     * Strategi token (PROD READY):
     *
     * - **Access token**: disimpan di `sessionStorage` — auto-clear saat tab
     *   ditutup, mengurangi resiko jika device dipinjam. TTL pendek (5-10
     *   menit) di sisi backend; FE tidak perlu validasi expiry sendiri.
     *
     * - **Refresh token**: dikirim & disimpan via **HttpOnly cookie** oleh
     *   backend (`Set-Cookie` saat /auth/login + /auth/refresh). FE TIDAK
     *   pernah pegang refresh token → invulnerable terhadap XSS dump
     *   localStorage. `withCredentials: true` di-set otomatis saat memanggil
     *   `refreshTokenPath`.
     *
     * Saat backend production siap, set HttpOnly + Secure + SameSite=Strict
     * (atau Lax untuk subdomain) — lihat BACKEND-API-SPEC §1.4.
     */
    tokenStorage: {
      type: "sessionStorage",
      accessTokenKey: "monage:auth:accessToken",
      refreshTokenKey: "monage:auth:refreshToken", // ignored saat httpOnly=true
      httpOnlyRefreshToken: true,
    },
    refreshTokenPath: "/auth/refresh",
  });
}

/**
 * Endpoint yang TIDAK bergantung pada pembukuan aktif. Daftar ini di-skip
 * saat auto-inject `bookId` supaya request `/auth/*`, `/books/*`,
 * `/subscription/*`, dan `/invitations/*` tetap global.
 */
const BOOK_AGNOSTIC_PREFIXES = [
  "/auth",
  "/demo",
  "/books",
  "/subscription",
  "/invitations",
  "/export",
  "/backup",
  "/admin",
];

// `/monthly-plans` SENGAJA tidak di-skip — masih scoped per pembukuan
// (auto-inject `bookId` saat fetch / create).

function shouldInjectBookId(url: string): boolean {
  return !BOOK_AGNOSTIC_PREFIXES.some((p) => url.startsWith(p));
}

function injectBookParam(
  url: string,
  options: RequestOptions | undefined,
): RequestOptions | undefined {
  if (!shouldInjectBookId(url)) return options;
  const bookId = getActiveBookId();
  if (!bookId) return options;
  const params = { ...(options?.params ?? {}), bookId };
  if (options?.params && "bookId" in options.params && options.params.bookId) {
    // Caller explicit override — hormati.
    return options;
  }
  return { ...(options ?? {}), params };
}

function injectBookBody<T>(url: string, data: T): T {
  if (!shouldInjectBookId(url)) return data;
  if (data === undefined || data === null) return data;
  if (typeof data !== "object") return data;
  const bookId = getActiveBookId();
  if (!bookId) return data;
  // Jangan override kalau caller sudah set
  if ((data as Record<string, unknown>).bookId) return data;
  return { ...(data as Record<string, unknown>), bookId } as unknown as T;
}

/**
 * Wrapper di atas AxiosKit yang otomatis inject `bookId` ke params query
 * (untuk GET/DELETE) dan ke body (untuk POST/PATCH/PUT). Pembukuan aktif
 * disimpan di localStorage lewat `setActiveBookId()`.
 */
export function api() {
  if (!initialized) setupApi();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const kit = AxiosKit.use(API_INSTANCE_NAME);
  return {
    get<T>(url: string, options?: RequestOptions): Promise<T> {
      return kit.get<T>(url, injectBookParam(url, options));
    },
    post<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
      return kit.post<T>(url, injectBookBody(url, data), injectBookParam(url, options));
    },
    put<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
      return kit.put<T>(url, injectBookBody(url, data), injectBookParam(url, options));
    },
    patch<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
      return kit.patch<T>(url, injectBookBody(url, data), injectBookParam(url, options));
    },
    delete<T>(url: string, options?: RequestOptions): Promise<T> {
      return kit.delete<T>(url, injectBookParam(url, options));
    },
    /**
     * Authenticated file download — returns a Blob and (when `filename` is set)
     * auto-triggers the browser save dialog. Use this instead of `<a href>`
     * anchor downloads when the endpoint requires the access token (which is
     * the case for everything under `/api/*`), otherwise the browser fetches
     * the URL without a Bearer header, hits the SPA fallback, and saves
     * `index.html` instead of the file.
     */
    async download(url: string, options?: DownloadOptions): Promise<Blob> {
      return kit.download(url, options);
    },
    /**
     * Authenticated multipart upload — pakai ini (bukan `post`) untuk kirim
     * `File`/`FormData`. AxiosKit men-set `Content-Type: multipart/form-data`
     * & browser melengkapi `boundary`-nya, sehingga backend (@fastify/multipart)
     * mengenalinya sebagai multipart (mencegah error "request is not multipart").
     */
    async upload<T>(url: string, data: File | FormData, options?: UploadOptions): Promise<T> {
      // Inject `bookId` aktif juga untuk upload (mis. gambar produk / logo
      // bisnis yang scoped per-pembukuan), agar backend resolve book bisnis
      // yang benar dan tidak menolak dengan "bukan pembukuan bisnis".
      return kit.upload<T>(url, data, injectBookParam(url, options) as UploadOptions);
    },
    getTokenStorage() {
      return kit.getTokenStorage();
    },
  };
}
