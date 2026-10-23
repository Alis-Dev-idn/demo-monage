import type { ID, IDRAmount, ISODate } from "./common";

/**
 * Jenis group dalam satu minggu plan:
 * - `shopping` = list belanja (item flat dengan harga input langsung).
 * - `meal`     = menu masak (item = nama masakan; harga & ceklis di level bahan).
 * - `hobby`    = kebutuhan hobi (sepatu lari, peralatan musik, dsb).
 * - `bills`    = tagihan rutin (listrik, internet, langganan).
 * - `other`    = kategori bebas lain.
 *
 * User memilih kind saat membuat group. Tidak ada group auto-default.
 */
export type PlanGroupKind = "shopping" | "meal" | "hobby" | "bills" | "other";

/**
 * Kategori bahan untuk item di grup Menu Masak (meal) — menggantikan icon item.
 * Dipakai untuk rincian per-kategori pada panel "Rincian" tiap group.
 */
export type PlanItemCategory =
  | "sayuran"
  | "protein"
  | "karbohidrat"
  | "bumbu"
  | "buah"
  | "lainnya";

/**
 * Plan kebutuhan satu bulan — disusun per minggu. Linked optional ke kategori
 * transaksi untuk auto-track berapa yang sudah ter-realisasi (sum tx out di
 * kategori tsb dalam periode minggu).
 */
export interface MonthlyPlan {
  _id: ID;
  userId: ID;
  bookId?: ID;
  period: { year: number; month: number };
  name: string;                       // mis. "Belanja & Menu Mei 2026"
  /** Total budget bulanan opsional — untuk tampilan progress. */
  totalBudget?: IDRAmount;
  weeks: WeekPlan[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface WeekPlan {
  _id: ID;
  /** 1..5 — minggu ke-N dalam bulan tsb. */
  weekNumber: number;
  startDate: ISODate;
  endDate: ISODate;
  groups: PlanGroup[];
}

export interface PlanGroup {
  _id: ID;
  kind: PlanGroupKind;
  name: string;                       // user-defined: "Belanja Mingguan", "Menu Senin", "Tagihan"
  /** Icon lucide (mis. "ShoppingCart", "ChefHat", "Music"). Default per kind. */
  icon: string;
  /**
   * Kategori transaksi terkait. WAJIB untuk auto-create transaksi saat
   * user ceklis item (categoryId dipakai sebagai kategori transaksi out).
   * Bisa di-override per item nanti.
   */
  linkedCategoryId?: ID;
  /** Catatan opsional untuk seluruh group. */
  note?: string;
  /** Budget khusus group ini (opsional). Input dipindah dari plan ke group (#Q3). */
  budget?: number;
  items: PlanItem[];
}

export interface PlanItem {
  _id: ID;
  name: string;                       // "Beras 5kg" / "Nasi Goreng Kambing"
  /** @deprecated Icon item tak lagi dipakai di UI. Disimpan untuk data lama. */
  icon?: string;
  /** Untuk shopping: kuantitas + unit. Untuk meal: porsi. */
  quantity?: number;
  unit?: string;                      // "kg", "porsi", "pcs"
  /**
   * Harga estimasi (Rp). Untuk item dengan `ingredients`, FE/server WAJIB
   * compute sebagai `sum(ingredients.estimatedPrice)` — user tidak input
   * harga di level item. Untuk item tanpa ingredients, user input langsung.
   */
  estimatedPrice?: IDRAmount;
  /**
   * Dompet sumber dana untuk auto-transaksi saat user ceklis. WAJIB
   * sebelum `done = true` (kecuali item punya ingredients — saat itu
   * linkedAccountId di-set per ingredient). Boleh di-set saat create item.
   */
  linkedAccountId?: ID;
  /**
   * ID Transaction yang dibuat backend saat user ceklis. Diset & dikelola
   * server. FE TIDAK menulis field ini — readonly.
   */
  linkedTransactionId?: ID;
  notes?: string;
  /** Untuk meal: daftar bahan masakan. Untuk shopping/lain: undefined / []. */
  ingredients?: PlanIngredient[];
  /**
   * Checklist done. Untuk item dengan ingredients, di-compute `true` jika
   * SEMUA ingredient.done === true. Untuk item tanpa ingredients, user
   * toggle langsung lewat PATCH item.
   */
  done: boolean;
  order: number;
}

export interface PlanIngredient {
  _id: ID;
  name: string;
  /** Kategori bahan (grup Menu Masak) — mis. sayuran/protein. */
  category?: PlanItemCategory;
  quantity: number;
  unit: string;                       // "gr", "ml", "sdm", "siung"
  /** Harga estimasi bahan — sumber utama harga untuk item meal. */
  estimatedPrice?: IDRAmount;
  /**
   * Dompet sumber dana untuk auto-transaksi saat user ceklis bahan ini.
   * Optional — kalau kosong, fallback ke `item.linkedAccountId`.
   */
  linkedAccountId?: ID;
  /** ID Transaction otomatis saat ceklis. Server-managed, readonly. */
  linkedTransactionId?: ID;
  /** Checklist done per bahan. */
  done: boolean;
  note?: string;
}

/**
 * Agregat realisasi vs plan — di-compute server berdasarkan transaksi
 * yang occurredAt jatuh di rentang minggu + categoryId match
 * `group.linkedCategoryId`.
 */
export interface MonthlyPlanProgress {
  planId: ID;
  /** Total budget / total estimasi semua item. */
  totalEstimated: IDRAmount;
  /** Sum realisasi (tx out di kategori terkait) sepanjang bulan. */
  totalSpent: IDRAmount;
  weeks: Array<{
    weekId: ID;
    weekNumber: number;
    estimated: IDRAmount;
    spent: IDRAmount;
    /** Per-group breakdown — null `spent` jika group tidak punya `linkedCategoryId`. */
    groups: Array<{
      groupId: ID;
      kind: PlanGroupKind;
      name: string;
      estimated: IDRAmount;
      spent: IDRAmount | null;
      itemsDone: number;
      itemsTotal: number;
    }>;
  }>;
}
