import type { ID, ISODate } from "./common";

export interface UserPreferences {
  currency: "IDR";
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  theme: "light";
  /**
   * Tanggal mulai siklus anggaran (1-28). Default 1 = kalender bulan.
   * Mis. 25 = anggaran reset setiap tanggal 25 (cocok untuk siklus gajian).
   */
  budgetCycleStartDay?: number;
  budgetNotification: {
    enabled: boolean;
    warnThreshold: number;
    overThreshold: number;
  };
}

/** Granular admin permission. Hanya relevan kalau `roles` mengandung "admin". */
export type AdminLevel = "super" | "support" | "readonly";

export interface User {
  _id: ID;
  email: string;
  name: string;
  avatarUrl?: string;
  preferences: UserPreferences;
  onboardedAt: ISODate | null;
  /**
   * Kapan email akun terverifikasi. `null`/undefined = belum diverifikasi.
   * Akun Google otomatis terisi. Wajib terisi untuk klaim trial Premium.
   */
  emailVerifiedAt?: ISODate | null;
  createdAt: ISODate;
  /**
   * Daftar role system-level. Mengandung `"admin"` kalau user ini punya
   * akses ke `/admin/*`. Undefined / array kosong = user biasa.
   */
  roles?: string[];
  /** Level admin (super/support/readonly). Undefined untuk user biasa. */
  adminLevel?: AdminLevel;
  /** Kalau true, semua quota check di-bypass — admin pakai aplikasi tanpa batas. */
  bypassQuota?: boolean;
  /** Akun dibekukan oleh admin — tidak bisa login sampai di-unfreeze. */
  locked?: boolean;
  /** ISO datetime saat akun dibekukan. */
  lockedAt?: ISODate | null;
  /** Google subject id bila akun tertaut ke Google (null/undefined = belum). */
  googleId?: string | null;
  /** Metode masuk yang aktif: `"password"` dan/atau `"google"`. */
  authProviders?: Array<"password" | "google">;
  /** Akun demo ephemeral (dibuat via tombol "Login Demo") — data auto-hapus dalam beberapa jam. */
  isDemo?: boolean;
}

/** True bila akun punya kata sandi (bisa login email/password). */
export function hasPassword(user: User | null | undefined): boolean {
  if (!user) return false;
  // authProviders adalah sumber kebenaran; fallback untuk akun lama tanpa field
  // ini: anggap punya sandi kecuali akun Google-only.
  if (user.authProviders) return user.authProviders.includes("password");
  return !user.googleId;
}

/** True bila akun sudah tertaut ke Google. */
export function isGoogleLinked(user: User | null | undefined): boolean {
  return !!user?.googleId;
}

/** True kalau user punya role admin (apapun levelnya). */
export function isAdmin(user: User | null | undefined): boolean {
  return !!user?.roles?.includes("admin");
}
