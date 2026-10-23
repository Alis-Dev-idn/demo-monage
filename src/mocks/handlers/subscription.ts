import { http, HttpResponse } from "msw";
import type {
  PlanTier,
  SubscriptionPlan,
  UsageStats,
  UserSubscription,
} from "@/types";
import { endpoint } from "../baseUrl";

/**
 * Plan catalog — mirror dari §4.12 BACKEND-API-SPEC. Harga & quota di sini
 * adalah single source untuk mock; FE meng-konsumsi via `/subscription/plans`.
 */
export const mockPlans: SubscriptionPlan[] = [
  {
    tier: "free",
    name: "Gratis",
    pricePerMonth: 0,
    maxBooks: 1,
    maxTransactionsPerBookPerMonth: 20,
    maxMembersPerBook: 3,
    maxAccountsPerBook: 3,
    maxSavingsPerBook: 2,
    maxMonthlyPlans: 0,
    autoBackupEnabled: false,
    tagline: "Cocok untuk mulai mencatat keuangan pribadi.",
    highlights: [
      "1 pembukuan",
      "20 transaksi / bulan",
      "3 dompet & 2 tabungan",
      "Share hingga 3 anggota",
      "Backup manual & ekspor data",
      "Perencanaan Bulanan tidak tersedia",
    ],
    ctaLabel: "Mulai Gratis",
  },
  {
    tier: "personal",
    name: "Personal",
    pricePerMonth: 29_000,
    maxBooks: 10,
    maxTransactionsPerBookPerMonth: 100,
    maxMembersPerBook: 10,
    maxAccountsPerBook: 15,
    maxSavingsPerBook: 10,
    maxMonthlyPlans: 3,
    autoBackupEnabled: true,
    tagline: "Untuk yang punya beberapa konteks keuangan.",
    highlights: [
      "Hingga 10 pembukuan",
      "100 transaksi / bulan per pembukuan",
      "15 dompet & 10 tabungan per pembukuan",
      "Share hingga 10 anggota per pembukuan",
      "Backup otomatis ke Google Drive",
      "Perencanaan Bulanan (sampai 3 plan)",
    ],
    featured: true,
    ctaLabel: "Pilih Personal",
  },
  {
    tier: "premium",
    name: "Premium",
    pricePerMonth: 79_000,
    maxBooks: null,
    maxTransactionsPerBookPerMonth: 300,
    maxMembersPerBook: 25,
    maxAccountsPerBook: null,
    maxSavingsPerBook: null,
    maxMonthlyPlans: null,
    autoBackupEnabled: true,
    tagline: "Power-user atau pelaku usaha kecil.",
    highlights: [
      "Pembukuan tanpa batas",
      "300 transaksi / bulan per pembukuan",
      "Dompet, tabungan & perencanaan tanpa batas",
      "Share hingga 25 anggota per pembukuan",
      "Backup otomatis (harian) + ekspor lengkap",
    ],
    ctaLabel: "Pilih Premium",
  },
  {
    tier: "business",
    name: "Bisnis",
    pricePerMonth: null,
    maxBooks: null,
    maxTransactionsPerBookPerMonth: null,
    maxMembersPerBook: null,
    maxAccountsPerBook: null,
    maxSavingsPerBook: null,
    maxMonthlyPlans: null,
    autoBackupEnabled: true,
    tagline: "Tim & perusahaan dengan kebutuhan khusus.",
    highlights: [
      "Quota custom sesuai kebutuhan",
      "Anggota & pembukuan tanpa batas",
      "Backup otomatis kustom + on-prem opsional",
      "SLA dukungan + dedicated account manager",
      "Integrasi & invoicing khusus",
    ],
    ctaLabel: "Hubungi Kami",
  },
];

/**
 * Persisted mock subscription state — disimpan di sessionStorage agar
 * bertahan setelah F5 di tab yang sama (mirror dari access token yang
 * juga di sessionStorage). Saat tab ditutup → otomatis clear, user akan
 * default ke `free` di session berikutnya kecuali login lagi.
 *
 * Saat user logout, `__setActiveTier("free")` di-panggil dan key dihapus
 * — selaras dengan permintaan "ganti akun + refresh → kembali ke gratis".
 */
