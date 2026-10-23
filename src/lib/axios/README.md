# Axios Kit (`@dep/axios`)

Wrapper kustom di atas pustaka `axios` yang memberikan fungsionalitas kelas enterprise untuk manajemen API. Dibangun dengan TypeScript murni — mengabstraksi penanganan token, tracking upload/download, lifecycle request, dan normalisasi error.

---

## Daftar Isi
1. [Fitur Utama](#fitur-utama)
2. [Struktur Folder](#struktur-folder)
3. [Quick Start](#quick-start)
4. [API Reference — `AxiosKit`](#api-reference--axioskit)
5. [HTTP Methods (`request.ts`)](#http-methods-requestts)
6. [Transfer Methods (`upload` & `download`)](#transfer-methods-upload--download)
7. [Hook `useApi`](#hook-useapi)
8. [Token Storage](#token-storage)
9. [Interceptors](#interceptors)
10. [Error Handling (`ApiError`)](#error-handling-apierror)
11. [Type Reference Lengkap](#type-reference-lengkap)
12. [Multi-Instance Pattern](#multi-instance-pattern)
13. [Tips & Pitfalls](#tips--pitfalls)

---

## Fitur Utama

1. **Registry Pattern (`AxiosKit`)** — Mengelola banyak instan Axios (mis. `main`, `payment`, `analytics`) secara terpusat.
2. **Auto Token Management** — Menyimpan & melampirkan *Bearer token* otomatis. Dukungan `localStorage`, `sessionStorage`, dan `cookie` (termasuk `httpOnly`).
3. **Silent Token Refresh** — Saat 401, otomatis hit endpoint refresh; queue concurrent requests sehingga refresh hanya terjadi sekali.
4. **Transfer Methods** — `api.upload()` & `api.download()` dengan tracking progress (persen, kecepatan B/s, estimasi waktu).
5. **Smart Hook `useApi`** — Auto-cancel saat unmount, race-condition safe, support external `AbortSignal`.
6. **Standardized Error (`ApiError`)** — Normalisasi error server jadi instance terstruktur (`status`, `code`, `data`).

---

## Struktur Folder

```
src/lib/axios/
├── index.ts                                # Public API exports
├── types/index.ts                          # Semua type publik
├── core/
│   ├── AxiosKit.ts                         # Class registry & instance utama
│   ├── ApiError.ts                         # Custom error class
│   └── interceptors/
│       ├── auth.interceptor.ts             # Token attach + refresh queue
│       └── error.interceptor.ts            # Normalisasi error → ApiError
├── storage/
│   └── TokenStorage.ts                     # Adapter localStorage/session/cookie
├── methods/
│   ├── request.ts                          # get/post/put/patch/delete
│   └── transfer.ts                         # upload/download + progress
└── hooks/
    └── useApi.ts                           # React hook
```

---

## Quick Start

### 1. Registrasi instance di entry point

```typescript
// main.tsx atau App.tsx
import { AxiosKit } from "@dep/axios";

AxiosKit.register("main", {
  baseURL: "https://api.myapp.com/v1",
  timeout: 10_000,
  headers: { "X-Client-Version": "1.0.0" },

  tokenStorage: {
    type: "localStorage",            // "localStorage" | "sessionStorage" | "cookie"
    accessTokenKey: "app_token",
    refreshTokenKey: "app_refresh",  // skip jika pakai httpOnly cookie
    httpOnlyRefreshToken: false,
  },
  refreshTokenPath: "/auth/refresh", // wajib jika ingin silent-refresh
});
```

### 2. Pakai di mana saja

```typescript
import { AxiosKit, ApiError } from "@dep/axios";

const api = AxiosKit.use("main");

try {
  const user = await api.get<User>("/users/me");
} catch (err) {
  const e = err as ApiError;
  console.error(`[${e.code}] ${e.message}`);
}
```

---

## API Reference — `AxiosKit`

### Static Methods

| Method | Signature | Keterangan |
|---|---|---|
| `register` | `(name: string, config: AxiosKitConfig) => void` | Mendaftarkan instance baru. Akan throw jika nama sudah ada. |
| `use` | `(name: string) => AxiosKit` | Ambil instance terdaftar. Throw jika nama tidak ditemukan. |
| `unregister` | `(name: string) => void` | Hapus satu instance. |
| `clearAll` | `() => void` | Hapus semua instance. |

### Instance Methods (per registered AxiosKit)

| Method | Return | Keterangan |
|---|---|---|
| `get<T>(url, options?)` | `Promise<T>` | GET request, auto-unwrap `response.data`. |
| `post<T>(url, data?, options?)` | `Promise<T>` | POST request. |
| `put<T>(url, data?, options?)` | `Promise<T>` | PUT request. |
| `patch<T>(url, data?, options?)` | `Promise<T>` | PATCH request. |
| `delete<T>(url, options?)` | `Promise<T>` | DELETE request. |
| `upload<T>(url, data, options?)` | `Promise<T>` | Upload File/FormData + progress. |
| `download(url, options?)` | `Promise<Blob>` | Download file + progress, auto-trigger save jika `filename` diset. |
| `getTokenStorage()` | `TokenStorage \| null` | Akses raw TokenStorage instance. |
| `getInstance()` | `AxiosInstance` | Akses raw Axios instance untuk kasus advance. |

---

## HTTP Methods (`request.ts`)

Semua method otomatis unwrap `response.data` — Anda langsung dapat payload.

### Signature

```typescript
get<T>(url: string, options?: RequestOptions): Promise<T>
post<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T>
put<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T>
patch<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T>
delete<T>(url: string, options?: RequestOptions): Promise<T>
```

### `RequestOptions`

```typescript
interface RequestOptions {
  params?: Record<string, unknown>;   // Query string
  headers?: Record<string, string>;   // Header tambahan (merge dengan default)
  signal?: AbortSignal;               // Untuk pembatalan request
  timeout?: number;                   // Override timeout default per-request
}
```

### Contoh

```typescript
const api = AxiosKit.use("main");

// GET dengan params + abort signal
const ctrl = new AbortController();
const data = await api.get<User[]>("/users", {
  params: { role: "admin", page: 1 },
  signal: ctrl.signal,
});

// POST dengan timeout custom
const result = await api.post<{ id: string }>("/auth/login",
  { email, password },
  { timeout: 5_000 }
);

// DELETE
await api.delete<void>("/users/123");
```

---

## Transfer Methods (`upload` & `download`)

### `upload<T>(url, data, options?)`

- Otomatis bungkus `File` ke dalam `FormData` dengan field name `"file"`.
- Jika sudah berupa `FormData`, langsung dikirim apa adanya.

```typescript
const fileInput = document.querySelector<HTMLInputElement>("input[type=file]");
const file = fileInput?.files?.[0];

if (file) {
  const result = await api.upload<UploadResponse>("/media/upload", file, {
    onProgress: (p) => {
      progressBar.value = p.percent;
      console.log(`${Math.round(p.speed / 1024)} KB/s — ETA ${p.estimatedTime}s`);
    },
  });
}

// Multi-field via FormData
const form = new FormData();
form.append("file", file);
form.append("category", "profile");
await api.upload("/media/upload", form);
```

### `download(url, options?)`

```typescript
// Trigger auto-save di browser jika `filename` diset
const blob = await api.download("/reports/jan.pdf", {
  filename: "laporan-januari.pdf",
  onProgress: (p) => {
    console.log(`${p.percent}% — sisa ${p.estimatedTime}s`);
  },
});

// Tanpa filename: dapat Blob, kelola manual
const blob2 = await api.download("/files/data.json");
const text = await blob2.text();
```

### Tipe Progress

```typescript
interface UploadProgress | DownloadProgress {
  percent: number;        // 0–100
  loaded: number;         // bytes terkirim/diterima
  total: number;          // total bytes (0 jika tidak diketahui)
  speed: number;          // bytes/sec, hasil rolling 2-event
  estimatedTime: number;  // detik tersisa (Infinity jika unknown)
}
```

---

## Hook `useApi`

Hook React untuk async request dengan **auto-cancel saat unmount**, **race-condition safe**, dan **support external signal**.

### Signature

```typescript
function useApi<T>(
  fn: (signal?: AbortSignal) => Promise<T>,
  options?: UseApiOptions
): UseApiResult<T>

interface UseApiOptions {
  immediate?: boolean; // default: true — auto-execute saat mount
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: () => Promise<T | null>;
}
```

### Mode 1 — Auto-fetch saat mount

```tsx
const { data, loading, error } = useApi<User>(
  (signal) => api.get("/users/me", { signal })
);

if (loading) return <Skeleton />;
if (error) return <ErrorView error={error} />;
return <Profile user={data} />;
```

### Mode 2 — Manual trigger (form submit)

```tsx
const { execute, loading } = useApi<User>(
  (signal) => api.post("/users", formData, { signal }),
  { immediate: false }
);

return <button onClick={execute} disabled={loading}>Simpan</button>;
```

### Mode 3 — Reactive query (search-as-you-type)

Setiap pemanggilan `execute()` otomatis abort request sebelumnya.

```tsx
const { data, execute } = useApi<User[]>(
  (signal) => api.get("/search", { params: { q }, signal }),
  { immediate: false }
);

useEffect(() => { execute(); }, [q]);
```

**Catatan:** Hook menerima fungsi `(signal) => Promise<T>` — pastikan Anda meneruskan `signal` ke request agar mekanisme cancel-on-unmount bekerja.

---

## Token Storage

Adapter untuk menyimpan access/refresh token di berbagai backend.

```typescript
interface TokenStorageConfig {
  type: "localStorage" | "sessionStorage" | "cookie";
  accessTokenKey: string;
  refreshTokenKey?: string;            // Kosongkan jika httpOnly
  httpOnlyRefreshToken?: boolean;      // true → refresh token via httpOnly cookie
  cookieOptions?: CookieOptions;
}

interface CookieOptions {
  expires?: number;                    // hari (default: 7)
  path?: string;                       // default: "/"
  secure?: boolean;                    // default: false
  sameSite?: "Strict" | "Lax" | "None"; // default: "Lax"
}
```

### Akses langsung

```typescript
const api = AxiosKit.use("main");
const storage = api.getTokenStorage();

if (storage) {
  storage.setAccessToken("eyJhbGciOiJI...");
  storage.setRefreshToken("eyJhbGciOiJI...");

  const token = storage.getAccessToken();

  // Logout
  storage.clearAll();
}
```

### Skenario: httpOnly refresh token

```typescript
AxiosKit.register("main", {
  baseURL: "https://api.app.com",
  tokenStorage: {
    type: "localStorage",
    accessTokenKey: "access_token",
    httpOnlyRefreshToken: true,        // Server kelola via Set-Cookie
  },
  refreshTokenPath: "/auth/refresh",
});
```

Saat refresh, body request akan kosong & `withCredentials: true` otomatis aktif.

---

## Interceptors

### Auth Interceptor — silent token refresh

Aktif otomatis jika `tokenStorage` + `refreshTokenPath` diset. Alur:

1. **Request** → attach `Authorization: Bearer <accessToken>` jika tersedia.
2. **Response 401** → mulai refresh; request lain yang barengan 401 di-*queue* hingga refresh selesai.
3. **Refresh sukses** → simpan token baru, retry original request, replay semua queue.
4. **Refresh gagal** → `tokenStorage.clearAll()` dan throw `ApiError(code: "SESSION_EXPIRED")`.

### Error Interceptor — normalisasi error

Semua error keluar sebagai `ApiError` (instance konsisten). Mapping status:

| Status | Code | Status | Code |
|---|---|---|---|
| 400 | `BAD_REQUEST` | 422 | `UNPROCESSABLE_ENTITY` |
| 401 | `UNAUTHORIZED` | 429 | `TOO_MANY_REQUESTS` |
| 403 | `FORBIDDEN` | 500 | `INTERNAL_SERVER_ERROR` |
| 404 | `NOT_FOUND` | 502 | `BAD_GATEWAY` |
| 405 | `METHOD_NOT_ALLOWED` | 503 | `SERVICE_UNAVAILABLE` |
| 408 | `REQUEST_TIMEOUT` | 504 | `GATEWAY_TIMEOUT` |
| 409 | `CONFLICT` | — | `NETWORK_ERROR` (network down) |
| 413 | `PAYLOAD_TOO_LARGE` | — | `REQUEST_CANCELLED` (aborted) |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | — | `UNKNOWN_ERROR` (fallback) |

Jika server kembalikan `{ code: "VALIDATION_FAILED", ... }`, code tersebut akan dipakai (override mapping default).

---

## Error Handling (`ApiError`)

```typescript
class ApiError extends Error {
  readonly status: number;        // HTTP status (0 = network)
  readonly code: string;          // Code aplikasi (lihat tabel di atas)
  readonly data: unknown;         // Response body dari server
  readonly originalError: unknown;

  toString(): string;             // "ApiError [CODE] (STATUS): message"
  toJSON(): Record<string, unknown>;
}
```

### Pola pakai

```typescript
try {
  await api.post("/users", payload);
} catch (err) {
  if (!(err instanceof ApiError)) throw err;

  switch (err.code) {
    case "VALIDATION_FAILED":
      setFormErrors(err.data as ValidationErrors);
      break;
    case "SESSION_EXPIRED":
      navigate("/login");
      break;
    case "NETWORK_ERROR":
      notify.error("Tidak ada koneksi internet");
      break;
    default:
      notify.error(err.message);
  }
}
```

---

## Type Reference Lengkap

Diekspor dari `@dep/axios`:

```typescript
// Storage
type StorageType;            // "localStorage" | "sessionStorage" | "cookie"
interface CookieOptions;
interface TokenStorageConfig;

// Configuration
interface AxiosKitConfig {
  baseURL: string;
  tokenStorage?: TokenStorageConfig;
  refreshTokenPath?: string;
  timeout?: number;          // default: 10000 ms
  headers?: Record<string, string>;
}

// Requests
interface RequestOptions {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeout?: number;
}

// Transfer
interface DownloadProgress { percent, loaded, total, speed, estimatedTime }
interface UploadProgress   { percent, loaded, total, speed, estimatedTime }
interface DownloadOptions  { onProgress?, signal?, headers?, filename? }
interface UploadOptions    { onProgress?, signal?, headers? }

// Hook
interface UseApiOptions    { immediate?: boolean }
interface UseApiResult<T>  { data, loading, error, execute }
```

---

## Multi-Instance Pattern

Berguna saat aplikasi memanggil beberapa API dengan auth/host yang berbeda.

```typescript
// Register dua instance
AxiosKit.register("main", {
  baseURL: "https://api.monage.com",
  tokenStorage: { type: "localStorage", accessTokenKey: "monage_token" },
  refreshTokenPath: "/auth/refresh",
});

AxiosKit.register("payment", {
  baseURL: "https://payment.partner.com",
  timeout: 30_000,
  headers: { "X-Api-Key": import.meta.env.VITE_PAYMENT_KEY },
});

// Gunakan dengan nama
const main = AxiosKit.use("main");
const payment = AxiosKit.use("payment");

await main.get("/users/me");
await payment.post("/charge", { amount: 50000 });
```

---

## Tips & Pitfalls

1. **Selalu teruskan `signal`** dari `useApi` ke method axios — kalau tidak, cancel-on-unmount tidak akan bekerja.
2. **Jangan `await` di top level component** — gunakan `useApi` atau `useEffect`.
3. **`httpOnlyRefreshToken: true` butuh dukungan server** (server harus set-cookie `HttpOnly Secure SameSite=None` saat login).
4. **Auto-download (`download` dengan `filename`)** hanya bekerja di browser. Skip property `filename` jika di SSR.
5. **Refresh queue** terbatas pada satu instance. Jika dua instance memiliki refresh path masing-masing, mereka berjalan independen.
6. **`AxiosKit.register` tidak idempoten** — register dua kali dengan nama yang sama akan menimpa konfigurasi sebelumnya.

---

*Lihat [src/lib/ISSUES.md](../ISSUES.md) untuk catatan perbaikan & saran peningkatan modul ini.*
