import type { ID, IDRAmount, ISODate } from "./common";

/**
 * Tier paket langganan Monage.
 *
 * - `free` (Gratis): 1 pembukuan, 20 transaksi / bulan.
 * - `personal` (Personal): 10 pembukuan, 100 transaksi / bulan per pembukuan.
 * - `premium` (Premium): unlimited pembukuan, 300 transaksi / bulan per pembukuan.
 * - `business` (Bisnis): quota custom — hubungi penyedia layanan.
 */
export type PlanTier = "free" | "personal" | "premium" | "business";

/**
 * Metadata paket langganan. Server expose lewat `GET /subscription/plans`
 * supaya UI (landing page, halaman billing) selalu sinkron dengan harga
 * & quota terkini tanpa redeploy frontend.
 *
 * Quota `null` berarti **unlimited** untuk tier tsb. Untuk tier `business`
 * semua quota `null` dan harga ditampilkan sebagai "Hubungi kami".
 */
export interface SubscriptionPlan {
  tier: PlanTier;
  name: string;                      // "Gratis", "Personal", "Premium", "Bisnis"
  /** Harga per bulan (IDR). null = "Hubungi kami". 0 = gratis. */
  pricePerMonth: IDRAmount | null;
  /** Max jumlah pembukuan. null = unlimited. */
  maxBooks: number | null;
  /** Max transaksi per bulan per pembukuan. null = unlimited. */
  maxTransactionsPerBookPerMonth: number | null;
  /**
   * Max jumlah anggota per pembukuan (termasuk owner + invitation pending).
   * `null` = unlimited. Quota dikenakan pada owner pembukuan, bukan anggota.
   */
  maxMembersPerBook: number | null;
  /**
   * Max jumlah dompet per pembukuan. `null` = unlimited.
   * Dihitung yang `archived=false`; arsip tidak memakan slot.
   */
  maxAccountsPerBook: number | null;
  /**
   * Max jumlah tabungan per pembukuan. `null` = unlimited.
   * Dihitung yang `archived=false`.
   */
  maxSavingsPerBook: number | null;
  /**
   * Max jumlah Perencanaan Bulanan (Monthly Plan) per pembukuan.
   * `0` = fitur tidak tersedia di plan ini (tier Free).
   * `null` = unlimited. Quota dihitung absolut, bukan per bulan.
   */
  maxMonthlyPlans: number | null;
  /**
   * Apakah plan mendukung backup otomatis ke cloud. Backup manual tetap
   * tersedia untuk semua plan; jadwal otomatis butuh minimal Personal.
   */
  autoBackupEnabled: boolean;
  /** Tagline pendek untuk kartu di landing page. */
  tagline: string;
  /** Daftar benefit untuk dirender sebagai bullet di kartu. */
  highlights: string[];
  /** Mark `true` agar UI menampilkan badge "Paling Populer". */
  featured?: boolean;
  /**
   * CTA label di kartu landing. Frontend pakai ini untuk membedakan
   * tombol normal ("Pilih Personal") dengan tombol kontak ("Hubungi Kami").
   */
  ctaLabel: string;
}

export type SubscriptionStatus =
  | "active"        // aktif & dalam periode berbayar (atau gratis)
  | "trialing"      // masih dalam masa trial
  | "past_due"      // pembayaran gagal, masih grace period
  | "canceled"      // user batal — turun ke free di akhir periode
  | "expired";      // sudah habis & ter-downgrade ke free

/**
 * Info checkout dari payment gateway. Field opsional di response
 * `POST /subscription/change` — hanya muncul kalau backend `PAYMENT_PROVIDER`
 * di-set. Lihat `docs/integration/PAYMENT-GATEWAY.md` §2.
 */
export interface SubscriptionCheckoutInfo {
  provider: "midtrans" | "xendit";
  /** URL hosted checkout — FE redirect / buka popup ke sini. */
  checkoutUrl: string;
  /** Referensi internal gateway, dipakai untuk korelasi webhook. */
  sessionId: string;
}