const TIER_KEY = "monage:mock:subscription:tier";
const SINCE_KEY = "monage:mock:subscription:since";
const PERIOD_END_KEY = "monage:mock:subscription:periodEnd";
const CANCEL_KEY = "monage:mock:subscription:cancelAtPeriodEnd";
const TRIAL_KEY = "monage:mock:subscription:trialClaimedAt";

function readSession<T = string>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const v = window.sessionStorage.getItem(key);
  return (v === null ? fallback : (v as unknown as T));
}

function writeSession(key: string, value: string | null): void {
  if (typeof window === "undefined") return;
  if (value === null) window.sessionStorage.removeItem(key);
  else window.sessionStorage.setItem(key, value);
}

let currentTier: PlanTier = readSession(TIER_KEY, "free" as PlanTier);
let cancelAtPeriodEnd: boolean = readSession<string>(CANCEL_KEY, "") === "1";
let activeSince = readSession(SINCE_KEY, "2026-04-15T00:00:00.000Z");
let currentPeriodEnd: string | null = (() => {
  const v = readSession<string | null>(PERIOD_END_KEY, null);
  return v && v !== "null" ? v : null;
})();
let trialClaimedAt: string | null = (() => {
  const v = readSession<string | null>(TRIAL_KEY, null);
  return v && v !== "null" ? v : null;
})();
let trialStatus = false;

/** Dipanggil auth handler saat login berhasil (sync). */
export function __setActiveTier(tier: PlanTier): void {
  currentTier = tier;
  activeSince = new Date().toISOString();
  cancelAtPeriodEnd = false;
  currentPeriodEnd =
    tier === "free"
      ? null
      : new Date(Date.now() + 30 * 86_400_000).toISOString();
  writeSession(TIER_KEY, tier);
  writeSession(SINCE_KEY, activeSince);
  writeSession(PERIOD_END_KEY, currentPeriodEnd);
  writeSession(CANCEL_KEY, "");
}

export function __getActiveTier(): PlanTier {
  return currentTier;
}

export function __getMockPlan(tier: PlanTier = currentTier): SubscriptionPlan {
  return mockPlans.find((p) => p.tier === tier) ?? mockPlans[0];
}

/**
 * Quota check helper untuk handler entity lain (book, transaction).
 * Return { allowed, message } supaya caller bisa decide 422 atau 201.
 */
export interface QuotaCheck {
  allowed: boolean;
  message?: string;
  details?: Record<string, unknown>;
}

export function checkBookQuota(currentBookCount: number): QuotaCheck {
  const plan = __getMockPlan();
  if (plan.maxBooks === null) return { allowed: true };
  if (currentBookCount < plan.maxBooks) return { allowed: true };
  return {
    allowed: false,
    message: `Anda sudah mencapai batas ${plan.maxBooks} pembukuan di paket ${plan.name}. Upgrade untuk menambah pembukuan.`,
    details: { limit: plan.maxBooks, used: currentBookCount, tier: plan.tier },
  };
}

export function checkTransactionQuota(
  bookId: string,
  txCountThisMonthInBook: number,
): QuotaCheck {
  const plan = __getMockPlan();
  if (plan.maxTransactionsPerBookPerMonth === null) return { allowed: true };
  if (txCountThisMonthInBook < plan.maxTransactionsPerBookPerMonth)
    return { allowed: true };
  return {
    allowed: false,
    message: `Pembukuan ini sudah mencapai batas ${plan.maxTransactionsPerBookPerMonth} transaksi bulan ini di paket ${plan.name}. Upgrade untuk menambah quota.`,
    details: {
      bookId,
      limit: plan.maxTransactionsPerBookPerMonth,
      used: txCountThisMonthInBook,
      tier: plan.tier,
    },
  };
}

/**
 * Cek apakah owner pembukuan masih bisa mengundang anggota tambahan.
 * `currentUsage` = jumlah member aktif + invitation berstatus `pending`.
 */
