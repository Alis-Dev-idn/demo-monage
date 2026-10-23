import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "@dep/axios";
import { api } from "@/utils/api";
import { setActiveBookId } from "@/utils/activeBook";
import * as authService from "@/services/auth.service";
import type { AuthTokens } from "@/services/auth.service";
import type { User } from "@/types";

export interface LoginCreds {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (creds: LoginCreds) => Promise<User>;
  cashierLogin: (creds: { username: string; pin: string }) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  register: (data: RegisterPayload) => Promise<User>;
  /** Sesi demo ephemeral (tombol "Login Demo" landing page) — tanpa kredensial. */
  loginDemo: () => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<User, "name" | "avatarUrl">>) => Promise<User>;
  updatePreferences: (patch: Partial<User["preferences"]>) => Promise<User>;
  completeOnboarding: () => Promise<User>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

const USER_STORAGE_KEY = "monage:auth:user";

function persistUser(user: User | null): void {
  if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_STORAGE_KEY);
}

function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function storeTokens(tokens: AuthTokens): void {
  const storage = api().getTokenStorage();
  if (!storage) return;
  storage.setAccessToken(tokens.accessToken);
  storage.setRefreshToken(tokens.refreshToken);
}

function clearTokens(): void {
  api().getTokenStorage()?.clearAll();
}

function hasAccessToken(): boolean {
  return !!api().getTokenStorage()?.getAccessToken();
}

/**
 * Coba refresh access token via HttpOnly cookie. Dipakai saat bootstrap
 * menemukan cached user tapi accessToken hilang (mis. browser ditutup —
 * sessionStorage clear, tapi refresh-cookie masih hidup). Mengembalikan
 * `true` kalau refresh berhasil dan token baru sudah tersimpan.
 */
async function tryRefreshFromCookie(): Promise<boolean> {
  const storage = api().getTokenStorage();
  if (!storage) return false;
  const baseURL =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";
  try {
    const res = await fetch(`${baseURL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { accessToken?: string };
    if (!data.accessToken) return false;
    storage.setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => readCachedUser());
  // Selalu bootstrap saat ada cached user — entah accessToken masih hidup atau
  // tidak — supaya kita bisa coba refresh dari HttpOnly cookie sebelum
  // mengizinkan UI render dengan user state yang stale.
  const [isBootstrapping, setBootstrapping] = useState<boolean>(
    () => hasAccessToken() || !!readCachedUser(),
  );
  const bootstrapped = useRef(false);

  const bootstrap = useCallback(async () => {
    // Tidak ada accessToken: cek apakah masih bisa silent-refresh dari cookie.
    // Kalau tidak bisa, pastikan cached user dibersihkan supaya RouteKit
    // (yang baca sessionStorage) dan AuthContext (yang baca user state)
    // tidak konflik → tanpa ini terjadi loop redirect /auth ↔ /dashboard.
    if (!hasAccessToken()) {
      const cached = readCachedUser();
      if (!cached) {
        setBootstrapping(false);
        return;
      }
      const refreshed = await tryRefreshFromCookie();
      if (!refreshed) {
        persistUser(null);
        setUser(null);
        setBootstrapping(false);
        return;
      }
      // Refresh sukses — lanjut fetch /auth/me untuk validate + segarkan user.
    }
    try {
      const fresh = await authService.fetchCurrentUser();
      setUser(fresh);
      persistUser(fresh);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.code === "SESSION_EXPIRED")) {
        clearTokens();
        persistUser(null);
        setUser(null);
      }
    } finally {
      setBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (creds: LoginCreds) => {
    const res = await authService.login(creds);
    storeTokens(res);
    persistUser(res.user);
    setUser(res.user);
    return res.user;
  }, []);

  const cashierLogin = useCallback(
    async (creds: { username: string; pin: string }) => {
      const res = await authService.cashierLogin(creds);
      storeTokens(res);
      persistUser(res.user);
      setUser(res.user);
      // Aktifkan pembukuan bisnis kasir agar UI langsung scoped ke sana.
      if (res.bookId) setActiveBookId(res.bookId);
      return res.user;
    },
    [],
  );

  const loginWithGoogle = useCallback(async () => {
    const res = await authService.loginWithGoogle();
    storeTokens(res);
    persistUser(res.user);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (data: RegisterPayload) => {
    const res = await authService.register(data);
    storeTokens(res);
    persistUser(res.user);
    setUser(res.user);
    return res.user;
  }, []);

  const loginDemo = useCallback(async () => {
    const res = await authService.demoLogin();
    storeTokens(res);
    persistUser(res.user);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // best effort — clear local session regardless
    }
    clearTokens();
    persistUser(null);
    setUser(null);
    // Bersihkan data offline (outbox + cache) agar antrean satu user tidak
    // terbawa ke akun lain di device yang sama (Batch O3).
    void import("@/lib/offline/db").then((m) => m.clearOfflineData()).catch(() => {});
  }, []);

  const refresh = useCallback(async () => {
    const fresh = await authService.fetchCurrentUser();
    setUser(fresh);
    persistUser(fresh);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Pick<User, "name" | "avatarUrl">>) => {
      const updated = await authService.updateProfile(patch);
      setUser(updated);
      persistUser(updated);
      return updated;
    },
    [],
  );

  const completeOnboarding = useCallback(async () => {
    const updated = await authService.completeOnboarding();
    setUser(updated);
    persistUser(updated);
    return updated;
  }, []);

  const updatePreferences = useCallback(
    async (patch: Partial<User["preferences"]>) => {
      const updatedPrefs = await authService.updatePreferences(patch);
      let merged: User | null = null;
      setUser((prev) => {
        if (!prev) return prev;
        merged = { ...prev, preferences: updatedPrefs };
        persistUser(merged);
        return merged;
      });
      return merged ?? ({ ...(user as User), preferences: updatedPrefs } as User);
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isBootstrapping,
      login,
      cashierLogin,
      loginWithGoogle,
      register,
      loginDemo,
      logout,
      refresh,
      updateProfile,
      updatePreferences,
      completeOnboarding,
    }),
    [
      user,
      isBootstrapping,
      login,
      cashierLogin,
      loginWithGoogle,
      register,
      loginDemo,
      logout,
      refresh,
      updateProfile,
      updatePreferences,
      completeOnboarding,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
