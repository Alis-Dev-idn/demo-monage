import { useNavigate } from "react-router-dom";
import { AlertTriangle, Zap } from "lucide-react";
import { Button } from "@dep/ui/button";
import {
  useAccountQuota,
  useBookQuota,
  useMemberQuota,
  useSavingQuota,
  useTransactionQuota,
} from "@/hooks/useSubscription";
import { useBooks } from "@/hooks/useBooks";
import type { ID } from "@/types";

type QuotaKind = "books" | "transactions" | "accounts" | "savings" | "members";

interface QuotaBannerProps {
  /**
   * Jenis kuota yang ditampilkan:
   * - `books` (global) — pembukuan owned
   * - `transactions` (per book per month) — transaksi
   * - `accounts` (per book) — dompet aktif
   * - `savings` (per book) — tabungan aktif
   * - `members` (per book) — anggota + invitation pending
   */
  kind: QuotaKind;
  /** Wajib saat kind != "books". Default: pembukuan aktif. */
  bookId?: ID;
}

const COPY: Record<
  QuotaKind,
  {
    label: string;
    unit: string;
    overTitle: string;
    nearTitle: string;
    descOver: string;
  }
> = {
  books: {
    label: "pembukuan",
    unit: "pembukuan",
    overTitle: "Kuota pembukuan habis",
    nearTitle: "Kuota pembukuan tinggal sedikit",
    descOver: "Upgrade untuk menambah pembukuan.",
  },
  transactions: {
    label: "transaksi bulan ini",
    unit: "transaksi",
    overTitle: "Kuota transaksi bulan ini habis",
    nearTitle: "Kuota transaksi bulan ini",
    descOver: "Transaksi baru akan ditolak — upgrade untuk menambah quota.",
  },
  accounts: {
    label: "dompet aktif",
    unit: "dompet",
    overTitle: "Kuota dompet habis",
    nearTitle: "Kuota dompet tinggal sedikit",
    descOver: "Arsipkan dompet lama atau upgrade untuk menambah dompet baru.",
  },
  savings: {
    label: "tabungan aktif",
    unit: "tabungan",
    overTitle: "Kuota tabungan habis",
    nearTitle: "Kuota tabungan tinggal sedikit",
    descOver: "Arsipkan tabungan lama atau upgrade untuk menambah yang baru.",
  },
  members: {
    label: "anggota pembukuan",
    unit: "anggota",
    overTitle: "Kuota anggota habis",
    nearTitle: "Kuota anggota tinggal sedikit",
    descOver: "Upgrade paket untuk mengundang lebih banyak orang.",
  },
};

/**
 * Banner peringatan kuota plan. Tampil hanya saat ≥80% terpakai.
 * Tone disesuaikan: warning (80-99%) vs danger (100%+).
 */
export function QuotaBanner({ kind, bookId }: QuotaBannerProps) {
  const navigate = useNavigate();
  const { activeBook } = useBooks();
  const targetBookId = bookId ?? activeBook?._id ?? null;
  const bookQ = useBookQuota();
  const txQ = useTransactionQuota(kind === "transactions" ? targetBookId : null);
  const accQ = useAccountQuota(kind === "accounts" ? targetBookId : null);
  const savQ = useSavingQuota(kind === "savings" ? targetBookId : null);
  const memQ = useMemberQuota(kind === "members" ? targetBookId : null);

  const q =
    kind === "books"
      ? bookQ
      : kind === "transactions"
        ? txQ
        : kind === "accounts"
          ? accQ
          : kind === "savings"
            ? savQ
            : memQ;
  if (!q.isNearLimit) return null;

  const isOver = q.isAtLimit;
  const copy = COPY[kind];
  const cls = isOver
    ? "border-rose-200 bg-rose-50 text-rose-800"
    : "border-amber-200 bg-amber-50 text-amber-800";
  const subCls = isOver ? "text-rose-700/80" : "text-amber-700/80";

  const title = isOver
    ? copy.overTitle
    : `${copy.nearTitle} (${q.percentUsed}%)`;

  const description = `Sudah pakai ${q.used} dari ${q.limit} ${copy.label}.${
    isOver ? ` ${copy.descOver}` : ""
  }`;

  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${cls}`}>
      <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className={`text-xs ${subCls}`}>{description}</p>
      </div>
      <Button
        size="sm"
        variant="primary"
        leftIcon={<Zap size={12} />}
        onClick={() => navigate("/dashboard/settings/subscription")}
      >
        Upgrade
      </Button>
    </div>
  );
}
