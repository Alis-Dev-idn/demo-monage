import { formatCurrency } from "@/utils/format";
import type { Sale } from "@/types";
import type { ReceiptMeta } from "./Receipt";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Cetak / unduh struk (#C4) — buka jendela baru berisi struk standalone lalu
 * panggil print. User bisa "Save as PDF" dari dialog cetak = unduh.
 *
 * Dipisah dari `Receipt.tsx` (bukan komponen React) supaya file itu tetap
 * hanya meng-export komponen — react-refresh butuh itu untuk fast refresh.
 */
export function printReceipt(sale: Sale, meta: ReceiptMeta): void {
  const esc = (s: string) =>
    s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
  const rows = sale.items
    .map(
      (it) => `<div class="it"><div>${esc(it.nameSnapshot)}</div>
      <div class="ln"><span>${it.qty} × ${formatCurrency(it.unitPrice)}</span><span>${formatCurrency(it.lineTotal)}</span></div></div>`
    )
    .join("");
  const line = (l: string, v: number) =>
    `<div class="ln"><span>${l}</span><span>${formatCurrency(v)}</span></div>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Struk ${esc(
    sale.code
  )}</title><style>
    *{font-family:ui-monospace,Menlo,Consolas,monospace;box-sizing:border-box}
    body{margin:0;padding:12px;color:#1f2937}
    .r{max-width:300px;margin:0 auto;font-size:12px}
    .c{text-align:center}.b{font-weight:700}.muted{color:#6b7280;font-size:11px}
    .sep{border-top:1px dashed #9ca3af;margin:8px 0}
    .ln{display:flex;justify-content:space-between}
    .it{margin-bottom:4px}.tot{font-size:15px;font-weight:700}
    img{width:56px;height:56px;object-fit:contain;margin:0 auto 6px;display:block}
  </style></head><body><div class="r">
    <div class="c">
      ${meta.logoUrl ? `<img src="${esc(meta.logoUrl)}"/>` : ""}
      ${meta.header ? `<div class="b" style="font-size:14px">${esc(meta.header)}</div>` : ""}
      ${meta.address ? `<div class="muted">${esc(meta.address)}</div>` : ""}
    </div>
    <div class="sep"></div>
    <div class="ln muted"><span>No.</span><span>${esc(sale.code)}</span></div>
    <div class="ln muted"><span>Tanggal</span><span>${fmtDate(sale.occurredAt)}</span></div>
    ${sale.customerName ? `<div class="ln muted"><span>Pelanggan</span><span>${esc(sale.customerName)}</span></div>` : ""}
    <div class="sep"></div>
    ${rows}
    <div class="sep"></div>
    ${line("Subtotal", sale.subtotal)}
    ${sale.discount > 0 ? line("Diskon", -sale.discount) : ""}
    ${sale.tax > 0 ? line("Pajak", sale.tax) : ""}
    <div class="ln tot"><span>Total</span><span>${formatCurrency(sale.total)}</span></div>
    ${meta.footer ? `<div class="sep"></div><div class="c muted">${esc(meta.footer)}</div>` : ""}
  </div><script>window.onload=function(){window.print()}</script></body></html>`;

  const w = window.open("", "_blank", "width=380,height=640");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
