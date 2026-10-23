import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Boxes, History } from "lucide-react";
import { Button } from "@dep/ui/button";
import { FormField, Input } from "@dep/ui/form";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { createMovement, fetchMovements, fetchProduct } from "@/services/business.service";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Product, StockMovement } from "@/types";

const MOVE_LABEL: Record<string, string> = {
  in: "Masuk",
  out: "Keluar",
  adjust: "Set stok",
  sale: "Terjual",
  return: "Retur",
};
const MOVE_STYLE: Record<string, string> = {
  in: "text-emerald-700",
  return: "text-emerald-700",
  out: "text-rose-600",
  sale: "text-rose-600",
  adjust: "text-neutral-600",
};

/** Halaman atur stok produk (menggantikan modal). Route: products/:id/stock. */
const StockAdjustPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [moves, setMoves] = useState<StockMovement[] | null>(null);

  const [type, setType] = useState<"in" | "out" | "adjust">("in");
  const [qty, setQty] = useState("0");
  const [price, setPrice] = useState(0);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const showPrice = type !== "adjust";

  const loadAll = (pid: string) => {
    void fetchProduct(pid)
      .then(setProduct)
      .catch((e) => {
        notify.error(e instanceof ApiError ? e.message : "Gagal memuat produk.");
        navigate("/dashboard/products", { replace: true });
      });
    void fetchMovements(pid)
      .then(setMoves)
      .catch(() => setMoves([]));
  };

  useEffect(() => {
    if (id) loadAll(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const submit = async () => {
    if (!product) return;
    const n = Number(qty);
    if (!Number.isFinite(n) || n < 0) return notify.error("Jumlah tidak valid.");
    setSaving(true);
    try {
      const res = await createMovement({
        productId: product._id,
        type,
        qty: n,
        unitCost: showPrice && price > 0 ? price : undefined,
        reason: reason.trim() || undefined,
      });
      notify.success(`Stok ${product.name} kini ${res.stockQty} ${product.unit}.`);
      setQty("0");
      setPrice(0);
      setReason("");
      loadAll(product._id);
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : "Gagal.");
    } finally {
      setSaving(false);
    }
  };

  if (!product) return <p className="p-6 text-sm text-neutral-500">Memuat…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 pb-24 sm:p-6">
      <button
        type="button"
        onClick={() => navigate("/dashboard/products")}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft size={16} /> Kembali ke Produk & Stok
      </button>
      <header className="flex items-center gap-2">
        <Boxes size={22} className="text-emerald-700" />
        <h1 className="text-2xl font-semibold text-neutral-900">Stok — {product.name}</h1>
      </header>

      <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5">
        <p className="text-sm text-neutral-500">
          Stok saat ini:{" "}
          <strong>
            {product.stockQty} {product.unit}
          </strong>
        </p>
        <FormField label="Jenis">
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { v: "in", label: "Masuk" },
                { v: "out", label: "Keluar" },
                { v: "adjust", label: "Set" },
              ] as const
            ).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setType(o.v)}
                className={`rounded-lg border px-2 py-1.5 text-sm ${
                  type === o.v ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-neutral-200"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </FormField>
        <FormField label={type === "adjust" ? "Stok target" : "Jumlah"}>
          <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus />
        </FormField>
        {showPrice && (
          <FormField label={type === "in" ? "Harga beli / unit (memperbarui modal)" : "Harga / unit (opsional)"}>
            <CurrencyInput value={price} onChange={setPrice} />
            {type === "in" && (
              <p className="mt-1 text-[11px] text-neutral-500">
                HPP (modal) diperbarui sebagai rata-rata tertimbang stok lama + masuk.
              </p>
            )}
          </FormField>
        )}
        <FormField label="Catatan (opsional)">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </FormField>
        <div className="flex justify-end pt-1">
          <Button type="button" isLoading={saving} onClick={() => void submit()}>
            Simpan
          </Button>
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <History size={16} /> Riwayat Stok
        </div>
        {!moves ? (
          <p className="py-4 text-center text-sm text-neutral-500">Memuat…</p>
        ) : moves.length === 0 ? (
          <p className="py-4 text-center text-sm text-neutral-500">Belum ada pergerakan stok.</p>
        ) : (
          <div className="max-h-96 divide-y divide-neutral-100 overflow-y-auto">
            {moves.map((m) => (
              <div key={m._id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className={`text-sm font-medium ${MOVE_STYLE[m.type] ?? "text-neutral-700"}`}>
                    {MOVE_LABEL[m.type] ?? m.type}
                    {m.type === "adjust" ? ` → ${m.qty}` : ` ${m.qty} ${product.unit}`}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {formatDate(m.occurredAt, "long")}
                    {m.reason ? ` · ${m.reason}` : ""}
                  </div>
                </div>
                {m.unitCost != null && m.unitCost > 0 && (
                  <div className="text-right text-xs text-neutral-500">@ {formatCurrency(m.unitCost)}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAdjustPage;
