/**
 * Klien storefront publik (#C2). TIDAK memakai `api()` (yang inject auth +
 * bookId) karena halaman ini diakses pelanggan tanpa login. Pakai `fetch`
 * langsung ke base URL backend.
 */
const BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

export interface StorefrontProduct {
  _id: string;
  name: string;
  sellPrice: number;
  unit: string;
  imageUrl: string | null;
  available: boolean;
}

export interface StorefrontInfo {
  business: {
    name: string;
    header: string | null;
    address: string | null;
    logoUrl: string | null;
  };
  products: StorefrontProduct[];
}

export interface StorefrontCheckoutResult {
  _id: string;
  code: string;
  total: number;
  paymentMethod: "cash";
  paymentStatus: string;
}

export interface StorefrontSaleStatus {
  code: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => null)) as
    | (T & { message?: string })
    | null;
  if (!res.ok) {
    throw new Error((data as { message?: string } | null)?.message ?? "Gagal memuat toko.");
  }
  return data as T;
}

export const fetchStorefront = (bookId: string) =>
  req<StorefrontInfo>(`/store/${bookId}`);

export const checkoutStorefront = (
  bookId: string,
  body: {
    items: Array<{ productId: string; qty: number }>;
    customerName?: string;
    paymentMethod: "cash";
  },
) =>
  req<StorefrontCheckoutResult>(`/store/${bookId}/checkout`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const fetchStorefrontSaleStatus = (bookId: string, saleId: string) =>
  req<StorefrontSaleStatus>(`/store/${bookId}/sale/${saleId}`);
