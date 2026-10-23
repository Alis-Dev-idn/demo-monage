import { api } from "@/utils/api";
import type {
  BookTransfer,
  BusinessAudit,
  BusinessSettings,
  CreateSaleResult,
  ID,
  InventoryReport,
  LinkableAccount,
  Product,
  ProfitLoss,
  Sale,
  SalesReport,
  StockMovement,
} from "@/types";

// ── Produk ───────────────────────────────────────────────────────────────────
export interface ProductPayload {
  name: string;
  sku?: string;
  barcode?: string;
  unit?: string;
  sellPrice?: number;
  costPrice?: number;
  stockQty?: number;
  trackStock?: boolean;
  categoryName?: string;
  imageUrl?: string | null;
}

export const fetchProducts = (params?: {
  search?: string;
  archived?: boolean;
  limit?: number;
  offset?: number;
}) => api().get<Product[]>("/products", { params });
export const fetchProduct = (id: ID) => api().get<Product>(`/products/${id}`);
export const createProduct = (p: ProductPayload) => api().post<Product>("/products", p);
export const updateProduct = (id: ID, p: Partial<ProductPayload> & { archived?: boolean }) =>
  api().patch<Product>(`/products/${id}`, p);
export const archiveProduct = (id: ID) => api().delete<{ ok: true }>(`/products/${id}`);

/** Unggah gambar produk (multipart) → backend simpan di storage. (#C1) */
export const uploadProductImage = (id: ID, file: File) => {
  const form = new FormData();
  form.append("file", file, "product.jpg");
  return api().upload<Product>(`/products/${id}/image`, form);
};
export const deleteProductImage = (id: ID) =>
  api().delete<Product>(`/products/${id}/image`);

// ── Inventori ────────────────────────────────────────────────────────────────
export interface MovementPayload {
  productId: ID;
  type: "in" | "out" | "adjust" | "return";
  qty: number;
  unitCost?: number;
  reason?: string;
}
export const createMovement = (p: MovementPayload) =>
  api().post<{ movement: StockMovement; stockQty: number }>("/inventory/movements", p);
export const fetchMovements = (productId?: ID) =>
  api().get<StockMovement[]>("/inventory/movements", { params: { productId } });
export const fetchLowStock = (threshold = 5) =>
  api().get<Product[]>("/inventory/low-stock", { params: { threshold } });

// ── POS / Penjualan ──────────────────────────────────────────────────────────
export interface CreateSalePayload {
  items: Array<{ productId: ID; qty: number; unitPrice?: number }>;
  customerName?: string;
  discount?: number;
  paymentMethod?: "cash" | "transfer" | "other";
  /** Nomor referensi pembayaran manual (metode transfer/lainnya). */
  paymentRef?: string | null;
  accountId?: ID;
}
export const createSale = (p: CreateSalePayload) =>
  api().post<CreateSaleResult>("/pos/sales", p);

/** Unggah foto bukti pembayaran sebuah penjualan (metode "Lainnya"). */
export const uploadPaymentProof = (id: ID, file: File) => {
  const form = new FormData();
  form.append("file", file, "proof.jpg");
  return api().upload<Sale>(`/pos/sales/${id}/payment-proof`, form);
};
export const fetchSales = (params?: {
  from?: string;
  to?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) => api().get<Sale[]>("/pos/sales", { params });
export const fetchSale = (id: ID) => api().get<Sale>(`/pos/sales/${id}`);
export const voidSale = (id: ID) => api().post<Sale>(`/pos/sales/${id}/void`);
export const fetchReceipt = (id: ID) =>
  api().get<{ sale: Sale; receipt: { header: string | null; footer: string | null; address: string | null; logoUrl: string | null } }>(
    `/pos/receipt/${id}`,
  );

// ── Laporan ──────────────────────────────────────────────────────────────────
export const fetchSalesReport = (params?: { from?: string; to?: string }) =>
  api().get<SalesReport>("/business-report/sales", { params });
export const fetchProfitLoss = (params?: { from?: string; to?: string }) =>
  api().get<ProfitLoss>("/business-report/profit-loss", { params });
export const fetchInventoryReport = () =>
  api().get<InventoryReport>("/business-report/inventory");

// ── Transfer antar-pembukuan ─────────────────────────────────────────────────
export const fetchLinkableAccounts = (excludeBookId?: ID) =>
  api().get<LinkableAccount[]>("/book-transfers/linkable-accounts", {
    params: { excludeBookId },
  });
export interface TransferPayload {
  fromAccountId: ID;
  toBookId: ID;
  toAccountId: ID;
  amount: number;
  note?: string;
}
export const createTransfer = (p: TransferPayload) =>
  api().post<BookTransfer>("/book-transfers", p);
export const fetchTransfers = (params?: { limit?: number; offset?: number }) =>
  api().get<BookTransfer[]>("/book-transfers", { params });
export const reverseTransfer = (id: ID) =>
  api().post<BookTransfer>(`/book-transfers/${id}/reverse`);

// ── Pengaturan bisnis ────────────────────────────────────────────────────────
export const fetchBusinessSettings = () =>
  api().get<BusinessSettings>("/business-settings");
export interface BusinessSettingsPayload {
  receiptHeader?: string | null;
  receiptFooter?: string | null;
  address?: string | null;
  taxPercent?: number;
  storefrontEnabled?: boolean;
  storefrontAccountId?: string | null;
}
export const updateBusinessSettings = (p: BusinessSettingsPayload) =>
  api().patch<BusinessSettings>("/business-settings", p);

/** Unggah logo bisnis (multipart) → dipakai di struk. (#I) */
export const uploadBusinessLogo = (file: File) => {
  const form = new FormData();
  form.append("file", file, "logo.jpg");
  return api().upload<BusinessSettings>("/business-settings/logo", form);
};
export const deleteBusinessLogo = () =>
  api().delete<BusinessSettings>("/business-settings/logo");

// ── Kasir (akun POS dibuat admin) ────────────────────────────────────────────
export interface Cashier {
  userId: ID;
  name: string;
  username: string | null;
  createdAt: string | null;
}
export const fetchCashiers = () => api().get<Cashier[]>("/business/cashiers");
export const createCashier = (p: { name: string; username: string; pin: string }) =>
  api().post<Cashier>("/business/cashiers", p);
export const resetCashierPin = (userId: ID, pin: string) =>
  api().patch<{ ok: true }>(`/business/cashiers/${userId}/pin`, { pin });
export const deleteCashier = (userId: ID) =>
  api().delete<{ ok: true }>(`/business/cashiers/${userId}`);

// ── Audit ────────────────────────────────────────────────────────────────────
export const fetchBusinessAudit = (params?: {
  action?: string;
  limit?: number;
  offset?: number;
}) => api().get<BusinessAudit[]>("/business-audit", { params });
