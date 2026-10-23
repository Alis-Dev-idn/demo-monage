import { formatCurrency } from "@/utils/format";
import type { Sale } from "@/types";

export interface ReceiptMeta {
  header: string | null;
  footer: string | null;
  address: string | null;
  logoUrl: string | null;
}

const PAYMENT_LABEL: Record<string, string> = {
  cash: "Tunai",
  transfer: "Transfer",
  other: "Lainnya",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Tampilan struk (#C4) — header/logo/alamat dari Pengaturan Bisnis, daftar item,
 * total, dan footer. Dipakai di hasil penjualan Kasir & daftar Penjualan.
 */
export function ReceiptView({ sale, meta }: { sale: Sale; meta: ReceiptMeta }) {
  return (
    <div className="mx-auto max-w-xs rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-800">
      <div className="text-center">
        {meta.logoUrl && (
          <img
            src={meta.logoUrl}
            alt="Logo"
            className="mx-auto mb-2 h-14 w-14 rounded-lg object-contain"
          />
        )}
        {meta.header && (
          <p className="whitespace-pre-line text-base font-bold leading-tight text-neutral-900">
            {meta.header}
          </p>
        )}
        {meta.address && (
          <p className="mt-0.5 whitespace-pre-line text-[11px] text-neutral-500">
            {meta.address}
          </p>
        )}
      </div>

      <div className="my-2 border-t border-dashed border-neutral-300" />

      <div className="space-y-0.5 text-[11px] text-neutral-500">
        <div className="flex justify-between">
          <span>No.</span>
          <span className="font-medium text-neutral-700">{sale.code}</span>
        </div>
        <div className="flex justify-between">
          <span>Tanggal</span>
          <span>{fmtDate(sale.occurredAt)}</span>
        </div>
        {sale.customerName && (
          <div className="flex justify-between">
            <span>Pelanggan</span>
            <span>{sale.customerName}</span>
          </div>
        )}
      </div>

      <div className="my-2 border-t border-dashed border-neutral-300" />

      <div className="space-y-1">
        {sale.items.map((it) => (
          <div key={it.productId}>
            <div className="text-neutral-800">{it.nameSnapshot}</div>
            <div className="flex justify-between text-[12px] text-neutral-500">
              <span>
                {it.qty} × {formatCurrency(it.unitPrice)}
              </span>
              <span className="text-neutral-800">{formatCurrency(it.lineTotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="my-2 border-t border-dashed border-neutral-300" />

      <div className="space-y-0.5 text-[12px]">
        <Row label="Subtotal" value={sale.subtotal} />
        {sale.discount > 0 && <Row label="Diskon" value={-sale.discount} />}
        {sale.tax > 0 && <Row label="Pajak" value={sale.tax} />}
        <div className="flex justify-between pt-0.5 text-base font-bold text-neutral-900">
          <span>Total</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
        <div className="flex justify-between text-[11px] text-neutral-500">
          <span>Metode</span>
          <span>{PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod}</span>
        </div>
      </div>

      {meta.footer && (
        <>
          <div className="my-2 border-t border-dashed border-neutral-300" />
          <p className="whitespace-pre-line text-center text-[11px] text-neutral-500">
            {meta.footer}
          </p>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-neutral-600">
      <span>{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}