/**
 * Response baru `POST /subscription/change` setelah payment gateway aktif.
 * Backward compat: kalau backend masih MVP (instant switch), `checkout`
 * tidak ada dan FE treat sebagai sukses langsung — sama persis dengan
 * perilaku sebelumnya.
 */
export interface ChangeSubscriptionResponse {
  subscription: UserSubscription;
  checkout?: SubscriptionCheckoutInfo;
}

/** Metode pembayaran yang didukung untuk upgrade berbayar. */
export type PaymentMethodId = "va" | "gopay" | "qris";

/**
 * Quote satu metode pembayaran: harga paket + biaya admin metode tsb. Server
 * adalah source of truth — UI tidak hard-code tarif biaya admin.
 */
export interface PaymentMethodQuote {
  method: PaymentMethodId;
  label: string;
  description: string;
  baseAmount: IDRAmount;
  /** Persentase PPN yang berlaku (0–100). */
  taxPercent: number;
  /** Nilai PPN (rupiah). */
  tax: IDRAmount;
  adminFee: IDRAmount;
  totalAmount: IDRAmount;
}

/**
 * Status langganan user yang sedang login. Server bertanggung jawab
 * meng-compute `tier` aktual berdasarkan pembayaran terakhir & expiry.
 */
export interface UserSubscription {
  tier: PlanTier;
  status: SubscriptionStatus;
  /** Mulai berlaku — kapan user pertama subscribe / upgrade. */
  activeSince: ISODate;
  /** null untuk tier `free` (tidak ada expiry). */
  currentPeriodEnd: ISODate | null;
  /** true jika user sudah set auto-cancel di akhir periode. */
  cancelAtPeriodEnd: boolean;
  /**
   * true jika pembayaran online (gateway) sudah aktif di backend. Saat false,
   * tombol upgrade berbayar di-disable untuk non-admin.
   */
  paymentEnabled?: boolean;
  /** ISO datetime saat trial Premium gratis diklaim (`null` = belum pernah). */
  trialClaimedAt?: ISODate | null;
  /** true jika user boleh klaim trial Premium (belum pernah & masih tier free). */
  trialEligible?: boolean;
}

/**
 * Statistik penggunaan user vs quota plan. Dipakai untuk:
 *   1. Banner peringatan di dashboard saat ≥80% kuota.
 *   2. Gating tombol "Buat Pembukuan" / "Tambah Transaksi" di 100%.
 *
 * `period` = bulan kalender berjalan (UTC). FE re-fetch tiap bulan baru.
 */
export interface UsageStats {
  period: { year: number; month: number };
  books: {
    used: number;
    limit: number | null;            // null = unlimited
    /** 0-100+. null jika unlimited. */
    percentUsed: number | null;
  };
  /**
   * Statistik transaksi per pembukuan untuk bulan berjalan.
   * Hanya pembukuan tempat user adalah anggota.
   */
  transactionsPerBook: Array<{
    bookId: ID;
    bookName: string;
    used: number;
    limit: number | null;
    percentUsed: number | null;
  }>;
  /**
   * Statistik anggota per pembukuan. `used` = members aktif + invitation
   * pending. Plan owner pembukuan yang menentukan `limit`.
   */
  membersPerBook: Array<{
    bookId: ID;
    bookName: string;
    used: number;
    limit: number | null;
    percentUsed: number | null;
  }>;
  /** Statistik dompet aktif per pembukuan vs `plan.maxAccountsPerBook`. */
  accountsPerBook: Array<{
    bookId: ID;
    bookName: string;
    used: number;
    limit: number | null;
    percentUsed: number | null;
  }>;
  /** Statistik tabungan aktif per pembukuan vs `plan.maxSavingsPerBook`. */
  savingsPerBook: Array<{
    bookId: ID;
    bookName: string;
    used: number;
    limit: number | null;
    percentUsed: number | null;
  }>;
}
