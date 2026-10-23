import { api } from "@/utils/api";
import type {
  AdminAuditPage,
  AdminCreateUserPayload,
  AdminImpersonatePayload,
  AdminListAuditQuery,
  AdminListUsersQuery,
  AdminPatchPlanPayload,
  AdminPatchUserPayload,
  AdminSetTierPayload,
  AdminSubscriptionResult,
  AdminSubscriptionStats,
  AdminSystemHealth,
  AdminUser,
  AdminUserListPage,
  ID,
  PlanTier,
  SubscriptionPlan,
} from "@/types";

// ── Users ───────────────────────────────────────────────────────────────────

export function fetchAdminUsers(
  query: AdminListUsersQuery = {},
): Promise<AdminUserListPage> {
  return api().get<AdminUserListPage>("/admin/users", {
    params: query as Record<string, unknown>,
  });
}

export function fetchAdminUser(id: ID): Promise<AdminUser> {
  return api().get<AdminUser>(`/admin/users/${id}`);
}

export function patchAdminUser(
  id: ID,
  payload: AdminPatchUserPayload,
): Promise<AdminUser> {
  return api().patch<AdminUser>(`/admin/users/${id}`, payload);
}

/** Admin create user (level super). Backend handle email reset bila no-password. */
export function createAdminUser(
  payload: AdminCreateUserPayload,
): Promise<AdminUser> {
  return api().post<AdminUser>("/admin/users", payload);
}

/** Soft-delete user. */
export function deleteAdminUser(id: ID): Promise<{ ok: true }> {
  return api().delete<{ ok: true }>(`/admin/users/${id}`);
}

/** Trigger email reset-password ke user target (admin-initiated). */
export function forceResetUserPassword(id: ID): Promise<{ ok: true }> {
  return api().post<{ ok: true }>(`/admin/users/${id}/reset-password`);
}

/**
 * Set / unset `subscription.impersonatedTier` di user target. Dipakai support
 * untuk lihat aplikasi dari sudut pandang tier tertentu tanpa ganti billing.
 */
export function impersonateUser(
  id: ID,
  payload: AdminImpersonatePayload,
): Promise<AdminSubscriptionResult> {
  return api().post<AdminSubscriptionResult>(
    `/admin/users/${id}/impersonate`,
    payload,
  );
}

// ── Subscription ────────────────────────────────────────────────────────────

/**
 * Admin tier-set — bypass DTO restriction (boleh set ke `business`).
 * Perpanjangan periode pakai field `periodDays`.
 */
export function setUserSubscription(
  id: ID,
  payload: AdminSetTierPayload,
): Promise<AdminSubscriptionResult> {
  return api().patch<AdminSubscriptionResult>(
    `/admin/users/${id}/subscription`,
    payload,
  );
}

export function fetchSubscriptionStats(): Promise<AdminSubscriptionStats> {
  return api().get<AdminSubscriptionStats>("/admin/subscriptions/stats");
}

// ── Plan catalog ────────────────────────────────────────────────────────────

export function fetchAdminPlans(): Promise<SubscriptionPlan[]> {
  return api().get<SubscriptionPlan[]>("/admin/plans");
}

/** Upsert override per tier. Field yang `undefined` tidak diubah. */
export function patchAdminPlan(
  tier: PlanTier,
  payload: AdminPatchPlanPayload,
): Promise<SubscriptionPlan> {
  return api().patch<SubscriptionPlan>(`/admin/plans/${tier}`, payload);
}

/** Drop override → tier kembali ke default catalog. */
export function resetAdminPlan(tier: PlanTier): Promise<SubscriptionPlan> {
  return api().delete<SubscriptionPlan>(`/admin/plans/${tier}`);
}

// ── Pengaturan pembayaran (PPN) ───────────────────────────────────────────────

export interface PaymentSettings {
  /** Persentase PPN aktif (0–100). */
  taxPercent: number;
}

export function fetchPaymentSettings(): Promise<PaymentSettings> {
  return api().get<PaymentSettings>("/admin/payment-settings");
}

export function patchPaymentSettings(taxPercent: number): Promise<PaymentSettings> {
  return api().patch<PaymentSettings>("/admin/payment-settings", { taxPercent });
}

// ── Audit ───────────────────────────────────────────────────────────────────

export function fetchAdminAudit(
  query: AdminListAuditQuery = {},
): Promise<AdminAuditPage> {
  return api().get<AdminAuditPage>("/admin/audit", {
    params: query as Record<string, unknown>,
  });
}

// ── System ──────────────────────────────────────────────────────────────────

export function fetchAdminSystemHealth(): Promise<AdminSystemHealth> {
  return api().get<AdminSystemHealth>("/admin/system/health");
}
