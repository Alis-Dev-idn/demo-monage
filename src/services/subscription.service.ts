import { api } from "@/utils/api";
import type {
  ChangeSubscriptionResponse,
  PaymentMethodId,
  PaymentMethodQuote,
  PlanTier,
  SubscriptionPlan,
  UsageStats,
  UserSubscription,
} from "@/types";

/**
 * Daftar paket yang tersedia (Gratis / Personal / Premium / Bisnis).
 * Server adalah single source of truth — frontend tidak hard-code harga.
 */
export function fetchPlans(): Promise<SubscriptionPlan[]> {
  return api().get<SubscriptionPlan[]>("/subscription/plans");
}

/** Subscription user yang sedang login. */
export function fetchMySubscription(): Promise<UserSubscription> {
  return api().get<UserSubscription>("/subscription/me");
}

/** Statistik penggunaan vs quota plan untuk bulan berjalan. */
export function fetchMyUsage(): Promise<UsageStats> {
  return api().get<UsageStats>("/subscription/usage");
}

/** Metode pembayaran + biaya admin untuk satu tier berbayar (UI selector). */
export function fetchPaymentMethods(
  tier: "personal" | "premium",
): Promise<PaymentMethodQuote[]> {
  return api().get<PaymentMethodQuote[]>(
    `/subscription/payment-methods?tier=${tier}`,
  );
}

export interface UpgradePayload {
  tier: Exclude<PlanTier, "business">;
  /** Metode terpilih — wajib untuk upgrade berbayar via gateway. */
  paymentMethod?: PaymentMethodId;
}

/**
 * Pindah plan (upgrade / downgrade). Backend MVP return `UserSubscription`
 * langsung; saat payment gateway aktif, response berbentuk
 * `{ subscription, checkout? }` (lihat `ChangeSubscriptionResponse`).
 *
 * Service ini menormalkan kedua bentuk supaya caller selalu menerima
 * shape `ChangeSubscriptionResponse` — tanpa branch per call site.
 */
export async function changeSubscription(
  payload: UpgradePayload,
): Promise<ChangeSubscriptionResponse> {
  const raw = await api().post<
    UserSubscription | ChangeSubscriptionResponse
  >("/subscription/change", payload);
  if (raw && typeof raw === "object" && "subscription" in raw) {
    return raw as ChangeSubscriptionResponse;
  }
  // Bentuk legacy: backend MVP return UserSubscription murni.
  return { subscription: raw as UserSubscription };
}

/** Batal subscription — efektif di akhir periode berjalan. */
export function cancelSubscription(): Promise<UserSubscription> {
  return api().post<UserSubscription>("/subscription/cancel");
}

/**
 * Klaim trial Premium 1 bulan (gratis). Hanya sekali per akun & butuh email
 * terverifikasi — backend menolak bila tidak memenuhi syarat.
 */
export function claimTrial(): Promise<UserSubscription> {
  return api().post<UserSubscription>("/subscription/claim-trial");
}

export interface BusinessContactPayload {
  name: string;
  email: string;
  company?: string;
  message: string;
}

/**
 * Form "Hubungi Kami" untuk tier Bisnis. Server kirim email ke tim sales.
 */
export function requestBusinessContact(
  payload: BusinessContactPayload,
): Promise<{ ok: true }> {
  return api().post<{ ok: true }>("/subscription/business-contact", payload);
}
