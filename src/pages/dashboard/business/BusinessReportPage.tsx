import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { DebouncedSearch } from "@/components/common/DebouncedSearch";
import { formatCurrency, formatDate } from "@/utils/format";
import {
  fetchProducts,
  fetchProfitLoss,
  fetchSales,
  fetchSalesReport,
} from "@/services/business.service";
import type { ProfitLoss, Product, Sale, SalesReport } from "@/types";

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${tone ?? "text-neutral-900"}`}>{value}</div>
    </div>
  );
}

const BusinessReportPage = () => {
  const [sales, setSales] = useState<SalesReport | null>(null);
  const [pl, setPl] = useState<ProfitLoss | null>(null);
  const [orders, setOrders] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, o, pr] = await Promise.all([
        fetchSalesReport(),
        fetchProfitLoss(),
        fetchSales(),
        fetchProducts(),
      ]);
      setSales(s);
      setPl(p);
      setOrders(o);
      setProducts(pr);
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : "Gagal memuat laporan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Penjualan per tanggal (#G) — hanya yang lunas; search kode/nama.
  const dayGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const paid = orders.filter((o) => o.paymentStatus === "paid");
    const filtered = q
      ? paid.filter(
          (o) =>
            o.code.toLowerCase().includes(q) ||
            (o.customerName ?? "").toLowerCase().includes(q) ||
            o.items.some((it) => it.nameSnapshot.toLowerCase().includes(q)),
        )
      : paid;
    const map = new Map<string, Sale[]>();
    for (const o of filtered) {
      const key = o.occurredAt.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(o);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [orders, search]);

  if (loading) return <div className="p-6 text-sm text-neutral-500">Memuat laporan…</div>;

  return (
    <div className="space-y-6 p-4 pb-20 sm:p-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">Laporan & Laba/Rugi</h1>
        <p className="text-sm text-neutral-500">Periode bulan berjalan.</p>
      </header>

      {sales && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-700">Penjualan</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total Penjualan" value={formatCurrency(sales.totalSales)} />
            <Stat label="Jumlah Order" value={String(sales.totalOrders)} />
            <Stat label="Total Diskon" value={formatCurrency(sales.totalDiscount)} />
            <Stat label="Total Pajak" value={formatCurrency(sales.totalTax)} />
          </div>
          {sales.topProducts.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-neutral-700">Produk Terlaris</h3>
              <div className="space-y-1 text-sm">
                {sales.topProducts.map((p) => (
                  <div key={p.productId} className="flex justify-between text-neutral-600">
                    <span>{p.name} ({p.qtySold})</span>
                    <span>{formatCurrency(p.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Penjualan per tanggal + produk terjual (#G) */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">Penjualan per Tanggal</h2>
        <DebouncedSearch value={search} onChange={setSearch} placeholder="Cari kode / pelanggan / produk…" />
        {dayGroups.length === 0 ? (
          <p className="text-sm text-neutral-500">Belum ada penjualan lunas.</p>
        ) : (
          <div className="space-y-3">
            {dayGroups.map(([day, list], index) => {
              const open = openDays[day] ?? index === 0;
              const dayTotal = list.reduce((s, o) => s + o.total, 0);
              // Agregasi produk terjual hari itu.
              const prodMap = new Map<string, { name: string; qty: number; revenue: number }>();
              for (const o of list) {
                for (const it of o.items) {
                  const e = prodMap.get(it.productId) ?? { name: it.nameSnapshot, qty: 0, revenue: 0 };
                  e.qty += it.qty;
                  e.revenue += it.lineTotal;
                  prodMap.set(it.productId, e);
                }
              }
              const prods = Array.from(prodMap.values()).sort((a, b) => b.qty - a.qty);
              return (
                <div key={day} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenDays((p) => ({ ...p, [day]: !open }))}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-50"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight size={16} className={`text-neutral-400 transition-transform ${open ? "rotate-90" : ""}`} />
                      <div>
                        <div className="font-medium text-neutral-900">{formatDate(`${day}T00:00:00.000Z`, "long")}</div>
                        <div className="text-xs text-neutral-500">{list.length} order</div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-emerald-700">{formatCurrency(dayTotal)}</span>
                  </button>
                  {open && (
                    <div className="space-y-3 border-t border-neutral-100 p-4">
                      <div>
                        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">Produk terjual</div>
                        <div className="space-y-1 text-sm">
                          {prods.map((p) => (
                            <div key={p.name} className="flex justify-between text-neutral-600">
                              <span>{p.name} × {p.qty}</span>
                              <span>{formatCurrency(p.revenue)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">Order</div>
                        <div className="space-y-1 text-sm">
                          {list.map((o) => (
                            <div key={o._id} className="flex justify-between text-neutral-500">
                              <span>{o.code} · {o.customerName || "—"}</span>
                              <span>{formatCurrency(o.total)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {pl && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-700">Laba / Rugi</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Stat label="Pendapatan" value={formatCurrency(pl.revenue)} />
            <Stat label="HPP (COGS)" value={formatCurrency(pl.cogs)} tone="text-rose-600" />
            <Stat label="Laba Kotor" value={`${formatCurrency(pl.grossProfit)} (${pl.grossMarginPct}%)`} tone="text-emerald-600" />
            <Stat label="Biaya Operasional" value={formatCurrency(pl.operatingExpenses)} tone="text-rose-600" />
            <Stat
              label="Laba Bersih"
              value={formatCurrency(pl.netProfit)}
              tone={pl.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}
            />
          </div>
        </section>
      )}

      {/* Stok — edit hanya di halaman Produk & Stok (#G) */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">Stok Barang</h2>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {products.filter((p) => p.trackStock).length === 0 ? (
            <p className="p-4 text-sm text-neutral-500">Tidak ada produk berstok.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {products
                .filter((p) => p.trackStock)
                .map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => navigate(`/dashboard/products/${p._id}/stock`)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-neutral-50"
                  >
                    <div className="text-sm text-neutral-800">{p.name}</div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${p.stockQty <= 5 ? "font-semibold text-rose-600" : "text-neutral-600"}`}>
                        {p.stockQty} {p.unit}
                      </span>
                      <ChevronRight size={16} className="text-neutral-400" />
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BusinessReportPage;
