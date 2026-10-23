import { api } from "@/utils/api";
import type { User, UserPreferences } from "@/types";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return api().post<AuthResponse>("/auth/login", payload);
}

export interface CashierLoginPayload {
  username: string;
  pin: string;
}
export interface CashierLoginResponse extends AuthResponse {
  /** Pembukuan bisnis kasir — diaktifkan klien setelah login. */
  bookId: string | null;
}
export function cashierLogin(payload: CashierLoginPayload): Promise<CashierLoginResponse> {
  return api().post<CashierLoginResponse>("/auth/cashier/login", payload);
}

export function register(payload: RegisterPayload): Promise<AuthResponse> {
  return api().post<AuthResponse>("/auth/register", payload);
}

/**
 * Sesi demo ephemeral (tombol "Login Demo" landing page). Backend membuat
 * user + book/akun/kategori seed sementara (TTL 6 jam, auto-hapus) dan
 * mengembalikan sesi yang langsung bisa dipakai — tanpa kredensial.
 */
export function demoLogin(): Promise<AuthResponse> {
  return api().post<AuthResponse>("/auth/demo");
}

export function logout(): Promise<{ ok: true }> {
  return api().post<{ ok: true }>("/auth/logout");
}

// ── Login dengan Google (v1.7) ──────────────────────────────────────

interface GoogleStartResponse {
  authorizeUrl: string;
  state: string;
}

interface GoogleCallbackMessage {
  source?: string;
  ok?: boolean;
  exchangeCode?: string;
  error?: string;
}

/**
 * Buka popup OAuth Google dari `startPath` (login: `/auth/google/start`; tautkan
 * akun: `/auth/me/google/link/start`), tunggu exchange code via postMessage,
 * lalu tukar jadi sesi. Reject bila popup diblokir, ditutup, atau backend error.
 */
async function runGoogleOAuthPopup(startPath: string): Promise<AuthResponse> {
  const { authorizeUrl } = await api().post<GoogleStartResponse>(startPath, {
    returnMode: "web",
  });

  const popup = window.open(
    authorizeUrl,
    "monage-google-auth",
    "width=520,height=640,scrollbars=yes",
  );
  if (!popup) {
    throw new Error("Popup diblokir browser. Izinkan popup lalu coba lagi.");
  }

  const exchangeCode = await new Promise<string>((resolve, reject) => {
    let closeTimer: number | null = null;
    const cleanup = () => {
      window.removeEventListener("message", handler);
      if (closeTimer !== null) window.clearInterval(closeTimer);
    };

    const handler = (event: MessageEvent) => {
      // Backend pakai targetOrigin = FRONTEND_URL → message selalu sama-origin
      // dengan FE (lewat proxy). Filter origin untuk cegah spoofing.
      if (event.origin !== window.location.origin) return;
      const data = event.data as GoogleCallbackMessage | undefined;
      if (!data || data.source !== "monage-auth") return;
      cleanup();
      try {
        popup.close();
      } catch {
        /* popup mungkin sudah tertutup */
      }
      if (data.ok && data.exchangeCode) resolve(data.exchangeCode);
      else reject(new Error(data.error ?? "Login Google gagal."));
    };

    // Fallback: user menutup popup tanpa menyelesaikan consent.
    closeTimer = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new GoogleAuthCancelled());
      }
    }, 800);

    window.addEventListener("message", handler);
  });

  return api().post<AuthResponse>("/auth/google/exchange", { code: exchangeCode });
}

/**
 * Login/registrasi dengan Google via popup:
 *  1. POST /auth/google/start → authorizeUrl (consent Google).
 *  2. Buka popup; backend callback `postMessage` exchange code ke opener.
 *  3. Tukar exchange code → sesi (BE set refresh cookie + balas accessToken+user).
 */
export function loginWithGoogle(): Promise<AuthResponse> {
  return runGoogleOAuthPopup("/auth/google/start");
}

/**
 * Tautkan akun Google ke user yang sedang login (Profil → Akun Tertaut). Memakai
 * flow popup yang sama; callback menautkan googleId ke user aktif. Mengembalikan
 * sesi (user terbaru, kini ber-`googleId`) — pemanggil sebaiknya `refresh()`. (v1.7)
 */
export function linkGoogleAccount(): Promise<AuthResponse> {
  return runGoogleOAuthPopup("/auth/me/google/link/start");
}

/**
 * Putus tautan akun Google dari user aktif (Profil → Akun Tertaut). Backend set
 * `googleId=null` & buang "google" dari authProviders. Mengembalikan user
 * terbaru (tanpa googleId). Guard backend: wajib punya kata sandi dulu. (v1.7)
 */
export function unlinkGoogleAccount(): Promise<User> {
  return api().delete<User>("/auth/me/google/link");
}

/** Set kata sandi pertama kali untuk akun Google-only (tanpa kata sandi). (v1.7) */
export function setPassword(newPassword: string): Promise<{ ok: true }> {
  return api().post<{ ok: true }>("/auth/me/set-password", { newPassword });
}

/** Dilempar saat user menutup popup tanpa menyelesaikan login (bukan error nyata). */
export class GoogleAuthCancelled extends Error {
  constructor() {
    super("Login Google dibatalkan.");
    this.name = "GoogleAuthCancelled";
  }
}

export function fetchCurrentUser(): Promise<User> {
  return api().get<User>("/auth/me");
}

export function updateProfile(
  patch: Partial<Pick<User, "name" | "avatarUrl">>,
): Promise<User> {
  return api().patch<User>("/auth/me", patch);
}

export function completeOnboarding(): Promise<User> {
  return api().patch<User>("/auth/me", { onboardedAt: new Date().toISOString() });
}

/**
 * Unggah avatar sebagai file (multipart) → backend simpan di object storage,
 * DB hanya menyimpan URL. Menggantikan pengiriman base64 lewat PATCH /auth/me.
 */
export function uploadAvatar(file: Blob): Promise<User> {
  const form = new FormData();
  form.append("file", file, "avatar.jpg");
  // `upload()` (bukan `post()`) supaya request terkirim sebagai multipart
  // dengan boundary — `post()` memakai default `Content-Type: application/json`
  // sehingga backend menolak dengan "request is not multipart".
  return api().upload<User>("/auth/me/avatar", form);
}

/** Hapus avatar (storage + reset URL). */
export function removeAvatar(): Promise<User> {
  return api().delete<User>("/auth/me/avatar");
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export function changePassword(payload: ChangePasswordPayload): Promise<{ ok: true }> {
  return api().post<{ ok: true }>("/auth/me/change-password", payload);
}

export function updatePreferences(
  patch: Partial<UserPreferences>,
): Promise<UserPreferences> {
  return api().patch<UserPreferences>("/auth/me/preferences", patch);
}

export function deleteAccount(password: string): Promise<{ ok: true }> {
  return api().delete<{ ok: true }>("/auth/me", {
    params: { password },
  });
}

export function requestPasswordReset(email: string): Promise<{ ok: true }> {
  return api().post<{ ok: true }>("/auth/forgot-password", { email });
}

export function resetPassword(token: string, password: string): Promise<{ ok: true }> {
  return api().post<{ ok: true }>("/auth/reset-password", { token, password });
}

/** Verifikasi email lewat token dari tautan email pendaftaran. */
export function verifyEmail(token: string): Promise<{ ok: true }> {
  return api().post<{ ok: true }>("/auth/verify-email", { token });
}

/** Kirim ulang email verifikasi (selalu 200 — anti-enumeration). */
export function resendVerification(email: string): Promise<{ ok: true }> {
  return api().post<{ ok: true }>("/auth/resend-verification", { email });
}