export function checkMemberQuota(
  bookId: string,
  currentUsage: number,
): QuotaCheck {
  const plan = __getMockPlan();
  if (plan.maxMembersPerBook === null) return { allowed: true };
  if (currentUsage < plan.maxMembersPerBook) return { allowed: true };
  return {
    allowed: false,
    message: `Pembukuan ini sudah mencapai batas ${plan.maxMembersPerBook} anggota di paket ${plan.name}. Upgrade untuk mengundang lebih banyak orang.`,
    details: {
      bookId,
      limit: plan.maxMembersPerBook,
      used: currentUsage,
      tier: plan.tier,
    },
  };
}

export function checkAccountQuota(
  bookId: string,
  currentActiveCount: number,
): QuotaCheck {
  const plan = __getMockPlan();
  if (plan.maxAccountsPerBook === null) return { allowed: true };
  if (currentActiveCount < plan.maxAccountsPerBook) return { allowed: true };
  return {
    allowed: false,
    message: `Pembukuan ini sudah punya ${plan.maxAccountsPerBook} dompet aktif di paket ${plan.name}. Arsipkan dompet lama atau upgrade.`,
    details: {
      bookId,
      limit: plan.maxAccountsPerBook,
      used: currentActiveCount,
      tier: plan.tier,
    },
  };
}

export function checkSavingQuota(
  bookId: string,
  currentActiveCount: number,
): QuotaCheck {
  const plan = __getMockPlan();
  if (plan.maxSavingsPerBook === null) return { allowed: true };
  if (currentActiveCount < plan.maxSavingsPerBook) return { allowed: true };
  return {
    allowed: false,
    message: `Pembukuan ini sudah punya ${plan.maxSavingsPerBook} tabungan aktif di paket ${plan.name}. Arsipkan atau upgrade.`,
    details: {
      bookId,
      limit: plan.maxSavingsPerBook,
      used: currentActiveCount,
      tier: plan.tier,
    },
  };
}

/**
 * Hitung transaksi user di bulan berjalan per pembukuan. Dipakai handler
 * /subscription/usage dan oleh quota check di transaction handler.
 */
