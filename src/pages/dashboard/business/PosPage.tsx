import { useCallback, useEffect, useMemo, useState } from "react";
import { Minus, Package, Printer, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { Button } from "@dep/ui/button";
import { Modal } from "@dep/ui/modal";
import { FormField, Input } from "@dep/ui/form";
import { Select, type SelectOption } from "@dep/ui/select";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { formatCurrency } from "@/utils/format";
import { fetchAccounts } from "@/services/account.service";
import {
  createSale,
  fetchProducts,
  fetchReceipt,
  uploadPaymentProof,
} from "@/services/business.service";
import { ReceiptView, type ReceiptMeta } from "@/components/business/Receipt";
import { printReceipt } from "@/components/business/printReceipt";
import type { Account, CreateSaleResult, PaymentMethod, Product, Sale } from "@/types";

interface CartLine {
  product: Product;
  qty: number;
}

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Tunai",
  transfer: "Transfer",
  other: "Lainnya",
};

const PosPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState("0");
  const [customerName, setCustomerName] = useState("");
  const [accountId, setAccountId] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [paymentRef, setPaymentRef] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState<CreateSaleResult | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([fetchProducts({ archived: false }), fetchAccounts()]);
      setProducts(p);
      setAccounts(a);
      if (a[0]) setAccountId((prev) => prev || a[0]._id);
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : "Gagal memuat data.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? products.filter((p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)) : products;
  }, [products, search]);

  // Qty per produk yang sudah masuk keranjang → untuk menampilkan sisa stok.
  const cartQty = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of cart) m.set(l.product._id, l.qty);
    return m;
  }, [cart]);

  const remainingOf = useCallback(
    (p: Product) => (p.trackStock ? p.stockQty - (cartQty.get(p._id) ?? 0) : Number.POSITIVE_INFINITY),
    [cartQty],
  );

  const addToCart = (product: Product) => {
    if (product.trackStock && remainingOf(product) <= 0) {
      return notify.warning("Stok produk ini sudah habis.");
    }
    setCart((prev) => {
      const found = prev.find((l) => l.product._id === product._id);
      if (found) return prev.map((l) => (l.product._id === product._id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { product, qty: 1 }];
    });
  };
  const setQty = (id: string, delta: number) =>
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.product._id !== id) return l;
          const next = l.qty + delta;
          if (delta > 0 && l.product.trackStock && next > l.product.stockQty) {
            notify.warning("Melebihi stok tersedia.");
            return l;
          }
          return { ...l, qty: Math.max(0, next) };
        })
        .filter((l) => l.qty > 0),
    );
  const removeLine = (id: string) => setCart((prev) => prev.filter((l) => l.product._id !== id));

  const subtotal = cart.reduce((s, l) => s + l.product.sellPrice * l.qty, 0);
  const discountNum = Math.min(Number(discount) || 0, subtotal);
  const total = subtotal - discountNum;

  const resetForm = () => {
    setCart([]);
    setDiscount("0");
    setCustomerName("");
    setMethod("cash");
    setPaymentRef("");
    setProofFile(null);
  };

  const submit = async () => {
    if (cart.length === 0) return notify.warning("Keranjang kosong.");
    if (!accountId) return notify.warning("Pilih dompet tujuan.");
    setSubmitting(true);
    try {
      let result = await createSale({
        items: cart.map((l) => ({ productId: l.product._id, qty: l.qty })),
        customerName: customerName.trim() || undefined,
        discount: discountNum,
        paymentMethod: method,
        paymentRef: method === "cash" ? undefined : paymentRef.trim() || undefined,
        accountId,
      });
      // Unggah bukti pembayaran bila ada (metode non-tunai).
      if (method !== "cash" && proofFile) {
        try {
          result = await uploadPaymentProof(result._id, proofFile);
        } catch {
          notify.warning("Penjualan tersimpan, tapi bukti gagal diunggah.");
        }
      }
      setCompleted(result);
      resetForm();
      void load(); // segarkan stok produk
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : "Gagal membuat order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 p-4 pb-20 sm:p-6 lg:grid-cols-[1fr_380px]">
      {/* Produk */}
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-neutral-900">Kasir (POS)</h1>
        <Input placeholder="Cari produk / SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((p) => {
            const remaining = remainingOf(p);
            const soldOut = p.trackStock && remaining <= 0;
            return (
              <button
                key={p._id}
                type="button"
                onClick={() => addToCart(p)}
                disabled={soldOut}
                className={`group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white text-left transition ${
                  soldOut ? "cursor-not-allowed opacity-60" : "hover:border-emerald-300 hover:shadow-md"
                }`}
              >
                <div className="relative aspect-square w-full bg-neutral-50">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-neutral-300">
                      <Package size={28} />
                    </span>
                  )}
                  {soldOut && (
                    <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-rose-600">
                      Habis
                    </span>
                  )}
                  {p.trackStock && !soldOut && (
                    <span
                      className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        remaining <= 5 ? "bg-rose-100 text-rose-700" : "bg-neutral-900/70 text-white"
                      }`}
                    >
                      sisa {remaining}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-2.5">
                  <div className="line-clamp-2 text-sm font-medium leading-tight text-neutral-900">{p.name}</div>
                  <div className="mt-1 text-sm font-semibold text-emerald-700">{formatCurrency(p.sellPrice)}</div>
                </div>
              </button>
            );
          })}
          {visibleProducts.length === 0 && <p className="col-span-full text-sm text-neutral-500">Tidak ada produk.</p>}
        </div>
      </div>

      {/* Keranjang */}
      <div className="space-y-3 self-start rounded-2xl border border-neutral-200 bg-white p-4 lg:sticky lg:top-4">
        <div className="flex items-center gap-2 text-neutral-900">
          <ShoppingCart size={18} />
          <h2 className="font-semibold">Keranjang</h2>
          {cart.length > 0 && (
            <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {cart.reduce((s, l) => s + l.qty, 0)} item
            </span>
          )}
        </div>
        {cart.length === 0 ? (
          <p className="text-sm text-neutral-400">Pilih produk untuk mulai.</p>
        ) : (
          <div className="max-h-[38vh] space-y-2 overflow-y-auto pr-1">
            {cart.map((l) => (
              <div key={l.product._id} className="flex items-center gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-neutral-900">{l.product.name}</div>
                  <div className="text-xs text-neutral-500">{formatCurrency(l.product.sellPrice)}</div>
                </div>
                <button type="button" onClick={() => setQty(l.product._id, -1)} className="rounded border border-neutral-200 p-1">
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center">{l.qty}</span>
                <button type="button" onClick={() => setQty(l.product._id, 1)} className="rounded border border-neutral-200 p-1">
                  <Plus size={12} />
                </button>
                <button type="button" onClick={() => removeLine(l.product._id)} className="p-1 text-rose-500">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <FormField label="Nama pembeli (opsional)">
          <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </FormField>
        <FormField label="Diskon (Rp)">
          <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
        </FormField>
        <FormField label="Dompet tujuan">
          <Select<string>
            value={(() => {
              const a = accounts.find((x) => x._id === accountId);
              return a ? { value: a._id, label: a.name } : null;
            })()}
            options={accounts.map<SelectOption<string>>((a) => ({ value: a._id, label: a.name }))}
            onChange={(opt) => opt && setAccountId(opt.value)}
            isClearable={false}
          />
        </FormField>

        <FormField label="Metode pembayaran">
          <div className="grid grid-cols-3 gap-1.5">
            {(["cash", "transfer", "other"] as PaymentMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`rounded-lg border px-2 py-1.5 text-sm font-medium transition ${
                  method === m
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                }`}
              >
                {METHOD_LABEL[m]}
              </button>
            ))}
          </div>
        </FormField>

        {method !== "cash" && (
          <div className="space-y-2 rounded-xl bg-neutral-50 p-3">
            <p className="text-xs text-neutral-500">
              Pembayaran via aplikasi lain. Catat nomor referensi &amp; unggah bukti (opsional).
            </p>
            <FormField label="Nomor referensi">
              <Input
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="mis. ref/no. transaksi e-wallet"
              />
            </FormField>
            <FormField label="Foto bukti (opsional)">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-neutral-600 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700"
              />
            </FormField>
            {proofFile && <p className="text-xs text-emerald-600">✓ {proofFile.name}</p>}
          </div>
        )}

        <div className="space-y-1 border-t border-neutral-100 pt-2 text-sm">
          <div className="flex justify-between text-neutral-500">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Diskon</span>
            <span>-{formatCurrency(discountNum)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-neutral-900">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <Button variant="primary" isLoading={submitting} onClick={() => void submit()} disabled={cart.length === 0}>
          Proses Pembayaran ({METHOD_LABEL[method]})
        </Button>
      </div>

      {completed && <SaleResultModal result={completed} onClose={() => setCompleted(null)} />}
    </div>
  );
};

/** Setelah order tersimpan (lunas) → tampilkan struk siap-cetak. */
function SaleResultModal({ result, onClose }: { result: CreateSaleResult; onClose: () => void }) {
  const [sale, setSale] = useState<Sale>(result);
  const [meta, setMeta] = useState<ReceiptMeta | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchReceipt(result._id)
      .then((r) => {
        if (!alive) return;
        setSale(r.sale);
        setMeta(r.receipt);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [result._id]);

  return (
    <Modal isOpen onClose={onClose} size="sm">
      <div className="relative p-5">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-neutral-400">
          <X size={18} />
        </button>
        <p className="mb-3 text-center font-semibold text-emerald-700">Pembayaran berhasil ✓</p>
        {meta ? (
          <ReceiptView sale={sale} meta={meta} />
        ) : (
          <p className="text-center text-sm text-neutral-500">Memuat struk…</p>
        )}
        <div className="mt-5 flex gap-2">
          {meta && (
            <Button variant="outline" leftIcon={<Printer size={14} />} onClick={() => printReceipt(sale, meta)}>
              Cetak / Unduh
            </Button>
          )}
          <Button className="flex-1" variant="primary" onClick={onClose}>
            Selesai
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default PosPage;
