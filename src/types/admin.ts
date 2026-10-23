import type { ID, ISODate, Paginated } from "./common";
import type { AdminLevel, User } from "./user";
import type { PlanTier, SubscriptionStatus } from "./subscription";

/**
 * User shape yang dikembalikan oleh endpoint `/admin/users[/:id]`.
 * Sama dengan `User` publik plus ringkasan subscription (untuk kolom tabel
 * admin).
 */
export type AdminUser = User & {
  tier: PlanTier;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: ISODate | null;
};

export type AdminUserListPage = Paginated<AdminUser>;

/** Body untuk `PATCH /admin/users/:id`. */
export interface AdminPatchUserPayload {
  name?: string;
  /** `null` melepas role admin (kembali jadi user biasa). */
  adminLevel?: AdminLevel | null;
  bypassQuota?: boolean;
  roles?: string[];
  /**
   * ISO datetime → tandai user sudah selesai onboarding (skip wizard).
   * `null` → reset ke status belum onboarding.
   */
  onboardedAt?: ISODate | null;
  /** `true` = bekukan akun, `false` = aktifkan kembali. */
  locked?: boolean;
}

/** Body untuk admin `POST /admin/users`. Password opsional. */
export interface AdminCreateUserPayload {
  email: string;
  name: string;
  /** Kalau kosong, backend akan kirim email reset password ke user. */
  password?: string;
  adminLevel?: AdminLevel;
  bypassQuota?: boolean;
}

/**
 * Body untuk `PATCH /admin/plans/:tier`. Field yang `undefined` tidak
 * mengubah override; `null` untuk reset quota tunggal jadi "unlimited".
 */
export interface AdminPatchPlanPayload {
  name?: string;
  pricePerMonth?: number | null;
  maxBooks?: number | null;
  maxTransactionsPerBookPerMonth?: number | null;
  maxAccountsPerBook?: number | null;
  maxSavingsPerBook?: number | null;
  maxMembersPerBook?: number | null;
  maxMonthlyPlans?: number | null;
  autoBackupEnabled?: boolean;
  tagline?: string;
  highlights?: string[];
  featured?: boolean;
  ctaLabel?: string;
}

/** Body untuk `POST /admin/users/:id/impersonate`. */
export interface AdminImpersonatePayload {
  /** `null` membersihkan override impersonation. */
  tier: PlanTier | null;
}

/** Body untuk `PATCH /admin/users/:id/subscription` (admin tier-set). */
export interface AdminSetTierPayload {
  tier: PlanTier;
  /** Hari yang ditambahkan ke `currentPeriodEnd`. Default backend: 30. */
  periodDays?: number;
}

/** Hasil impersonate/setUserSubscription — entity Subscription mentah dari Mongo. */
export interface AdminSubscriptionResult {
  _id: ID;
  userId: ID;
  tier: PlanTier;
  status: SubscriptionStatus;
  currentPeriodEnd: ISODate | null;
  impersonatedTier?: PlanTier | null;
  cancelAtPeriodEnd?: boolean;
}

/** Response `GET /admin/subscriptions/stats`. */
export interface AdminSubscriptionStats {
  /** Map `tier` → jumlah subscription dengan tier itu. */
  counts: Record<PlanTier, number>;
  total: number;
}

/** Response `GET /admin/system/health`. */
export interface AdminSystemHealth {
  status: "ok";
  /** Detik sejak proses backend start. */
  uptime: number;
  /** ISO datetime saat health probe dipanggil. */
  timestamp: ISODate;
  nodeVersion: string;
  env: "development" | "test" | "production";
}

/** Entry audit log admin. */
export interface AdminAuditEntry {
  _id: ID;
  actorId: ID;
  actorEmail: string;
  actorLevel: "super" | "support" | "readonly" | "system";
  action: string;
  targetType: string;
  targetId: string | null;
  occurredAt: ISODate;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string | null;
  note?: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type AdminAuditPage = Paginated<AdminAuditEntry>;

export interface AdminListUsersQuery {
  page?: number;
  size?: number;
  search?: string;
}

export interface AdminListAuditQuery {
  page?: number;
  size?: number;
  action?: string;
  actorId?: ID;
  targetType?: string;
  targetId?: string;
  /** ISO datetime range filter. */
  from?: ISODate;
  to?: ISODate;
}