export function countTransactionsThisMonthByBook(
  transactions: Array<{ bookId?: string; occurredAt: string }>,
  fallbackBookId: string,
): Map<string, number> {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const map = new Map<string, number>();
  for (const t of transactions) {
    const d = new Date(t.occurredAt);
    if (d.getUTCFullYear() !== y || d.getUTCMonth() !== m) continue;
    const id = t.bookId ?? fallbackBookId;
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return map;
}

export const subscriptionHandlers = [
  http.get(endpoint("/subscription/plans"), () => HttpResponse.json(mockPlans)),

  http.get(endpoint("/subscription/me"), () => {
    return HttpResponse.json({
      tier: currentTier,
      status: trialStatus ? "trialing" : "active",
      activeSince,
      currentPeriodEnd: currentTier === "free" ? null : currentPeriodEnd,
      cancelAtPeriodEnd,
      trialClaimedAt,
      trialEligible: trialClaimedAt === null && currentTier === "free",
    } satisfies UserSubscription);
  }),

  http.post(endpoint("/subscription/claim-trial"), () => {
    if (trialClaimedAt !== null) {
      return HttpResponse.json(
        {
          code: "BUSINESS_RULE",
          message:
            "Trial premium sudah pernah digunakan dan tidak bisa diklaim lagi.",
        },
        { status: 422 },
      );
    }
    if (currentTier !== "free") {
      return HttpResponse.json(
        {
          code: "BUSINESS_RULE",
          message: "Trial hanya bisa diklaim dari paket Gratis.",
        },
        { status: 422 },
      );
    }
    const now = new Date();
    currentTier = "premium";
    trialStatus = true;
    activeSince = now.toISOString();
    currentPeriodEnd = new Date(now.getTime() + 30 * 86_400_000).toISOString();
    cancelAtPeriodEnd = true;
    trialClaimedAt = now.toISOString();
    writeSession(TIER_KEY, currentTier);
    writeSession(SINCE_KEY, activeSince);
    writeSession(PERIOD_END_KEY, currentPeriodEnd);
    writeSession(CANCEL_KEY, "1");
    writeSession(TRIAL_KEY, trialClaimedAt);
    return HttpResponse.json({
      tier: currentTier,
      status: "trialing",
      activeSince,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      trialClaimedAt,
      trialEligible: false,
    } satisfies UserSubscription);
  }),

  /**
   * Pakai lazy import supaya handler ini tidak meng-create circular module
   * load saat book.ts & transaction.ts sama-sama meng-import quota helper.
   */
  http.get(endpoint("/subscription/usage"), async () => {
    const { __getMockBooksForUser, __getMockMemberUsageByBook } = await import("./book");
    const { __transactionsStore } = await import("./transaction");
    const { __accountsStore } = await import("./account");
    const { __getSavingCountByBook } = await import("./saving");
    const { DEFAULT_BOOK_ID } = await import("../data/seed");
    const plan = __getMockPlan(currentTier);
    const myBooks = __getMockBooksForUser();
    const txByBook = countTransactionsThisMonthByBook(
      __transactionsStore,
      DEFAULT_BOOK_ID,
    );
    const memberUsageByBook = __getMockMemberUsageByBook();
    const now = new Date();
    const usage: UsageStats = {
      period: { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 },
      books: {
        used: myBooks.length,
        limit: plan.maxBooks,
        percentUsed:
          plan.maxBooks === null
            ? null
            : Math.round((myBooks.length / plan.maxBooks) * 100),
      },
      transactionsPerBook: myBooks.map((b) => {
        const used = txByBook.get(b._id) ?? 0;
        const limit = plan.maxTransactionsPerBookPerMonth;
        return {
          bookId: b._id,
          bookName: b.name,
          used,
          limit,
          percentUsed: limit === null ? null : Math.round((used / limit) * 100),
        };
      }),
      membersPerBook: myBooks.map((b) => {
        const used = memberUsageByBook.get(b._id) ?? 1;
        const limit = plan.maxMembersPerBook;
        return {
          bookId: b._id,
          bookName: b.name,
          used,
          limit,
          percentUsed: limit === null ? null : Math.round((used / limit) * 100),
        };
      }),
      accountsPerBook: myBooks.map((b) => {
        const used = __accountsStore.filter(
          (a) => !a.archived && (a.bookId ?? DEFAULT_BOOK_ID) === b._id,
        ).length;
        const limit = plan.maxAccountsPerBook;
        return {
          bookId: b._id,
          bookName: b.name,
          used,
          limit,
          percentUsed: limit === null ? null : Math.round((used / limit) * 100),
        };
      }),
      savingsPerBook: myBooks.map((b) => {
        const used = __getSavingCountByBook(b._id);
        const limit = plan.maxSavingsPerBook;
        return {
          bookId: b._id,
          bookName: b.name,
          used,
          limit,
          percentUsed: limit === null ? null : Math.round((used / limit) * 100),
        };
      }),
    };
    return HttpResponse.json(usage);
  }),

  http.post(endpoint("/subscription/change"), async ({ request }) => {
    const body = (await request.json()) as { tier: PlanTier };
    if (!body.tier || !mockPlans.find((p) => p.tier === body.tier)) {
      return HttpResponse.json(
        { code: "BAD_REQUEST", message: "Tier tidak valid." },
        { status: 400 },
      );
    }
    if (body.tier === "business") {
      return HttpResponse.json(
        {
          code: "BUSINESS_RULE",
          message:
            "Paket Bisnis hanya bisa diaktifkan via tim sales. Silakan gunakan formulir kontak.",
        },
        { status: 422 },
      );
    }
    __setActiveTier(body.tier);
    return HttpResponse.json({
      tier: currentTier,
      status: "active",
      activeSince,
      currentPeriodEnd,
      cancelAtPeriodEnd,
    } satisfies UserSubscription);
  }),

  http.post(endpoint("/subscription/cancel"), () => {
    cancelAtPeriodEnd = true;
    writeSession(CANCEL_KEY, "1");
    return HttpResponse.json({
      tier: currentTier,
      status: "active",
      activeSince,
      currentPeriodEnd,
      cancelAtPeriodEnd,
    } satisfies UserSubscription);
  }),

  http.post(endpoint("/subscription/business-contact"), async ({ request }) => {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      message?: string;
    };
    if (!body.name || !body.email || !body.message) {
      return HttpResponse.json(
        { code: "VALIDATION_ERROR", message: "Nama, email, dan pesan wajib." },
        { status: 400 },
      );
    }
    return HttpResponse.json({ ok: true });
  }),
];
