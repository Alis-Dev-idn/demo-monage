import type { ID, ISODate } from "./common";

// ── Produk & stok ────────────────────────────────────────────────────────────
export interface Product {
  _id: ID;
  bookId: ID;
  name: string;
  sku?: string;
  barcode?: string;
  unit: string;
  sellPrice: number;
  costPrice: number;
  stockQty: number;
  trackStock: boolean;
  categoryName?: string;
  /** URL gambar produk (storage). Tak ada = tampilkan placeholder. (#C1) */
  imageUrl?: string | null;
  archived: boolean;
  createdAt: ISODate;
}

export type StockMoveType = "in" | "out" | "adjust" | "sale" | "return";

export interface StockMovement {
  _id: ID;
  bookId: ID;
  productId: ID;
  type: StockMoveType;
  qty: number;
  unitCost?: number;
  reason?: string;
  occurredAt: ISODate;
}

// ── Penjualan (POS) ──────────────────────────────────────────────────────────
export type PaymentMethod = "cash" | "transfer" | "other";
export type SaleStatus = "draft" | "pending" | "paid" | "void" | "failed";

export interface SaleItem {
  productId: ID;
  nameSnapshot: string;
  qty: number;
  unitPrice: number;
  unitCost: number;
  lineTotal: number;
}

export interface Sale {
  _id: ID;
  bookId: ID;
  code: string;
  cashierId: ID;
  customerName?: string | null;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  costTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: SaleStatus;
  accountId: ID | null;
  paymentRef?: string | null;
  paymentProofUrl?: string | null;
  paidAt?: ISODate | null;
  occurredAt: ISODate;
}

export type CreateSaleResult = Sale;

// ── Laporan ──────────────────────────────────────────────────────────────────
export interface SalesReport {
  period: { from: ISODate; to: ISODate };
  totalSales: number;
  totalOrders: number;
  totalDiscount: number;
  totalTax: number;
  byDay: Array<{ date: string; sales: number; orders: number }>;
  byPaymentMethod: { cash: number; transfer: number; other: number };
  topProducts: Array<{ productId: ID; name: string; qtySold: number; revenue: number }>;
}

export interface ProfitLoss {
  period: { from: ISODate; to: ISODate };
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  operatingExpenses: number;
  netProfit: number;
}

export interface InventoryReport {
  stockValue: number;
  trackedCount: number;
  lowStock: Array<{ productId: ID; name: string; stockQty: number }>;
}

// ── Transfer antar-pembukuan ─────────────────────────────────────────────────
export interface LinkableAccount {
  bookId: ID;
  bookName: string;
  accountId: ID;
  accountName: string;
  currentBalance: number;
}

export interface BookTransfer {
  _id: ID;
  fromBookId: ID;
  fromAccountId: ID;
  toBookId: ID;
  toAccountId: ID;
  amount: number;
  note?: string | null;
  occurredAt: ISODate;
}

// ── Pengaturan bisnis ────────────────────────────────────────────────────────
export interface BusinessSettings {
  bookId: ID;
  receiptHeader: string | null;
  receiptFooter: string | null;
  address: string | null;
  logoUrl: string | null;
  taxPercent: number;
  /** Storefront mandiri (#C2). */
  storefrontEnabled: boolean;
  storefrontAccountId: string | null;
}

// ── Audit ────────────────────────────────────────────────────────────────────
export interface BusinessAudit {
  _id: ID;
  bookId: ID;
  actorId: ID;
  action: string;
  targetType: string;
  targetId: ID;
  summary: string;
  meta?: Record<string, unknown> | null;
  createdAt: ISODate;
}
