import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Minus, Package, Plus, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import {
  checkoutStorefront,
  fetchStorefront,
  fetchStorefrontSaleStatus,
  type StorefrontCheckoutResult,
  type StorefrontInfo,
  type StorefrontProduct,
} from "@/services/storefront.service";

interface Line {
  product: StorefrontProduct;
  qty: number;
}

/**
 * Halaman beli-mandiri publik (#C2) — diakses pelanggan via link/QR tanpa login.
 * Stok tidak ditampilkan angkanya (hanya "Habis"). QRIS = bayar mandiri (scan),
 * tunai = order tercatat lalu bayar di kasir.
 */
export default function StorefrontPage() {
  const { bookId = "" } = useParams<{ bookId: string }>();
  const [info, setInfo] = useState<StorefrontInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Line[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<StorefrontCheckoutResult | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchStorefront(bookId)
      .then((d) => alive && setInfo(d))
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [bookId]);

  const add = (p: StorefrontProduct) =>
    setCart((prev) => {
      const f = prev.find((l) => l.product._id === p._id);
      if (f) return prev.map((l) => (l.product._id === p._id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { product: p, qty: 1 }];
    });
  const setQty = (id: string, d: number) =>
    setCart((prev) =>
      prev
        .map((l) => (l.product._id === id ? { ...l, qty: Math.max(0, l.qty + d) } : l))
        .filter((l) => l.qty > 0),
    );

  const total = cart.reduce((s, l) => s + l.product.sellPrice * l.qty, 0);

  const checkout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await checkoutStorefront(bookId, {
        items: cart.map((l) => ({ productId: l.product._id, qty: l.qty })),
        customerName: customerName.trim() || undefined,
        paymentMethod: "cash",
      });
      setOrder(res);
      setCart([]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Centered>Memuat toko…</Centered>;
  }
  if (error && !info) {
    return <Centered>{error}</Centered>;
  }
  if (!info) return null;

  if (order) {
    return (
      <OrderResult
        bookId={bookId}
        order={order}
        onDone={() => setOrder(null)}
      />
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-neutral-50 pb-44">
      <header className="bg-white px-4 py-5 text-center shadow-sm">
        {info.business.logoUrl && (
          <img
            src={info.business.logoUrl}
            alt={info.business.name}
            className="mx-auto mb-2 h-16 w-16 rounded-xl object-contain"
          />
        )}
        <h1 className="text-xl font-bold text-neutral-900">
          {info.business.header || info.business.name}
        </h1>
        {info.business.address && (
          <p className="mt-0.5 text-xs text-neutral-500">{info.business.address}</p>
        )}
      </header>

      <div className="grid grid-cols-2 gap-2.5 p-4">
        {info.products.map((p) => (
          <button
            key={p._id}
            type="button"
            onClick={() => add(p)}
            disabled={!p.available}
            className={`flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white text-left transition ${
              p.available ? "hover:border-emerald-300 hover:shadow-sm" : "cursor-not-allowed opacity-60"
            }`}
          >
            <div className="relative aspect-square w-full bg-neutral-100">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-neutral-300">
                  <Package size={28} />
                </span>
              )}
              {!p.available && (
                <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-rose-600">
                  Habis
                </span>
              )}
            </div>
            <div className="p-2.5">
              <div className="line-clamp-2 text-sm font-medium leading-tight text-neutral-900">{p.name}</div>
              <div className="mt-1 text-sm font-semibold text-emerald-700">
                {formatCurrency(p.sellPrice)}
              </div>
            </div>
          </button>
        ))}
        {info.products.length === 0 && (
          <p className="col-span-full text-center text-sm text-neutral-500">Belum ada produk.</p>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-lg space-y-2 border-t border-neutral-200 bg-white p-4">
          <div className="max-h-32 space-y-1 overflow-y-auto">
            {cart.map((l) => (
              <div key={l.product._id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">{l.product.name}</span>
                <button type="button" onClick={() => setQty(l.product._id, -1)} className="rounded border border-neutral-200 p-1">
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center">{l.qty}</span>
                <button type="button" onClick={() => setQty(l.product._id, 1)} className="rounded border border-neutral-200 p-1">
                  <Plus size={12} />
                </button>
                <span className="w-16 text-right">{formatCurrency(l.product.sellPrice * l.qty)}</span>
              </div>
            ))}
          </div>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nama (opsional)"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
          <div className="flex items-center justify-between text-base font-bold text-neutral-900">
            <span className="flex items-center gap-1">
              <ShoppingCart size={16} /> Total
            </span>
            <span>{formatCurrency(total)}</span>
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button
            type="button"
            disabled={submitting || cart.length === 0}
            onClick={() => void checkout()}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Pesan — Bayar di Kasir
          </button>
        </div>
      )}
    </div>
  );
}

function OrderResult({
  bookId,
  order,
  onDone,
}: {
  bookId: string;
  order: StorefrontCheckoutResult;
  onDone: () => void;
}) {
  const [status, setStatus] = useState(order.paymentStatus);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const paid = status === "paid";

  const poll = useCallback(async () => {
    try {
      const s = await fetchStorefrontSaleStatus(bookId, order._id);
      setStatus(s.paymentStatus);
      if ((s.paymentStatus === "paid" || s.paymentStatus === "failed") && pollRef.current) {
        clearInterval(pollRef.current);
      }
    } catch {
      /* keep polling */
    }
  }, [bookId, order._id]);

  useEffect(() => {
    if (paid) return;
    pollRef.current = setInterval(() => void poll(), 2500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [paid, poll]);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 bg-neutral-50 p-6 text-center">
      <div className="text-sm text-neutral-500">{order.code}</div>
      <div className="text-3xl font-bold text-neutral-900">{formatCurrency(order.total)}</div>

      {paid ? (
        <div className="rounded-xl bg-emerald-50 p-5 text-emerald-700">
          <p className="text-lg font-semibold">Pembayaran berhasil ✓</p>
          <p className="text-sm">Terima kasih! Pesanan Anda sedang diproses.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-amber-50 p-5 text-amber-800">
          <p className="font-semibold">Tunjukkan kode ini ke kasir</p>
          <p className="mt-1 text-2xl font-bold">{order.code}</p>
          <p className="mt-1 text-sm">Bayar di kasir untuk menyelesaikan pesanan.</p>
        </div>
      )}

      <button
        type="button"
        onClick={onDone}
        className="mt-2 rounded-xl border border-neutral-300 px-6 py-2.5 text-sm font-medium text-neutral-700"
      >
        Pesan Lagi
      </button>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-neutral-500">
      {children}
    </div>
  );
}
